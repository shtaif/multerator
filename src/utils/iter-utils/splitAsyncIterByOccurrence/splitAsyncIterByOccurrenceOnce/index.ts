import pipe from '../../../../utils/pipe';
import asyncIterWindow, { windowSplitMark } from '../../asyncIterWindow';
import findOccurrencesInStream from '../findOccurrencesInStream';

export default splitAsyncIterByOccurrenceOnce;

async function* splitAsyncIterByOccurrenceOnce(
  source: AsyncIterable<Buffer>,
  sequence: Buffer,
  optionalErrorOnNoOccurrence?: Function
): AsyncGenerator<AsyncGenerator<Buffer, void>, void> {
  yield* pipe(
    source,
    source => findOccurrencesInStream(source, sequence),
    async function* (sourceWithMatches) {
      let currBuf: Buffer;

      try {
        const firstIteration = await sourceWithMatches.next();

        if (firstIteration.done) {
          return;
        }

        currBuf = firstIteration.value as Buffer; // First iteration from `findOccurrencesInStream`'s output is guaranteed to be a buffer

        for await (const value of sourceWithMatches) {
          if (Buffer.isBuffer(value)) {
            yield currBuf;
            currBuf = value;
          } else {
            const bufBeforeMatch = currBuf.subarray(0, value.startIdx);
            yield bufBeforeMatch;

            yield windowSplitMark;

            let endingMatchBuf;

            if (value.endIdx !== -1) {
              endingMatchBuf = currBuf.subarray(value.endIdx);
            } else {
              let currBufInMultiBufMatch = currBuf;

              for (;;) {
                const value = (await sourceWithMatches.next()).value!;
                if (Buffer.isBuffer(value)) {
                  currBufInMultiBufMatch = value;
                } else {
                  endingMatchBuf = currBufInMultiBufMatch.subarray(
                    value.endIdx
                  );
                  break;
                }
              }
            }

            yield endingMatchBuf;
            yield* source;
            return;
          }
        }
      } finally {
        await sourceWithMatches.return();
      }

      yield currBuf;
    },
    !optionalErrorOnNoOccurrence
      ? partWindows => partWindows
      : async function* (chunksOrSplit) {
          for await (const item of chunksOrSplit) {
            yield item;
            if (item === windowSplitMark) {
              yield* chunksOrSplit;
              return;
            }
          }
          throw optionalErrorOnNoOccurrence();
        },
    asyncIterWindow
  );
}
