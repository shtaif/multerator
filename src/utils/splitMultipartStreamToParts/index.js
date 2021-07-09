const pipe = require('../pipe');
const {
  splitAsyncIterBySequence,
  // splitAsyncIterByFirstSequence,
} = require('../../iter-utils/splitAsyncIterBySequence');
const allowOneActiveSubIterAtATime = require('../../iter-utils/allowOneActiveSubIterAtATime');
const bufferUntilAccumulatedLength = require('../../iter-utils/bufferUntilAccumulatedLength');
const prependAsyncIter = require('../../iter-utils/prependAsyncIter');
const allocUnsafeSlowFromUtf8 = require('../allocUnsafeSlowFromUtf8');
const MultiParserError = require('../MultiParserError');
const drainIter = require('./drainIter');

module.exports = splitMultipartStreamToParts;

async function* splitMultipartStreamToParts(source, boundaryToken) {
  const iterOfPartIters = pipe(
    source,
    src => prependAsyncIter(Buffer.from('\r\n'), src), // TODO: Revise this work-around of prepending here; will probably FAIL every time there would any kind of preample content!...
    src => splitAsyncIterBySequence(src, `\r\n--${boundaryToken}`),
    allowOneActiveSubIterAtATime
  );

  let done = false;
  let partIter;

  ({ value: partIter } = await iterOfPartIters.next()); // No need to check `done` since `iterOfPartIters` can never be empty - guaranteed at the minimum to yield one single empty sub iter

  await drainIter(partIter); // Drain preamble part...

  ({ done, value: partIter } = await iterOfPartIters.next());

  if (done) {
    throw new MultiParserError(
      'Invalid multipart payload format; stream ended unexpectedly without a closing boundary',
      'ERR_MISSING_CLOSING_BOUNDARY' // TODO: Verify "closing boundary" is the correct term for that final boundary
    );
  }

  while (1) {
    const result = await bufferUntilAccumulatedLength(partIter, 2);
    const peekedBytes = result.result;
    partIter = result.rest;

    if (peekedBytes.equals(interBoundarySuffixBuf)) {
      yield (async function* () {
        yield* partIter;

        ({ done, value: partIter } = await iterOfPartIters.next());

        if (done) {
          throw new MultiParserError(
            'Invalid multipart payload format; stream ended unexpectedly without a closing boundary',
            'ERR_MISSING_CLOSING_BOUNDARY' // TODO: Verify "closing boundary" is the correct term for that final boundary
          );
        }
      })();

      continue;
    }

    if (peekedBytes.equals(finalBoundarySuffixBuf)) {
      break;
    }

    // TODO: False boundary occurrence ("\r\n"+boundary to be precise); merge with previous part somehow?... Throw?...
    throw new MultiParserError(
      'Invalid multipart payload format; false boundary occurrence - TODO: decide if/how to handle this scenario',
      '......'
    );
  }

  await drainIter(partIter); // Drain epilogue part...
}

const interBoundarySuffixBuf = allocUnsafeSlowFromUtf8('\r\n');
const finalBoundarySuffixBuf = allocUnsafeSlowFromUtf8('--');

// async function* splitMultipartStreamToParts(source, boundaryToken) {
//   // const iterOfPartIters = pipe(
//   //   prependAsyncIter(Buffer.from('\r\n'), source),
//   //   source => {
//   //     // return splitAsyncIterBySequence2(source, `\r\n--${boundaryToken}`);
//   //     return splitAsyncIterBySequence(source, `\r\n--${boundaryToken}`);
//   //   }
//   //   // allowOneActiveSubIterAtATime
//   // );

//   const sourceSplit = splitAsyncIterByFirstSequence(
//     source,
//     Buffer.from(`--${boundaryToken}`)
//   );

//   const { value: preablePart } = await sourceSplit.next();

//   await drainIter(preablePart); // Drain preample part...

//   const { done___, value: rest } = await sourceSplit.next();

//   const iterOfPartIters = pipe(
//     rest,
//     source => {
//       // return splitAsyncIterBySequence2(source, `\r\n--${boundaryToken}`);
//       return splitAsyncIterBySequence(source, `\r\n--${boundaryToken}`);
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
//       throw new MultiParserError(
//         'Stream ended unexpectedly without a closing boundary',
//         'ERR_MISSING_CLOSING_BOUNDARY'
//       );
//     }

//     const result = await bufferUntilAccumulatedLength(partIter, 2);
//     const peekedBytes = result.result;
//     partIter = result.rest;

//     if (peekedBytes.equals(finalBoundarySuffixBuf)) {
//       break;
//     }

//     if (peekedBytes.equals(interBoundarySuffixBuf)) {
//       yield partIter;
//       continue;
//     }

//     // TODO: False boundary occurrence ("\r\n"+boundary to be precise); merge with previous part somehow?... Throw?...
//     throw new MultiParserError(
//       'False boundary occurrence - TODO: decide if/how to handle this scenario',
//       '......'
//     );
//   }

//   await drainIter(partIter); // Drain epilogue part...
// }
