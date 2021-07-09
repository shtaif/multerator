const CBuffer = require('cbuffer');
const cBufferEqualsSequence = require('../utils/cBufferEqualsSequence');
const pipe = require('../utils/pipe');
const { splitAsyncIter, splitAsyncIter2 } = require('./splitAsyncIter');
const filterAsyncIter = require('./filterAsyncIter');
const mapAsyncIter = require('./mapAsyncIter');
const checkIfAsyncIterEmpty = require('./checkIfAsyncIterEmpty');
const concatAsyncIters = require('./concatAsyncIters');
const looseAsyncIterWrapper = require('./looseAsyncIterWrapper');
const iterFrom = require('./iterFrom');

module.exports = splitAsyncIterByString4;

class SplitableIter {
  constructor(source) {
    this.source = source;
    this.chunkToAppendToPrev = undefined;
    this.chunkToPrependToNext = undefined;
  }

  untilSequence(sequenceStr) {
    const sequenceBuf = Buffer.from(sequenceStr);
    const compWindow = new CBuffer(sequenceBuf.length);
    let skipNextChar = false; // TODO: It's probably better to remove this and allow parsing of subsequent pattern occurances and DO emit a zero-length buffer

    return pipe(
      this.source,
      splitAsyncIter(chunk => {
        for (let i = 0; i < chunk.length; ++i) {
          compWindow.push(chunk[i]);

          if (skipNextChar) {
            skipNextChar = false;
          } else if (cBufferEqualsSequence(compWindow, sequenceBuf)) {
            skipNextChar = true;

            const startChunk = chunk.subarray(0, i + 1 - delimiterBuf.length);
            const endChunk = chunk.subarray(i + 1);

            this.chunkToAppendToPrev = startChunk;
            this.chunkToPrependToNext = endChunk;

            return { split: true };
          }
        }

        return { split: false };
      }),
      mapAsyncIter(async function* (subIter) {
        if (this.chunkToAppendToPrev) {
          yield this.chunkToAppendToPrev;
          this.chunkToAppendToPrev = undefined;
        }
        if (this.chunkToPrependToNext) {
          yield this.chunkToPrependToNext;
          this.chunkToPrependToNext = undefined;
        }
        yield* subIter;
      }),
      mapAsyncIter(checkIfAsyncIterEmpty),
      // filterAsyncIter(Boolean)
      filterAsyncIter((subIter, i) => {
        return i !== 0 && subIter !== undefined;
      })
      // TODO: Also filter out an `undefined` from the end boundary somehow?
    );
  }

  [Symbol.asyncIterator]() {
    // return (async function* () {
    //   for await (const chunk of this.source) {
    //     yield chunk;
    //   }
    // })();
    return pipe(
      this.source,
      mapAsyncIter(chunk => {})
    );
  }
}

function splitAsyncIterByString4(separatorStr) {
  return async function* (source) {
    if (!separatorStr) {
      yield source;
    }

    const sourceIterator = source[Symbol.asyncIterator]();

    const buffer = new CBuffer(separatorStr.length);
    let done = false;

    let chunk = '';
    let leftOverChunkBuffer = '';

    do {
      const partIter = (async function* () {
        for (;;) {
          if (!chunk.length) {
            // TODO: Move to outside and prevent empty windows from being yielded?..
            const nextItem = await sourceIterator.next();
            chunk = nextItem.value;
            done = nextItem.done;
          }

          if (done) {
            return;
          }

          if (leftOverChunkBuffer.length) {
            chunk = `${leftOverChunkBuffer}${chunk}`;
            leftOverChunkBuffer = '';
          }

          for (let i = 0; i < chunk.length; ++i) {
            buffer.push(chunk[i]);

            let equal = true;

            // for (let i2 = 0; i2 < buffer.length; ++i2) {
            for (let i2 = 0; i2 < buffer.size; ++i2) {
              if (buffer.get(i2) !== separatorStr[i2]) {
                equal = false;
                break;
              }
            }

            if (equal) {
              // const startChunk = chunk.slice(0, i - separatorStr.length);
              const startChunk = chunk.slice(0, i + 1 - separatorStr.length);
              if (startChunk.length) {
                yield startChunk;
              }

              // chunk = chunk.slice(i);
              chunk = chunk.slice(i + 1);

              return;
            }
          }

          leftOverChunkBuffer = chunk.slice(chunk.length - separatorStr.length);

          if (leftOverChunkBuffer.length) {
            yield leftOverChunkBuffer;
          }

          yield chunk;

          chunk = '';
        }
      })();

      yield partIter;
    } while (!done);

    // sourceIterator.return();
  };
}

