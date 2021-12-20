const pipe = require('../utils/pipe');
const asyncIterWindow = require('./asyncIterWindow');
const looseAsyncIterWrapper = require('./looseAsyncIterWrapper');
const mapAsyncIter = require('./mapAsyncIter');

module.exports = splitAsyncIterByString;

function splitAsyncIterByString(source, delimiter) {
  // TODO: Really necessary to wrap right here with `looseAsyncIterWrapper`?
  const wrappedSource = looseAsyncIterWrapper(source);

  const delimiterBuf =
    delimiter.constructor === Buffer ? delimiter : Buffer.from(delimiter);
  let pendingMatchChunks = [];
  let pendingMatchTotalLength = 0;
  let pendingMatchPreChunk;
  let chunk;
  let chunkLastMatchEnd = 0;

  const splitIter = pipe(
    wrappedSource,
    async function* (src) {
      for await (chunk of src) {
        if (
          pendingMatchChunks.length &&
          pendingMatchTotalLength + chunk.length >= delimiterBuf.length
        ) {
          const hasMatch = chunk
            .subarray(0, delimiterBuf.length - pendingMatchTotalLength)
            .equals(delimiterBuf.subarray(pendingMatchTotalLength));

          const pendingMatchChunksToUse = pendingMatchChunks;
          const pendingMatchTotalLengthToUse = pendingMatchTotalLength;
          const pendingMatchPreChunkToUse = pendingMatchPreChunk;
          pendingMatchChunks = [];
          pendingMatchTotalLength = 0;
          pendingMatchPreChunk = undefined;

          if (hasMatch) {
            chunk = chunk.subarray(
              delimiterBuf.length - pendingMatchTotalLengthToUse
            );
          }

          yield {
            splitAfterThis: hasMatch,
            chunk: pendingMatchPreChunkToUse,
          };

          if (!hasMatch) {
            for (let i = 0; i < pendingMatchChunksToUse.length; ++i) {
              yield {
                splitAfterThis: false,
                chunk: pendingMatchChunksToUse[i],
              };
            }
          }
        }

        chunkLastMatchEnd = 0;

        for (;;) {
          const matchIdx = chunk.indexOf(delimiterBuf, chunkLastMatchEnd);

          if (matchIdx === -1) {
            break;
          }

          const next = chunk.subarray(chunkLastMatchEnd, matchIdx);

          chunkLastMatchEnd = matchIdx + delimiterBuf.length;

          yield {
            splitAfterThis: true,
            chunk: next,
          };
        }

        const chunkRemainderStartIdx = Math.max(
          chunk.length - delimiterBuf.length - 1,
          chunkLastMatchEnd
        );

        // const partialMatch = findPartialMatchOnEnd(
        //   chunk,
        //   delimiterBuf,
        //   chunkRemainderStartIdx
        // );

        const partialMatch = (() => {
          if (chunk.length >= delimiterBuf.length) {
            return findPartialMatchOnEnd(
              chunk,
              delimiterBuf,
              chunkRemainderStartIdx
            );
          }
          return findPartialMatchOnStart(
            delimiterBuf,
            chunk,
            pendingMatchTotalLength
          );

          // if (delimiterBuf.indexOf(chunk, ))
        })();

        if (partialMatch) {
          pendingMatchChunks.push(partialMatch);
          pendingMatchTotalLength += partialMatch.length;
          pendingMatchPreChunk = chunk.subarray(
            chunkLastMatchEnd,
            -partialMatch.length
          );
        } else {
          yield {
            splitAfterThis: false,
            chunk: chunk.subarray(chunkLastMatchEnd),
          };
        }
      }

      if (pendingMatchChunks.length) {
        yield {
          splitAfterThis: false,
          chunk: pendingMatchPreChunk,
        };

        for (let i = 0; i < pendingMatchChunks.length; ++i) {
          yield {
            splitAfterThis: false,
            chunk: pendingMatchChunks[i],
          };
        }
      }
    },
    asyncIterWindow(({ splitAfterThis }) => splitAfterThis, { after: true }),
    mapAsyncIter(async function* (subIter) {
      for await (const item of subIter) {
        yield item.chunk;
      }
    })
  );

  splitIter.rest = (async function* () {
    if (pendingMatchChunks.length) {
      yield pendingMatchPreChunk;

      for (let i = 0; i < pendingMatchChunks.length; ++i) {
        yield pendingMatchChunks[i];
      }
    }

    if (chunk.length) {
      yield chunk.subarray(chunkLastMatchEnd);
    }

    yield* wrappedSource;
    // for await (const chunk of wrappedSource) {
    //   yield chunk;
    // }
  })();

  return splitIter;
}

function findPartialMatchOnEnd(buf, searchedBuf, startFrom = 0) {
  for (;;) {
    const matchStart = buf.indexOf(searchedBuf[0], startFrom);

    if (matchStart === -1) {
      break;
    }

    let partialMatch;

    if (searchedBuf.indexOf((partialMatch = buf.subarray(matchStart))) === 0) {
      return partialMatch;
    }

    startFrom = matchStart + 1;
  }
}

function findPartialMatchOnStart(buf, searchedBuf, startFrom = 0) {
  const matchStart = searchedBuf.indexOf(buf[startFrom]);
  // const matchStart = buf.indexOf(searchedBuf[0], startFrom);

  if (matchStart === -1) {
    return;
  }

  let partialMatch;

  if (
    searchedBuf.indexOf(
      (partialMatch = buf.subarray(startFrom, searchedBuf.length - matchStart))
    ) === matchStart
  ) {
    return partialMatch;
  }
}

// function* findMatchesBetweenBuffers(buf, subBuf, startFrom = 0) {
//   let lastOccuranceEnd = startFrom;

//   for (;;) {
//     const matchIdx = buf.indexOf(subBuf, lastOccuranceEnd);

//     if (matchIdx === -1) {
//       break;
//     }

//     yield {
//       start: matchIdx,
//       end: matchIdx + subBuf.length,
//     };

//     lastOccuranceEnd = matchIdx + subBuf.length;
//   }
// }

// function findBufferOverlap(buffer1, buffer2, buffer1Offset=0, buffer2Offset=0) {
//   for (let i = buffer1Offset; i < buffer1.length; ++i) {
//     let subArray;
//     if (
//       buffer1[i] === buffer2[0] &&
//       buffer2.indexOf((subArray = buffer1.subarray(i))) === 0
//     ) {
//       interChunkInProgress = subArray;
//       interChunkInProgressIdx = i;
//       break;
//     }
//   }
// }
