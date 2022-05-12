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
  let partIter: AsyncIterable<Buffer>;

  const sourceSplitAtInitialBoundary = splitAsyncIterByOccurrenceOnce(
    source,
    Buffer.from(`--${boundaryToken}`)
  );

  const preambleIter = (await sourceSplitAtInitialBoundary.next()).value!;

  await drainIter(preambleIter); // Drain preamble part...

  // const restIter = (await sourceSplitAtInitialBoundary.next()).value;
  // if (!restIter) {
  //   throw new MulteratorError(
  //     'Invalid multipart payload format; stream ended unexpectedly without a closing boundary',
  //     'ERR_MISSING_CLOSING_BOUNDARY' // TODO: Verify "closing boundary" is the correct term for that final boundary
  //   );
  // }

  const restIter =
    (await sourceSplitAtInitialBoundary.next()).value ||
    (() => {
      throw new MulteratorError(
        'Invalid multipart payload format; stream ended unexpectedly without a closing boundary',
        'ERR_MISSING_CLOSING_BOUNDARY' // TODO: Verify "closing boundary" is the correct term for that final boundary
      );
    })();

  const iterOfPartIters = splitAsyncIterByOccurrence(
    restIter,
    Buffer.from(`\r\n--${boundaryToken}`)
  );

  partIter = (await iterOfPartIters.next()).value!; // No need to check `done` since can never be empty - guaranteed at the minimum to yield one single empty sub iter

  while (1) {
    const result = await bufferUntilAccumulatedLength(partIter, 2);
    const peekedBytes = result.result;
    partIter = result.rest;

    if (peekedBytes.equals(CRLF)) {
      yield (async function* () {
        yield* partIter;

        partIter =
          (await iterOfPartIters.next()).value ||
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
}

const CRLF = allocUnsafeSlowFromUtf8('\r\n');
const finalBoundarySuffix = allocUnsafeSlowFromUtf8('--');

// async function* splitMultipartStreamToParts(source, boundaryToken) {
//   // const iterOfPartIters = pipe(
//   //   prependAsyncIter(Buffer.from('\r\n'), source),
//   //   source => {
//   //     // return splitAsyncIterByOccurrence2(source, `\r\n--${boundaryToken}`);
//   //     return splitAsyncIterByOccurrence(source, `\r\n--${boundaryToken}`);
//   //   }
//   //   // allowOneActiveSubIterAtATime
//   // );

//   const sourceSplit = splitAsyncIterByOccurrenceOnce(
//     source,
//     Buffer.from(`--${boundaryToken}`)
//   );

//   const { value: preablePart } = await sourceSplit.next();

//   await drainIter(preablePart); // Drain preample part...

//   const { done___, value: rest } = await sourceSplit.next();

//   const iterOfPartIters = pipe(
//     rest,
//     source => {
//       // return splitAsyncIterByOccurrence2(source, `\r\n--${boundaryToken}`);
//       return splitAsyncIterByOccurrence(source, `\r\n--${boundaryToken}`);
//     }
//     // allowOneActiveSubIterAtATime
//   );

//   let done = false;
//   let partIter;

//   ({ done, value: partIter } = await iterOfPartIters.next()); // No need to check `done` since `iterOfPartIters` can never be empty - guaranteed at the minimum to yield one single empty sub iter

//   await drainIter(partIter); // Drain preamble part...

//   while (1) {
//     ({ done, value: partIter } = await iterOfPartIters.next());

//     if (done) {
//       // TODO: Verify "closing boundary" is the correct term for that final boundary
//       throw new MulteratorError(
//         'Stream ended unexpectedly without a closing boundary',
//         'ERR_MISSING_CLOSING_BOUNDARY'
//       );
//     }

//     const result = await bufferUntilAccumulatedLength(partIter, 2);
//     const peekedBytes = result.result;
//     partIter = result.rest;

//     if (peekedBytes.equals(finalBoundarySuffix)) {
//       break;
//     }

//     if (peekedBytes.equals(CRLF)) {
//       yield partIter;
//       continue;
//     }

//     // TODO: False boundary occurrence ("\r\n"+boundary to be precise); merge with previous part somehow?... Throw?...
//     throw new MulteratorError(
//       'False boundary occurrence - TODO: decide if/how to handle this scenario',
//       '......'
//     );
//   }

//   await drainIter(partIter); // Drain epilogue part...
// }
