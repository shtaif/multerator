import { once } from 'events';
import { Readable } from 'stream';
import pipe from './utils/pipe';
import mapAsyncIter from './iter-utils/mapAsyncIter';
import asyncIterAllowOnlyOneItemAtATime from './iter-utils/asyncIterAllowOnlyOneItemAtATime';
import normalizeInputToAsyncIter from './utils/normalizeInputToAsyncIter';
import splitMultipartStreamToParts from './utils/splitMultipartStreamToParts';
import parseMultipartPart, {
  FilePartInfo,
  TextPartInfo,
} from './utils/parseMultipartPart';

export { multerator as default, FilePartInfo, TextPartInfo };

module.exports = multerator; // To allow importing by simply `const multerator = require('multerator');` inside consuming projects that are plain JavaScript

// TODO: For focused testing - several occurances of the search sequence in a row
// TODO: For focused testing - stream starts with an occurance of search sequence
// TODO: For focused testing - stream ends with an occurance of search sequence - occuring either in the end of the final chunk + occuring exactly as the final chunk
// TODO: For focused testing - stream contains empty buffers - either the first chunk, the final chunk, or somewhere in between + multiple empty buffers in a row
// TODO: Test with ~5000 fields payload to make sure no stack overflow can occure
// TODO: Should account for presence of a known-ahead Content-Type part header for validating limits, for rejecting earlier?
// TODO: Refactor/adjust code for adding Node.js 10.x.x support
// For making a `Readable.from` ponyfill -> https://github.com/nodejs/readable-stream/blob/master/lib/internal/streams/from.js + https://github.com/nodejs/readable-stream/blob/master/errors.js
// TODO: Should really provide a default for `maxFileSize` and `maxFieldSize`?

async function* multerator({
  input,
  boundary,
  maxFileSize,
  maxFieldSize,
}: {
  input: Readable | AsyncIterable<Buffer> | Iterable<Buffer> | Buffer | string;
  boundary: string;
  maxFileSize?: number;
  maxFieldSize?: number;
}): AsyncGenerator<FilePartInfo | TextPartInfo, void, undefined> {
  yield* pipe(
    input,
    normalizeInputToAsyncIter,
    src => splitMultipartStreamToParts(src, boundary),
    mapAsyncIter(partIter =>
      parseMultipartPart({
        partStream: partIter,
        maxFieldSize,
        maxFileSize,
      })
    ),
    partInfos =>
      asyncIterAllowOnlyOneItemAtATime(partInfos, async part => {
        if (part.type === 'file') {
          await once(part.data, 'end');
        }
      })
  );
}
