import { once } from 'events';
import { Readable } from 'stream';
import pipe from './utils/pipe';
import mapAsyncIter from './iter-utils/mapAsyncIter';
import asyncIterAllowOnlyOneItemAtATime from './iter-utils/asyncIterAllowOnlyOneItemAtATime';
import normalizeInputToAsyncIter from './utils/normalizeInputToAsyncIter';
import splitMultipartStreamToParts from './utils/splitMultipartStreamToParts';
import parseMultipartPart, {
  IncomingPart,
  IncomingTextPart,
  IncomingFilePart,
} from './utils/parseMultipartPart';

export {
  multerator as default,
  IncomingPart,
  IncomingTextPart,
  IncomingFilePart,
};

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

function multerator(params: {
  input: Readable | AsyncIterable<Buffer> | Iterable<Buffer> | Buffer | string;
  boundary: string;
  parseTextFields?: true;
  maxFileSize?: number;
  maxFieldSize?: number;
}): AsyncGenerator<IncomingPart<true>, void, undefined>;
function multerator(params: {
  input: Readable | AsyncIterable<Buffer> | Iterable<Buffer> | Buffer | string;
  boundary: string;
  parseTextFields: false;
  maxFileSize?: number;
  maxFieldSize?: number;
}): AsyncGenerator<IncomingPart<false>, void, undefined>;
async function* multerator(params: {
  input: Readable | AsyncIterable<Buffer> | Iterable<Buffer> | Buffer | string;
  boundary: string;
  parseTextFields?: boolean;
  maxFileSize?: number;
  maxFieldSize?: number;
}): AsyncGenerator<IncomingPart, void, undefined> {
  const {
    input,
    boundary,
    maxFileSize,
    maxFieldSize,
    parseTextFields = true,
  } = params;

  yield* pipe(
    input,
    normalizeInputToAsyncIter,
    src => splitMultipartStreamToParts(src, boundary),
    mapAsyncIter(partIter =>
      parseMultipartPart({
        partStream: partIter,
        parseTextFields,
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
