import {
  splitAsyncIterByOccurrence,
  splitAsyncIterByOccurrenceOnce,
} from '../../iter-utils/splitAsyncIterByOccurrence';
import bufferUntilAccumulatedLength from '../../iter-utils/bufferUntilAccumulatedLength';
import allocUnsafeSlowFromUtf8 from '../allocUnsafeSlowFromUtf8';
import MulteratorError from '../MulteratorError';
import drainIter from './drainIter';

export default splitMultipartStreamToParts;

async function* splitMultipartStreamToParts(
  source: AsyncIterable<Buffer>,
  boundaryToken: Buffer | string
): AsyncGenerator<AsyncGenerator<Buffer, void>, void> {
  let sourceSplitAtInitialBoundary;
  let sourceSplitByBoundariesIter;

  try {
    sourceSplitAtInitialBoundary = splitAsyncIterByOccurrenceOnce(
      source,
      Buffer.from(`--${boundaryToken}`)
    );

    const preambleIter = (await sourceSplitAtInitialBoundary.next()).value!; // No need to check `done` since can never be empty - guaranteed at the minimum to yield one single empty sub iter

    await drainIter(preambleIter); // Drain preamble part...

    const postInitialBoundaryIter =
      (await sourceSplitAtInitialBoundary.next()).value ||
      (() => {
        throw new MulteratorError(
          'Invalid multipart payload format; stream ended unexpectedly without a closing boundary',
          'ERR_MISSING_CLOSING_BOUNDARY' // TODO: Verify "closing boundary" is the correct term for that final boundary
        );
      })();

    sourceSplitByBoundariesIter = splitAsyncIterByOccurrence(
      postInitialBoundaryIter,
      Buffer.from(`\r\n--${boundaryToken}`)
    );

    let partIter: AsyncIterable<Buffer>;

    partIter = (await sourceSplitByBoundariesIter.next()).value!; // No need to check `done` since can never be empty - guaranteed at the minimum to yield one single empty sub iter

    while (1) {
      const result = await bufferUntilAccumulatedLength(partIter, 2);
      const peekedBytes = result.result;
      partIter = result.rest;

      if (peekedBytes.equals(CRLF)) {
        yield (async function* () {
          yield* partIter;

          partIter =
            (await sourceSplitByBoundariesIter.next()).value ||
            (() => {
              throw new MulteratorError(
                'Invalid multipart payload format; stream ended unexpectedly without a closing boundary',
                'ERR_MISSING_CLOSING_BOUNDARY' // TODO: Verify "closing boundary" is the correct term for that final boundary
              );
            })();
        })();

        continue;
      }

      if (peekedBytes.equals(finalBoundarySuffix)) {
        break;
      }

      // TODO: False boundary occurrence ("\r\n"+boundary to be precise); merge with previous part somehow?... Throw?...
      throw new MulteratorError(
        'Invalid multipart payload format; false boundary occurrence - TODO: decide if/how to handle this scenario',
        '......'
      );
    }

    await drainIter(partIter); // Drain epilogue part...
  } finally {
    // TODO: Figure why we must close both these two, instead of that closing just the subsequent/later one would already in turn close the former (as they are piped into one another after all)
    await sourceSplitAtInitialBoundary?.return();
    await sourceSplitByBoundariesIter?.return();
  }
}

const CRLF = allocUnsafeSlowFromUtf8('\r\n');
const finalBoundarySuffix = allocUnsafeSlowFromUtf8('--');
