import { Readable } from 'stream';
import { splitAsyncIterByOccurrenceOnce } from '../../utils/iter-utils/splitAsyncIterByOccurrence/index.js';
import asyncIterOfBuffersSizeLimiter from '../../utils/iter-utils/asyncIterOfBuffersSizeLimiter.js';
import concatBufferIterToString from '../../utils/iter-utils/concatBufferIterToString.js';
import asyncBufferIterToReadable from '../../utils/iter-utils/asyncBufferIterToReadable.js';
import allocUnsafeSlowFromUtf8 from '../allocUnsafeSlowFromUtf8.js';
import pipe from '../pipe.js';
import MulteratorError from '../MulteratorError.js';
import parsePartHeaders from './parsePartHeaders/index.js';

export {
  parseMultipartPart as default,
  IncomingPart,
  IncomingTextPart,
  IncomingFilePart,
};

async function parseMultipartPart(params: {
  partStream: AsyncIterable<Buffer>;
  parseTextFields?: true;
  maxFileSize?: number;
  maxFieldSize?: number;
}): Promise<IncomingPart<true>>;
async function parseMultipartPart(params: {
  partStream: AsyncIterable<Buffer>;
  parseTextFields: false;
  maxFileSize?: number;
  maxFieldSize?: number;
}): Promise<IncomingPart<false>>;
async function parseMultipartPart(params: {
  partStream: AsyncIterable<Buffer>;
  parseTextFields: boolean;
  maxFileSize?: number;
  maxFieldSize?: number;
}): Promise<IncomingPart>;
async function parseMultipartPart(params: {
  partStream: AsyncIterable<Buffer>;
  parseTextFields?: boolean;
  maxFileSize?: number;
  maxFieldSize?: number;
}): Promise<IncomingPart> {
  const {
    partStream,
    maxFileSize,
    maxFieldSize,
    parseTextFields = true,
  } = params;

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
          data: asyncBufferIterToReadable(sizeLimitedBody),
          filename: partInfo.filename,
        }
      : {
          type: 'text',
          data: parseTextFields
            ? await concatBufferIterToString(sizeLimitedBody) // TODO: Need to support some methods of specifying a character set for decoding the text body here, right?
            : asyncBufferIterToReadable(sizeLimitedBody),
          filename: undefined,
        }),
  };
}

const headersEndTokenBuf = allocUnsafeSlowFromUtf8('\r\n\r\n');

// TODO: Add documentation next to each property in these structures

type IncomingPart<IsTextBodyParsed extends boolean = boolean> =
  | IncomingTextPart<IsTextBodyParsed>
  | IncomingFilePart;

interface IncomingTextPart<IsTextBodyParsed extends boolean = boolean>
  extends IncomingPartBase {
  type: 'text';
  data: IsTextBodyParsed extends true ? string : Readable;
  filename: undefined;
}

interface IncomingFilePart extends IncomingPartBase {
  type: 'file';
  data: Readable;
  filename: string;
}

interface IncomingPartBase {
  name: string;
  contentType: string;
  encoding: string;
}

// type IncomingPart<IsTextPartParsed extends boolean = boolean> =
//   | IncomingPartBase<'text', IsTextPartParsed>
//   | IncomingPartBase<'file'>;

// type IncomingTextPart<IsParsed extends boolean = boolean> = IncomingPartBase<
//   'text',
//   IsParsed
// >;

// type IncomingFilePart = IncomingPartBase<'file'>;

// type IncomingPartBase<
//   PartType extends 'file' | 'text' = 'file' | 'text',
//   IsTextPartParsed extends boolean = boolean
// > = (PartType extends 'file'
//   ? {
//       type: 'file';
//       data: Readable;
//       filename: string;
//     }
//   : {
//       type: 'text';
//       data: IsTextPartParsed extends true ? string : Readable;
//       filename: undefined;
//     }) & {
//   name: string;
//   contentType: string;
//   encoding: string;
// };
