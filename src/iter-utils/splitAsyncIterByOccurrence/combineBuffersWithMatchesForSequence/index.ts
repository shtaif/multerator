import lastElem from '../../../utils/lastElem';
import pipe from '../../../utils/pipe';
import bufferUntil from '../../bufferUntil';
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
  return source =>
    pipe(
      source,
      async function* (source) {
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
      },
      async function* (sourceWithMatches) {
        // TODO: Should avoid yielding empty buffers by surrounding each line with a `.subarray` call with an index check?

        const sourceIter = sourceWithMatches[Symbol.asyncIterator]();
        let item: BufferWithSequenceMatches;
        let itemToRefeed: BufferWithSequenceMatches | undefined;

        for (;;) {
          if (itemToRefeed) {
            item = itemToRefeed;
            itemToRefeed = undefined;
          } else {
            const iteration = await sourceIter.next();
            if (iteration.done) {
              break;
            }
            item = iteration.value;
          }

          if (item.matches[0]?.endIdx !== -1) {
            yield item;
          } else {
            const matchSuccessionItems = [
              item,
              ...(await bufferMatchSuccession(sourceIter)),
            ];

            const successionLastMatch =
              lastElem(matchSuccessionItems).matches[0];

            if (
              !successionLastMatch ||
              successionLastMatch.startIdx !== -1 ||
              successionLastMatch.endIdx === -1 // <- Checks whether the whole source was finished in the midst of the match succession
            ) {
              if (matchSuccessionItems.length > 1) {
                itemToRefeed = matchSuccessionItems.pop();
              }
              for (let i = 0; i < matchSuccessionItems.length; ++i) {
                matchSuccessionItems[i].matches = [];
              }
            }

            yield* matchSuccessionItems;
          }
        }
      }
    );
}

async function bufferMatchSuccession(
  sourceIter: AsyncIterable<BufferWithSequenceMatches>
): Promise<BufferWithSequenceMatches[]> {
  const result = await bufferUntil(
    sourceIter,
    ({ matches }) =>
      !matches.length ||
      !(matches[0].startIdx === -1 && matches[0].endIdx === -1),
    { includeLast: true }
  );
  const { buffered: itemsOfMatchSuccession /*, done*/ } = result;
  return itemsOfMatchSuccession;
}

interface BufferWithSequenceMatches {
  buffer: Buffer;
  matches: SequenceOccurancePosition[];
}