function branchOutStream(branchBordererFn) {
  return async function* (source) {
    const sourceIterator = source[Symbol.asyncIterator]();

    let hasNextBranch = false;
    let nextBranchOpeningItem;

    do {
      yield (async function* () {
        for await (const item of sourceIterator) {
          if (!branchBordererFn(item)) {
            hasNextBranch = true;
            nextBranchOpeningItem = item;
            return;
          }
          yield item;
        }
        hasNextBranch = false;
      })();
    } while (hasNextBranch);
  };
}

// // TODO: Currently only works on string-iterators, adjust to also handle buffer-iterators
// function splitAsyncIterByString(separatorStr) {
//   return async function* (source) {
//     if (!separatorStr) {
//       yield source;
//     }

//     let sourceIterator = source[Symbol.asyncIterator]();

//     let accumlatedMatch = '';

//     yield* branchOutStream(chunk => {
//       let lastChunkOfCurrentSubIter;
//       let firstChunkForNextSubIter;

//       let startIdx = -1;
//       let endIdx = -1;

//       // const { matched, startIdx, endIdx } = findCommonSubstring(
//       //   chunk,
//       //   separatorStr
//       // );

//       // accumlatedMatch += matched;

//       // if (accumlatedMatch.length === separatorStr.length) {
//       // }

//       for (let idx = 0; idx < chunk.length; ++idx) {
//         const currChar = chunk[idx];

//         if (currChar === separatorStr[accumlatedMatch.length]) {
//           accumlatedMatch += currChar;

//           if (accumlatedMatch.length === separatorStr.length) {
//             startIdx = idx - accumlatedMatch.length;
//             endIdx = idx;
//             accumlatedMatch = '';
//             break;
//           }
//         } else {
//           accumlatedMatch = '';
//         }
//       }

//       const lastChunkOfCurrentSubIter = chunk.slice(0, startIdx);
//       const firstChunkForNextSubIter = chunk.slice(endIdx);
//     })(sourceIterator);
//   };
// }

function findCommonSubstring(str1, str2) {
  let longerStr;
  let shorterStr;

  if (str1.length > str2.length) {
    longerStr = str1;
    shorterStr = str2;
  } else {
    longerStr = str2;
    shorterStr = str1;
  }

  let accumlatedMatch = '';
  let startIdx = -1;
  let endIdx = -1;

  for (let idx = 0; idx < longerStr.length; ++idx) {
    const currChar = longerStr[idx];

    if (currChar === shorterStr[accumlatedMatch.length]) {
      accumlatedMatch += currChar;

      if (accumlatedMatch.length === shorterStr.length) {
        startIdx = idx - accumlatedMatch.length;
        endIdx = idx;
        break;
      }
    } else {
      accumlatedMatch = '';
    }
  }

  return {
    matched: accumlatedMatch,
    startIdx,
    endIdx,
  };
}

function findStrOverlap(string, substring, searchFromIdx = 0) {
  let matchCharsCount = 0;
  let startIdx = -1;
  let endIdx = -1;

  if (string.length <= substring) {
  }

  for (let idx = searchFromIdx; idx < string.length; ++idx) {
    const currChar = string[idx];

    if (currChar !== substring[matchCharsCount]) {
      matchCharsCount++;

      if (matchCharsCount === substring.length) {
        startIdx = idx - matchCharsCount;
        endIdx = idx;
        break;
      }
    } else {
      matchCharsCount = 0;
    }
  }

  // return { startIdx, endIdx };
  return { startIdx, matchCharsCount };
}

function splitByFn(fn = () => false) {
  return async function* (source) {
    const sourceIterator = source[Symbol.asyncIterator]();
    let sourceDone = false;

    do {
      yield (async function* () {
        for (;;) {
          const { value, done } = await sourceIterator.next();

          if (done) {
            sourceDone = true;
            return;
          }

          if (fn(value)) {
            return;
          }
        }
      })();
    } while (!sourceDone);

    // sourceIterator.return();
  };
}

