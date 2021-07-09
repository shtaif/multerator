module.exports = findWholeMatches;

function* findWholeMatches(buf, sequenceBuf, startFrom = 0) {
  let nextStartFrom = startFrom;

  for (;;) {
    const matchIdx = buf.indexOf(sequenceBuf, nextStartFrom);
    if (matchIdx === -1) {
      break;
    }
    nextStartFrom = matchIdx + sequenceBuf.length;
    yield matchIdx;
  }
}
