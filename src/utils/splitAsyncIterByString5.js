const CBuffer = require('cbuffer');
const {
  splitAsyncIter,
  splitAsyncIter2,
} = require('../iter-utils/splitAsyncIter');
const pipe = require('../pipe');
const filterAsyncIter = require('../filterAsyncIter');
const mapAsyncIter = require('../mapAsyncIter');
const checkIfAsyncIterEmpty = require('../iter-utils/checkIfAsyncIterEmpty');
const cBufferEqualsSequence = require('./cBufferEqualsSequence');

module.exports = splitAsyncIterByString5;

function splitAsyncIterByString5(delimiter) {
  return async function* (source) {
    if (!delimiter) {
      yield source;
    }

    const delimiterBuf = Buffer.from(delimiter);
    const compWindow = new CBuffer(delimiterBuf.length);
    let skipNextChar = false; // TODO: It's probably better to remove this and allow parsing of subsequent pattern occurances and DO emit a zero-length buffer

    yield* pipe(
      source,
      splitAsyncIter(chunk => {
        for (let i = 0; i < chunk.length; ++i) {
          compWindow.push(chunk[i]);

          if (skipNextChar) {
            // skipNextChar = false;
          } else if (cBufferEqualsSequence(compWindow, delimiterBuf)) {
            // skipNextChar = true;

            const startChunk = chunk.subarray(0, i + 1 - delimiterBuf.length);
            const endChunk = chunk.subarray(i + 1);

            return {
              split: true,
              appendToLast: startChunk.length && startChunk,
              prependToNew: endChunk.length && endChunk,
            };
          }
        }

        return { split: false };
      }),
      mapAsyncIter(checkIfAsyncIterEmpty),
      // filterAsyncIter(Boolean)
      filterAsyncIter((subIter, i) => {
        return i !== 0 && subIter !== undefined;
      })
      // TODO: Also filter out an `undefined` from the end boundary somehow?
    );
  };
}
