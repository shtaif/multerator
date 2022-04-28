import pipe from '../../../utils/pipe';
import asyncIterWindow, { windowSplitMark } from '../../asyncIterWindow';
import findOccurrencesInStream from '../findOccurrencesInStream';

export default splitAsyncIterByOccurrence;

async function* splitAsyncIterByOccurrence(
  source: AsyncIterable<Buffer>,
  sequence: Buffer
): AsyncGenerator<AsyncGenerator<Buffer, void>, void> {
  yield* pipe(
    source,
    source => findOccurrencesInStream(source, sequence),
    async function* (sourceWithMatches) {
      let currBuf: Buffer;
      let lastMatchEnd = 0;

      try {
        const firstIteration = await sourceWithMatches.next();

        if (firstIteration.done) {
          return;
        }

        currBuf = firstIteration.value as Buffer;

        for (;;) {
          const item = await sourceWithMatches.next();

          if (item.done) {
            break;
          }

          if (Buffer.isBuffer(item.value)) {
            const remainderOfPrevBuf = lastMatchEnd
              ? currBuf.subarray(lastMatchEnd)
              : currBuf;
            yield remainderOfPrevBuf;

            currBuf = item.value;
            lastMatchEnd = 0;
          } else {
            const bufBeforeThisAndPrevMatches = currBuf.subarray(
              lastMatchEnd,
              item.value.startIdx
            );
            yield bufBeforeThisAndPrevMatches;
            yield windowSplitMark;

            if (item.value.endIdx !== -1) {
              lastMatchEnd = item.value.endIdx;
            } else {
              for (;;) {
                const value = (await sourceWithMatches.next()).value!; // `!` is because the iter is guaranteed to not end while we're in the middle of a multi-chunk occurrence...
                if (Buffer.isBuffer(value)) {
                  currBuf = value;
                } else {
                  lastMatchEnd = value.endIdx;
                  break;
                }
              }
            }
          }
        }
      } finally {
        sourceWithMatches.return();
      }

      const remainderOfPrevBuf = lastMatchEnd
        ? currBuf.subarray(lastMatchEnd)
        : currBuf;
      yield remainderOfPrevBuf;
    },
    asyncIterWindow
  );
}
