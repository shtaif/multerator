import pipe from './utils/pipe';
import mapAsyncIter from './iter-utils/mapAsyncIter';
import normalizeInputToAsyncIter from './utils/normalizeInputToAsyncIter';
import splitMultipartStreamToParts from './utils/splitMultipartStreamToParts';
import parseMultipartPart, {
  FilePartInfo,
  TextPartInfo,
} from './utils/parseMultipartPart';

export { multerator as default, FilePartInfo, TextPartInfo };

// TODO: For focused testing - several occurances of the search sequence in a row
// TODO: For focused testing - stream starts with an occurance of search sequence
// TODO: For focused testing - stream ends with an occurance of search sequence - occuring either in the end of the final chunk + occuring exactly as the final chunk
// TODO: For focused testing - stream contains empty buffers - either the first chunk, the final chunk, or somewhere in between + multiple empty buffers in a row
// TODO: Test with ~5000 fields payload to make sure no stack overflow can occure
// TODO: Test with a stream that ends unexpectedly with no closing boundary emitted
// TODO: Tests for `normalizeInputToAsyncIter`?...
// TODO: Should account for presence of a known-ahead Content-Type part header for validating limits, for rejecting earlier?
// TODO: Refactor/adjust code for adding Node.js 10.x.x support
// For making a `Readable.from` ponyfill -> https://github.com/nodejs/readable-stream/blob/master/lib/internal/streams/from.js + https://github.com/nodejs/readable-stream/blob/master/errors.js
// TODO: Should really provide a default for `maxFileSize` and `maxFieldSize`?

async function* multerator({
  input,
  boundary,
  maxFileSize = defaultMaxFileSize,
  maxFieldSize = defaultMaxFieldSize,
}: {
  input: AsyncIterable<Buffer>;
  boundary: string;
  maxFileSize?: number;
  maxFieldSize?: number;
}) {
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
    )
  );
}

const defaultMaxFileSize = 1024 ** 2 * 100;
const defaultMaxFieldSize = 1024 * 100;

// async function* multerator2({} = {}) {
//   const { Readable } = require('stream');
//   const {
//     splitAsyncIterBySequence2,
//     splitAsyncIterBySequence,
//     splitAsyncIterByFirstSequence,
//   } = require('./iter-utils/splitAsyncIterBySequence');

//   yield* [];

//   function log(value) {
//     console.log(JSON.stringify(value, null, 2));
//   }

//   async function getNext(iter) {
//     const { done, value } = await iter.next();
//     // return done ? undefined : value + '';
//     return { done, value: value + '' };
//   }

//   const testIter = [
//     '--1',
//     '23-',
//     '-45',
//     '6--',
//     '789--',
//     '-',
//     '-',
//     '-',
//     '-11-1-1-',
//   ].map(str => Buffer.from(str));
//   // const res = splitAsyncIterBySequence2(testIter, Buffer.from('--'));
//   global.testIter = testIter;
//   global.splitAsyncIterBySequence2 = splitAsyncIterBySequence2;
//   global.splitAsyncIterByFirstSequence = splitAsyncIterByFirstSequence;

//   let arr;
//   let res;
//   let part;

//   arr = [];

//   res = splitAsyncIterBySequence(
//     Readable.from(testIter, { objectMode: false }),
//     Buffer.from('--')
//   );

//   for await (const part of res) {
//     console.log('---- START ----');
//     for await (const chunk of part) {
//       if (chunk.length) {
//         console.log(chunk + '');
//       }
//     }
//     // console.log('---- END ----\n');
//   }

//   throw 'END OF SOURCE STREAM';

//   //   part = await res.next();

//   //   log(await getNext(part.value));
//   //   log(await getNext(part.value));

//   //   part = await res.next();

//   //   log(await getNext(part.value));
//   //   log(await getNext(part.value));
//   //   log(await getNext(part.value));

//   //   part = await res.next();

//   //   console.log('!!!!!!!!!1');

//   //   log(await getNext(part.value));
//   //   log(await getNext(part.value));
//   //   log(await getNext(part.value));

//   //   console.log('!!!!!!!!!2');

//   //   part = await res.next();

//   //   log(await getNext(part.value));
//   //   log(await getNext(part.value));
//   //   log(await getNext(part.value));
// }
