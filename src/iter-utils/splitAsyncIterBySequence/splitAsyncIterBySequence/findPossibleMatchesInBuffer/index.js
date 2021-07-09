const findPartialMatchToTheEnd = require('./findPartialMatchToTheEnd');
const bufferStartsWith = require('./bufferStartsWith');
// const findPartialMatchFromStart = require('./findPartialMatchFromStart');
const findWholeMatches = require('./findWholeMatches');

module.exports = findPossibleMatchesInBuffer;

function* findPossibleMatchesInBuffer(
  buf,
  seqBuf,
  idxOnSeqBufToInitiallySearchFrom = 0
) {
  let pos = 0;

  const possiblyOffsetSeqBuf =
    idxOnSeqBufToInitiallySearchFrom > 0
      ? seqBuf.subarray(idxOnSeqBufToInitiallySearchFrom)
      : seqBuf;

  if (buf.length < possiblyOffsetSeqBuf.length) {
    if (bufferStartsWith(possiblyOffsetSeqBuf, buf)) {
      const startIdx = idxOnSeqBufToInitiallySearchFrom > 0 ? -1 : 0;
      const endIdx = -1;
      pos = buf.length;
      yield { startIdx, endIdx };
    }
  } else if (bufferStartsWith(buf, possiblyOffsetSeqBuf)) {
    const startIdx = idxOnSeqBufToInitiallySearchFrom === 0 ? 0 : -1;
    const endIdx = possiblyOffsetSeqBuf.length;
    pos = endIdx;
    yield { startIdx, endIdx };
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
