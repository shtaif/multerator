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
  maxHeadersSize?: number;
}): Promise<FilePartInfo | TextPartInfo> {
  const { partStream, maxFileSize, maxFieldSize, maxHeadersSize } = input;

  const headersAndBodyItersSplit = splitAsyncIterByOccurrenceOnce(
    partStream,
    headersEndTokenBuf,
    () =>
      new MulteratorError(
        'Invalid part structure; missing headers-body delimiter token "\\r\\n\\r\\n"',
        'ERR_MISSING_PART_HEADERS_BODY_DELIMITER'
      )
  );

  const headersIter = (await headersAndBodyItersSplit.next())
    .value as AsyncGenerator<Buffer, void>; // Coercing because there's no way to have TypeScript know that this iterable guarantees yielding an initial item...

  const partInfo = await pipe(
    headersIter,
    asyncIterOfBuffersSizeLimiter(maxHeadersSize),
    async function* (source) {
      try {
        yield* source;
      } catch (err) {
        if (err.code === 'ERR_REACHED_SIZE_LIMIT') {
          throw new MulteratorError(
            err.message,
            'ERR_HEADERS_REACHED_SIZE_LIMIT',
            err.info
          );
        }
        throw err;
      }
    },
    parsePartHeaders
  ); // TODO: Handle having the required "Content-Disposition" header not present?...

  const expectedBodyIter = (await headersAndBodyItersSplit.next())
    .value as AsyncGenerator<Buffer, void>; // Coercing because there's no way to have TypeScript know that this iterable guarantees to only either throw error or yield this item...

  const sizeLimitedBody = pipe(
    expectedBodyIter,
    asyncIterOfBuffersSizeLimiter(
      partInfo.filename ? maxFileSize : maxFieldSize
    ),
    async function* (source) {
      try {
        yield* source;
      } catch (err) {
        if (err.code === 'ERR_REACHED_SIZE_LIMIT') {
          throw new MulteratorError(
            err.message,
            'ERR_BODY_REACHED_SIZE_LIMIT',
            {
              ...err.info,
              partInfo: {
                name: partInfo.name,
                contentType: partInfo.contentType,
                filename: partInfo.filename,
              },
            }
          );
        }
        throw err;
      }
    }
  );

  return {
    ...(partInfo.filename
      ? {
          type: 'file',
          data: sizeLimitedBody,
          filename: partInfo.filename,
        }
      : {
          type: 'text',
          data: await concatBufferIterToString(sizeLimitedBody),
          filename: undefined,
        }),
    name: partInfo.name,
    contentType: partInfo.contentType,
    encoding: partInfo.encoding,
  };
}

const headersEndTokenBuf = allocUnsafeSlowFromUtf8('\r\n\r\n');

interface FilePartInfo extends PartInfoCommon {
  type: 'file';
  data: AsyncGenerator<Buffer>;
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