function splitAsyncIterByString3(separatorStr) {
  return async function* (source) {
    if (!separatorStr) {
      yield source;
    }

    const sourceIterator = source[Symbol.asyncIterator]();

    let matchedCharsCount = 0;
    let matchStartIdx = -1;
    let chunksSpannedByMatch = [];
    // let matchStartChunk;
    // let tempChunk;
    let sourceDone = false;

    // return yield* sourceIterator;

    let tempChunk;
    let splits = [];

    const buf = new CBuffer();

    const splittedSource = splitByFn(chunk => {
      for (let i = 0; i < chunk.length; ++i) {
        const currChar = chunk[i];

        if (currChar !== separatorStr[matchedCharsCount]) {
          // if (matchedCharsCount > 0) {
          //   console.log(chunk.slice(i - matchedCharsCount, i));
          // }
          matchedCharsCount = 0;
          matchStartIdx = -1;
          // if (chunksSpannedByMatch.length) {
          //   yield* chunksSpannedByMatch;
          //   chunksSpannedByMatch = [];
          // }
        } else {
          matchedCharsCount++;

          if (matchedCharsCount === 1) {
            matchStartIdx = i;
            // chunksSpannedByMatch.push(chunk);
          } else if (i === 0) {
            // chunksSpannedByMatch.push(chunk);
          }

          if (matchedCharsCount === separatorStr.length) {
            // MATCH!
            // yield chunksSpannedByMatch[0].slice(0, matchStartIdx);
            // chunksSpannedByMatch = [];

            matchedCharsCount = 0;

            return true;

            // const restOfCurrChunk = chunk.slice(i);
            // if (restOfCurrChunk.length) {
            //   yield restOfCurrChunk;
            // }
          }
        }
      }
      // if (!matchedCharsCount) {
      //   yield chunk;
      // }
    })(source);

    for await (const subIter of splittedSource) {
      yield (async function* () {
        if (tempChunk) {
          yield tempChunk;
          tempChunk = undefined;
        }
        yield* subIter;
      })();
    }

    // sourceIterator.return();
  };
}

function splitAsyncIterByString2(separatorStr) {
  return async function* (source) {
    if (!separatorStr) {
      yield source;
    }

    const sourceIterator = source[Symbol.asyncIterator]();

    let matchedCharsCount = 0;
    let matchStartIdx = -1;
    let chunksSpannedByMatch = [];
    // let matchStartChunk;
    // let tempChunk;
    let sourceDone = false;
    let done;

    // return yield* sourceIterator;

    let tempChunk;

    do {
      yield (async function* () {
        for (;;) {
          if (tempChunk) {
            yield tempChunk;
            tempChunk = undefined;
          }

          const { value: chunk, done } = await sourceIterator.next();

          if (done) {
            sourceDone = true;
            return;
          }

          // for (let i = 0; i < chunk.length; ++i) {
          //   const currChar = chunk[i];

          //   if (currChar !== separatorStr[matchedCharsCount]) {
          //     // if (matchedCharsCount > 0) {
          //     //   console.log(chunk.slice(i - matchedCharsCount, i));
          //     // }
          //     matchedCharsCount = 0;
          //     matchStartIdx = -1;
          //     // if (chunksSpannedByMatch.length) {
          //     //   yield* chunksSpannedByMatch;
          //     //   chunksSpannedByMatch = [];
          //     // }
          //   } else {
          //     matchedCharsCount++;
          //     if (matchedCharsCount === 1) {
          //       matchStartIdx = i;
          //       // chunksSpannedByMatch.push(chunk);
          //     } else if (i === 0) {
          //       // chunksSpannedByMatch.push(chunk);
          //     }
          //     if (matchedCharsCount === separatorStr.length) {
          //       // MATCH!
          //       // yield chunksSpannedByMatch[0].slice(0, matchStartIdx);
          //       // chunksSpannedByMatch = [];
          //       const restOfCurrChunk = chunk.slice(i);
          //       if (restOfCurrChunk.length) {
          //         yield restOfCurrChunk;
          //       }
          //       matchedCharsCount = 0;
          //       return;
          //     }
          //   }
          // }

          // if (!matchedCharsCount) {
          //   yield chunk;
          // }

          const {
            startIdx,
            matchCharsCount: currMatchCharsCount,
          } = findStrOverlap(chunk, separatorStr);

          if (!currMatchCharsCount) {
            yield chunk;
          } else {
            matchedCharsCount += currMatchCharsCount;

            if (currMatchCharsCount === separatorStr.length) {
              if (startIdx > 0) {
                const startOfChunk = chunk.slice(0, startIdx);
                yield startOfChunk;
              }
              const endIdx = startIdx + currMatchCharsCount;
              if (endIdx < chunk.length) {
                const endOfChunk = chunk.slice(endIdx);
                tempChunk = endOfChunk;
              }
              break; // Or put this condition in a do while loop?
            } else {
              // Has a partial match so far - cache the slice of the chunk from before the start of the pattern
            }
          }

          // let matchIdx;
          // while (true)
          //   const matchIdx = chunk.indexOf(separatorStr);

          //   if (idx !== -1) {
          //   }

          //   if (matchIdx !== -1) {

          //   } else {
          //     break;
          //   }
          // }

          function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
          }

          const separatorRegex = new RegExp(
            escapeRegExp(`${separatorStr}`, 'g')
          );

          if (chunk.includes(separatorStr)) {
            separatorStr.split(separatorStr);
          }

          let lastIndex;
          for (const { index } of chunk.matchAll(separatorRegex)) {
            chunk.slice();
            lastIndex = index;
          }
        }
      })();
    } while (!sourceDone);

    // sourceIterator.return();
  };
}
