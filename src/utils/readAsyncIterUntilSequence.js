const CBuffer = require('cbuffer');
const looseAsyncIterWrapper = require('../looseAsyncIterWrapper');
const checkIfAsyncIterEmpty = require('../iter-utils/checkIfAsyncIterEmpty');
const iterFrom = require('../iter-utils/iterFrom');
const cBufferEqualsSequence = require('./cBufferEqualsSequence');

module.exports = readAsyncIterUntilSequence;

function readAsyncIterUntilSequence(source, sequence) {
  const sourceIterator = source[Symbol.asyncIterator]();
  // const sequenceBuf = Buffer.from(sequence);
  const sequenceBuf =
    sequence.constructor === Buffer ? sequence : Buffer.from(sequence);
  const compWindow = new CBuffer(sequenceBuf.length);
  let tempChunk = [];

  let intermediateChunk1 = Buffer.alloc(0);
  let intermediateChunk2 = Buffer.alloc(0);

  // const untilNextOccurance = (async function* () {
  //   for await (const chunk of looseAsyncIterWrapper(sourceIterator)) {
  //     const idx = chunk.indexOf(sequenceBuf);

  //     for (let i = 0; i < chunk.length; ++i) {
  //       compWindow.push(chunk[i]);

  //       if (cBufferEqualsSequence(compWindow, sequenceBuf)) {
  //         const startChunk = chunk.subarray(0, i + 1 - sequenceBuf.length);
  //         const endChunk = chunk.subarray(i + 1);

  //         yield startChunk;

  //         if (endChunk.length) {
  //           tempChunk = iterFrom(endChunk);
  //         }

  //         return;
  //       }
  //     }

  //     yield chunk;
  //   }
  // })();

  const untilNextOccurance = (async function* () {
    let chunk;
    for await (chunk of looseAsyncIterWrapper(sourceIterator)) {
      // let idx;
      // for (;;) {
      //   idx = chunk.indexOf(sequenceBuf);
      //   if (idx === -1) {
      //     yield chunk;
      //     break;
      //   }

      //   const startChunk = chunk.subarray(0, idx + 1 - sequenceBuf.length);
      //   const endChunk = chunk.subarray(idx + 1);

      //   yield startChunk;
      // }

      const idx = chunk.indexOf(sequenceBuf);

      if (idx !== -1) {
        const startChunk = chunk.subarray(0, idx + 1 - sequenceBuf.length);
        const endChunk = chunk.subarray(idx + 1);

        yield startChunk;

        if (endChunk.length) {
          tempChunk = iterFrom(endChunk);
        }

        break;
      }

      yield chunk;
    }
  })();

  //   const untilNextOccurance2 = (async function* () {
  //     const untilMatch = takeFromAsyncIterUntil(
  //       sourceIterator,
  //       chunk => {
  //         for (let i = 0; i < chunk.length; ++i) {
  //           compWindow.push(chunk[i]);

  //           if (cBufferEqualsSequence(compWindow, sequenceBuf)) {
  //             return true;

  //             const startChunk = chunk.subarray(0, i + 1 - sequenceBuf.length);
  //             const endChunk = chunk.subarray(i + 1);

  //             // if (startChunk.length) {
  //             // yield startChunk;
  //             // }

  //             if (endChunk.length) {
  //               tempChunk = iterFrom(endChunk);
  //             }
  //           }
  //         }
  //       },
  //       { includeLast: true }
  //     );

  //     let chunk;
  //     for await (chunk of untilMatch) {
  //       yield chunk;
  //     }
  //     if (chunk !== undefined) {
  //       const startChunk = chunk.subarray(0, i + 1 - sequenceBuf.length);
  //       const endChunk = chunk.subarray(i + 1);
  // }
  //   })();

  const restOfSource = (async function* () {
    yield* tempChunk;
    yield* looseAsyncIterWrapper(sourceIterator);
  })();

  return [untilNextOccurance, restOfSource];
}

async function* takeFromAsyncIterUntil(
  source,
  predicate = () => false,
  { includeLast = false } = {}
) {
  for await (const item of looseAsyncIterWrapper(source)) {
    if (!predicate(item)) {
      if (includeLast) {
        yield item;
      }
      break;
    }
    yield item;
  }
}
