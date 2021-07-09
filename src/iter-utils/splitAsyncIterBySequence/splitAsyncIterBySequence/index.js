const splitAsyncIterByFirstSequence = require('../splitAsyncIterByFirstSequence');

module.exports = splitAsyncIterBySequence;

async function* splitAsyncIterBySequence(source, sequence) {
  // TODO: Probably need to move the `allowOneActivePartAtATime2` function call to here...
  // TODO: Mormalize input sequence here or in consumer's side? e.g: const sequenceBuf = sequence.constructor === Buffer ? sequence : Buffer.from(sequence);

  const sequenceBuf =
    sequence.constructor === Buffer ? sequence : Buffer.from(sequence);

  let rest = source;

  for (;;) {
    const restSplit = splitAsyncIterByFirstSequence(rest, sequenceBuf);

    const chunksUntilMatch = await restSplit.next();

    yield chunksUntilMatch.value;

    const chunksAfterMatch = await restSplit.next();

    if (chunksAfterMatch.done) {
      break;
    }

    rest = chunksAfterMatch.value;
  }
}
