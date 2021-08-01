import pipe from '../../../utils/pipe';
import lastElem from '../../../utils/lastElem';
import bufferUntil from '../../bufferUntil';
import asyncIterWindowBetweenOccuranceOf from '../../asyncIterWindowBetweenOccuranceOf';
import combineBuffersWithMatchesForSequence, {
  BufferWithSequenceMatches,
} from '../combineBuffersWithMatchesForSequence';

export default splitAsyncIterByFirstSequence;

function splitAsyncIterByFirstSequence(
  originalSource: AsyncIterable<Buffer>,
  sequenceBuf: Buffer
): AsyncGenerator<AsyncGenerator<Buffer, void>, void> {
  return pipe(
    originalSource,
    combineBuffersWithMatchesForSequence(sequenceBuf),
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

        if (!item.matches.length) {
          yield item.buffer;
        } else if (item.matches[0].endIdx !== -1) {
          const { startIdx, endIdx } = item.matches[0];
          const bufferBeforeMatchStart = item.buffer.subarray(0, startIdx);
          const bufferAfterMatchEnd = item.buffer.subarray(endIdx);
          yield bufferBeforeMatchStart;
          yield splitMarker;
          yield bufferAfterMatchEnd;
          break;
        } else {
          const matchSuccessionItems = [
            item,
            ...(await bufferMatchSuccession(sourceIter)),
          ];

          const successionLast = lastElem(matchSuccessionItems);

          if (
            !successionLast.matches[0] ||
            successionLast.matches[0].startIdx !== -1 ||
            successionLast.matches[0].endIdx === -1 // <- Checks whether the whole source was finished in the midst of the match succession
          ) {
            if (matchSuccessionItems.length > 1) {
              itemToRefeed = matchSuccessionItems.pop();
            }
            for (let i = 0; i < matchSuccessionItems.length; ++i) {
              yield matchSuccessionItems[i].buffer;
            }
          } else {
            const bufferBeforeMatchStart =
              matchSuccessionItems[0].buffer.subarray(
                0,
                matchSuccessionItems[0].matches[0].startIdx
              );
            const bufferAfterMatchEnd = successionLast.buffer.subarray(
              successionLast.matches[0].endIdx
            );
            yield bufferBeforeMatchStart;
            yield splitMarker;
            yield bufferAfterMatchEnd;
            break;
          }
        }
      }

      yield* originalSource;
    },
    asyncIterWindowBetweenOccuranceOf(splitMarker)
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

const splitMarker = {} as const;
