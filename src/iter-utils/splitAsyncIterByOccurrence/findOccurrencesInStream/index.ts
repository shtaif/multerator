import findPartialMatchToTheEnd from './findPartialMatchToTheEnd';
import bufferStartsWith from './bufferStartsWith';
import findWholeMatches from './findWholeMatches';

export { findOccurrencesInStream as default, SequenceOccurrencePosition };

async function* findOccurrencesInStream(
  source: AsyncIterable<Buffer>,
  seqBuf: Buffer
): AsyncGenerator<Buffer | SequenceOccurrencePosition, void, undefined> {
  const sourceIter = source[Symbol.asyncIterator]();
  const bufsToSearchAgain: Buffer[] = [];
  let bufsToSearchAgainStartIdx = 0;
  const bufsToSearchAgainAndYield: Buffer[] = [];
  let currentMultiChunkMatchBufs: Buffer[] = [];
  let currentMultiChunkMatchStartIdx = 0;
  let currentMultiChunkMatchRemainderOfSeqToMatch = seqBuf;

  // TODO: Make sure source is properly closed in every possible case of canceling / cutting it off
  try {
    for (;;) {
      let buf;

      if (bufsToSearchAgain.length) {
        buf = bufsToSearchAgain.shift()!;
      } else if (bufsToSearchAgainAndYield.length) {
        buf = bufsToSearchAgainAndYield.shift()!;
        yield buf;
      } else {
        const iteration = await sourceIter.next();
        if (iteration.done) {
          break;
        }
        buf = iteration.value;
        if (!currentMultiChunkMatchBufs.length) {
          yield buf;
        }
      }

      if (!currentMultiChunkMatchBufs.length) {
        let lastWholeMatchEndIdx;

        for (const matchIdx of findWholeMatches(
          buf,
          seqBuf,
          bufsToSearchAgainStartIdx
        )) {
          const startIdx = matchIdx;
          const endIdx = matchIdx + seqBuf.length;
          lastWholeMatchEndIdx = endIdx;
          yield { startIdx, endIdx };
        }

        const remainingUnsearchedLengthToTheEnd = Math.max(
          lastWholeMatchEndIdx ?? bufsToSearchAgainStartIdx,
          buf.length - seqBuf.length + 1
        );

        bufsToSearchAgainStartIdx = 0;

        const matchToTheEndLength = findPartialMatchToTheEnd(
          buf,
          seqBuf,
          remainingUnsearchedLengthToTheEnd
        );

        if (matchToTheEndLength) {
          currentMultiChunkMatchStartIdx = buf.length - matchToTheEndLength;
          currentMultiChunkMatchBufs.push(buf);
          currentMultiChunkMatchRemainderOfSeqToMatch =
            seqBuf.subarray(matchToTheEndLength);
        }
      } else {
        currentMultiChunkMatchBufs.push(buf);

        const detectedMultiChunkMatchEndIdx = (() => {
          // TODO: Need to ensure that this logic is adapted to run also for a case where the source stream ended in the middle of a possible multi-match?
          if (
            buf.length >= currentMultiChunkMatchRemainderOfSeqToMatch.length
          ) {
            if (
              bufferStartsWith(buf, currentMultiChunkMatchRemainderOfSeqToMatch)
            ) {
              return currentMultiChunkMatchRemainderOfSeqToMatch.length;
            } else {
              return -1;
            }
          }
          if (
            !bufferStartsWith(currentMultiChunkMatchRemainderOfSeqToMatch, buf)
          ) {
            return -1;
          }
        })();

        if (detectedMultiChunkMatchEndIdx === undefined) {
          currentMultiChunkMatchRemainderOfSeqToMatch =
            currentMultiChunkMatchRemainderOfSeqToMatch.subarray(buf.length);
        } else if (detectedMultiChunkMatchEndIdx === -1) {
          bufsToSearchAgain.push(currentMultiChunkMatchBufs[0]);
          bufsToSearchAgainStartIdx = currentMultiChunkMatchStartIdx + 1;

          for (let i = 1; i < currentMultiChunkMatchBufs.length; ++i) {
            bufsToSearchAgainAndYield.push(currentMultiChunkMatchBufs[i]);
          }

          currentMultiChunkMatchStartIdx = 0;
          currentMultiChunkMatchBufs = [];
          currentMultiChunkMatchRemainderOfSeqToMatch = seqBuf;
        } else {
          yield { startIdx: currentMultiChunkMatchStartIdx, endIdx: -1 };

          for (let i = 1; i < currentMultiChunkMatchBufs.length - 1; ++i) {
            yield currentMultiChunkMatchBufs[i];
          }

          const lastChunk =
            currentMultiChunkMatchBufs[currentMultiChunkMatchBufs.length - 1];

          yield lastChunk;

          yield { startIdx: -1, endIdx: detectedMultiChunkMatchEndIdx };

          bufsToSearchAgain.push(lastChunk);
          bufsToSearchAgainStartIdx = detectedMultiChunkMatchEndIdx;

          currentMultiChunkMatchStartIdx = 0;
          currentMultiChunkMatchBufs = [];
          currentMultiChunkMatchRemainderOfSeqToMatch = seqBuf;
        }
      }
    }
  } finally {
    sourceIter.return?.();
  }

  for (let i = 1; i < currentMultiChunkMatchBufs.length; ++i) {
    yield currentMultiChunkMatchBufs[i];
  }
}

interface SequenceOccurrencePosition {
  startIdx: number;
  endIdx: number;
}
