import splitAsyncIterByFirstSequence from '../splitAsyncIterByFirstSequence';

export default splitAsyncIterBySequence;

async function* splitAsyncIterBySequence(
  source: AsyncIterable<Buffer>,
  sequence: Buffer | string
): AsyncGenerator<AsyncGenerator<Buffer>> {
  // TODO: Probably need to move the `allowOneActivePartAtATime2` function call to here...
  // TODO: Mormalize input sequence here or in consumer's side? e.g: const sequenceBuf = sequence.constructor === Buffer ? sequence : Buffer.from(sequence);

  const sequenceBuf = Buffer.isBuffer(sequence)
    ? sequence
    : Buffer.from(sequence);

  let rest = source;

  for (;;) {
    const restSplit = splitAsyncIterByFirstSequence(rest, sequenceBuf);

    const chunksUntilMatch = await restSplit.next();

    yield chunksUntilMatch.value as AsyncGenerator<Buffer, void>; // This iterable was guaranteed to yield an initial item and there's no way have TypeScript know that, so...

    const chunksAfterMatch = await restSplit.next();

    if (chunksAfterMatch.done) {
      break;
    }

    rest = chunksAfterMatch.value;
  }
}
