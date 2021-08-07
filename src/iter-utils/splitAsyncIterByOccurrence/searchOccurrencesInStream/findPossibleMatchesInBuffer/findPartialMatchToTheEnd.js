module.exports = findPartialMatchToTheEnd;

function findPartialMatchToTheEnd(
  buffer,
  sequenceBuf,
  searchStartIdxOnBuffer = buffer.length - sequenceBuf.length + 1
) {
  let matchEndIdx = searchStartIdxOnBuffer;

  for (;;) {
    const firstByteIdx = buffer.indexOf(sequenceBuf[0], matchEndIdx);
    if (firstByteIdx === -1) {
      break;
    }
    const bufferFromFirstByteIdx = buffer.subarray(firstByteIdx);
    const isMatching = sequenceBuf.indexOf(bufferFromFirstByteIdx) === 0;
    if (isMatching) {
      return bufferFromFirstByteIdx.length;
    } else if (++matchEndIdx >= buffer.length) {
      break;
    }
  }

  return 0;
}
