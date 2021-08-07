import pipe from '../../../utils/pipe';
import looseAsyncIterWrapper from '../../looseAsyncIterWrapper';
import combineBuffersWithMatchesForSequence from '../combineBuffersWithMatchesForSequence';
import propagateErrorFromAsyncSubIter from './propagateErrorFromAsyncSubIter';

export default splitAsyncIterByOccuranceOnce;

function splitAsyncIterByOccuranceOnce(
  originalSource: AsyncIterable<Buffer>,
  sequenceBuf: Buffer
): AsyncGenerator<AsyncGenerator<Buffer, void>, void> {
  return pipe(
    originalSource,
    combineBuffersWithMatchesForSequence(sequenceBuf),
    looseAsyncIterWrapper,
    async function* (sourceWithMatches) {
      let bufferAfterOccurrence: Buffer | undefined;
      let foundOccurrence = false;

      yield (async function* () {
        for await (const item of sourceWithMatches) {
          if (!item.matches.length) {
            yield item.buffer;
            continue;
          } else {
            foundOccurrence = true;

            const { startIdx, endIdx } = item.matches[0];
            const bufferBeforeOccurrence = item.buffer.subarray(0, startIdx);
            yield bufferBeforeOccurrence;

            bufferAfterOccurrence =
              endIdx !== -1
                ? item.buffer.subarray(endIdx)
                : await (async () => {
                    for await (const item of sourceWithMatches) {
                      const { buffer } = item;
                      const { endIdx } = item.matches[0];
                      if (endIdx !== -1) {
                        return buffer.subarray(endIdx);
                      }
                    }
                  })();

            break;
          }
        }
      })();

      if (foundOccurrence) {
        yield (async function* () {
          if (bufferAfterOccurrence) {
            yield bufferAfterOccurrence;
          }
          yield* originalSource;
        })();
      }
    },
    splitSource => propagateErrorFromAsyncSubIter(splitSource)
  );
}
