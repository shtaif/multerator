import { Readable } from 'stream';
import pipe from '../pipe';
import { splitAsyncIterByOccurrenceOnce } from '../../iter-utils/splitAsyncIterByOccurrence';
import asyncIterOfBuffersSizeLimiter from '../../iter-utils/asyncIterOfBuffersSizeLimiter';
import concatBufferIterToString from '../../iter-utils/concatBufferIterToString';
import allocUnsafeSlowFromUtf8 from '../allocUnsafeSlowFromUtf8';
import parsePartHeaders from './parsePartHeaders';
import MulteratorError from '../MulteratorError';

export { parseMultipartPart as default, FilePartInfo, TextPartInfo };

async function parseMultipartPart(input: {
  partStream: AsyncIterable<Buffer>;
  maxFileSize?: number;
  maxFieldSize?: number;
}): Promise<FilePartInfo | TextPartInfo> {
  const { partStream, maxFileSize, maxFieldSize } = input;

  const headersAndBodyItersSplit = splitAsyncIterByOccurrenceOnce(
    partStream,
    headersEndTokenBuf,
    () =>
      new MulteratorError(
        'Invalid part structure; missing headers-body delimiter token "\\r\\n\\r\\n"',
        'ERR_MISSING_PART_HEADERS_BODY_DELIMITER'
      )
  );

  const headersIter = (await headersAndBodyItersSplit.next()).value!; // Asserting as non-null because there's no way to have TypeScript know that this iterable guarantees yielding an initial item...

  const partInfo = await parsePartHeaders(headersIter);

  const expectedBodyIter = (await headersAndBodyItersSplit.next()).value!; // Asserting as non-null because there's no way to have TypeScript know that this iterable guarantees to only either throw error or yield this item...

  const sizeLimitedBody = pipe(
    expectedBodyIter,
    asyncIterOfBuffersSizeLimiter(
      partInfo.filename ? maxFileSize : maxFieldSize,
      sizeLimit =>
        new MulteratorError(
          `Crossed max size limit of ${sizeLimit.toLocaleString()} bytes`,
          'ERR_BODY_REACHED_SIZE_LIMIT',
          {
            sizeLimitBytes: sizeLimit,
            partInfo: {
              name: partInfo.name,
              contentType: partInfo.contentType,
              filename: partInfo.filename,
            },
          }
        )
    )
  );

  return {
    name: partInfo.name,
    contentType: partInfo.contentType,
    encoding: partInfo.encoding,
    ...(partInfo.filename // TODO: Is the `filename` param allowed to be present but empty (e.g `name="something"; filename=""`)?
      ? {
          type: 'file',
          data: Readable.from(sizeLimitedBody, {
            objectMode: false,
            highWaterMark: 0,
          }),
          filename: partInfo.filename,
        }
      : {
          type: 'text',
          data: await concatBufferIterToString(sizeLimitedBody), // TODO: Need to support some methods of specifying a character set for decoding the text body here, right?
          filename: undefined,
        }),
  };
}

const headersEndTokenBuf = allocUnsafeSlowFromUtf8('\r\n\r\n');

interface FilePartInfo extends PartInfoCommon {
  type: 'file';
  data: Readable;
  filename: string;
}

interface TextPartInfo extends PartInfoCommon {
  type: 'text';
  data: string;
  filename: undefined;
}

interface PartInfoCommon {
  name: string;
  contentType: string;
  encoding: string;
}
