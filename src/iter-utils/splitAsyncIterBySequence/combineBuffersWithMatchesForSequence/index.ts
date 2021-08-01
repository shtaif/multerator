import findPossibleMatchesInBuffer, {
  SequenceOccurancePosition,
} from './findPossibleMatchesInBuffer';

export {
  combineBuffersWithMatchesForSequence as default,
  BufferWithSequenceMatches,
  SequenceOccurancePosition,
};

function combineBuffersWithMatchesForSequence(
  sequenceBuf: Buffer
): (
  src: AsyncIterable<Buffer>
) => AsyncGenerator<BufferWithSequenceMatches, void> {
  return async function* (source) {
    let nextSearchStartIdx = 0;

    for await (const buffer of source) {
      // TODO: Move this empty buffer guard to somewhere else? (either to higher level or more bottom level from here)
      // TODO: QA `findPossibleMatchesInBuffer` in isolation - having `buffer` as empty buffer - combined with zero `nextSearchStartIdx` / non-zero `nextSearchStartIdx`?

      const matches = buffer.length
        ? [
            ...findPossibleMatchesInBuffer(
              buffer,
              sequenceBuf,
              nextSearchStartIdx
            ),
          ]
        : [];

      if (!matches.length) {
        nextSearchStartIdx = 0;
      } else {
        const lastMatch = matches[matches.length - 1];
        if (lastMatch.startIdx === -1 && lastMatch.endIdx === -1) {
          nextSearchStartIdx += buffer.length;
        } else if (lastMatch.startIdx !== -1 && lastMatch.endIdx === -1) {
          nextSearchStartIdx = buffer.length - lastMatch.startIdx;
        }
      }

      yield { buffer, matches };
    }
  };
}

interface BufferWithSequenceMatches {
  buffer: Buffer;
  matches: SequenceOccurancePosition[];
}
