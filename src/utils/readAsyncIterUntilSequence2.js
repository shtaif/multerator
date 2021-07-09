const looseAsyncIterWrapper = require('../iter-utils/looseAsyncIterWrapper');

module.exports = readAsyncIterUntilSequence;

function readAsyncIterUntilSequence(source, sequence) {
  const sequenceBuf =
    sequence.constructor === Buffer ? sequence : Buffer.from(sequence);
  let tempChunk;

  const untilNextOccurance = (async function* () {
    let chunk;

    for await (chunk of looseAsyncIterWrapper(source)) {
      // if (tempChunk) {
      //   yield tempChunk;
      // }

      const idx = chunk.indexOf(sequenceBuf);

      if (idx !== -1) {
        const beforeMatchSubChunk = chunk.subarray(0, idx);
        const afterMatchSubChunk = chunk.subarray(idx + sequenceBuf.length);

        yield beforeMatchSubChunk;

        if (afterMatchSubChunk.length) {
          tempChunk = afterMatchSubChunk;
        }

        break;
      }

      yield chunk;
    }
  })();

  const restOfSource = (async function* () {
    if (tempChunk) {
      yield tempChunk;
    }
    yield* looseAsyncIterWrapper(source);
  })();

  return [untilNextOccurance, restOfSource];
}
