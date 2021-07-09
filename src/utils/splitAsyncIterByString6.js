const CBuffer = require('cbuffer');
const { splitAsyncIter2 } = require('../iter-utils/splitAsyncIter');
const pipe = require('../pipe');
const cBufferEqualsSequence = require('./cBufferEqualsSequence');

module.exports = splitAsyncIterByString6;

function splitAsyncIterByString6(delimiter) {
  return async function* (source) {
    if (!delimiter) {
      yield source;
    }

    const delimiterBuf = Buffer.from(delimiter);
    const compWindow = new CBuffer(delimiterBuf.length);
    let a = [];
    let b = [];

    yield* pipe(
      source,
      async function* (source) {
        for await (const chunk of source) {
          yield chunk;
          while (b.length) {
            yield b.shift();
          }
        }
      },
      splitAsyncIter2(chunk => {
        // const str = chunk.toString('utf-8');

        for (let i = 0; i < chunk.length; ++i) {
          compWindow.push(chunk[i]);

          if (cBufferEqualsSequence(compWindow, delimiterBuf)) {
            const startChunk = chunk.subarray(0, i + 1 - delimiterBuf.length);
            const endChunk = chunk.subarray(i + 1);

            a.push(startChunk);
            b.push(endChunk);

            // a.CHUNK = startChunk.toString('utf-8');
            // b.CHUNK = endChunk.toString('utf-8');

            // tempChunks.a = iterFrom(startChunk);
            // tempChunks.b = iterFrom(endChunk);

            return true;
          }
        }

        return false;
      }),
      async function* (source) {
        for await (const partIter of source) {
          yield (async function* () {
            yield* partIter;
            while (a.length) {
              yield a.shift();
            }
          })();
        }
      }
      // async function* (source) {
      //   for await (const partIter of source) {
      //     yield (async function* () {
      //       for await (const chunk of partIter) {
      //         const str = chunk.toString('utf-8');
      //         console.log(
      //           `>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>${str}`
      //         );
      //         yield chunk;
      //       }
      //     })();
      //   }
      // }
      // mapAsyncIter(checkIfAsyncIterEmpty),
      // filterAsyncIter(Boolean)
      // filterAsyncIter((subIter, i) => {
      //   return i !== 0 && subIter !== undefined;
      // })
      // TODO: Also filter out an `undefined` from the end boundary somehow?
    );
  };
}
