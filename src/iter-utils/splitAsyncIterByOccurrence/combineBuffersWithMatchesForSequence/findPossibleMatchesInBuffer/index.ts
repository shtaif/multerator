import findPartialMatchToTheEnd from './findPartialMatchToTheEnd';
import bufferStartsWith from './bufferStartsWith';
// import findPartialMatchFromStart from './findPartialMatchFromStart';
import findWholeMatches from './findWholeMatches';

export { findPossibleMatchesInBuffer as default, SequenceOccurancePosition };

// TODO: Test performance of this function returning just an array (with `.push` calls instead of the `yield` statements) instead of being a generator
function* findPossibleMatchesInBuffer(
  buf: Buffer,
  seqBuf: Buffer,
  seqBufInitialCheckOffset: number = 0
): Generator<SequenceOccurancePosition> {
  let pos = 0;

  const possiblyOffsetSeqBuf =
    seqBufInitialCheckOffset > 0
      ? seqBuf.subarray(seqBufInitialCheckOffset)
      : seqBuf;

  if (buf.length < possiblyOffsetSeqBuf.length) {
    if (bufferStartsWith(possiblyOffsetSeqBuf, buf)) {
      const startIdx = seqBufInitialCheckOffset > 0 ? -1 : 0;
      const endIdx = -1;
      pos = buf.length;
      yield { startIdx, endIdx };
    }
  } else {
    if (bufferStartsWith(buf, possiblyOffsetSeqBuf)) {
      const startIdx = seqBufInitialCheckOffset === 0 ? 0 : -1;
      const endIdx = possiblyOffsetSeqBuf.length;
      pos = endIdx;
      yield { startIdx, endIdx };
    }
  }

  for (const matchIdx of findWholeMatches(buf, seqBuf, pos)) {
    const startIdx = matchIdx;
    const endIdx = matchIdx + seqBuf.length;
    pos = endIdx;
    yield { startIdx, endIdx };
  }

  pos = Math.max(pos, buf.length - seqBuf.length + 1);

  const matchLength = findPartialMatchToTheEnd(buf, seqBuf, pos);

  if (matchLength) {
    const startIdx = buf.length - matchLength;
    const endIdx = -1;
    yield { startIdx, endIdx };
  }
}

interface SequenceOccurancePosition {
  startIdx: number;
  endIdx: number;
}
