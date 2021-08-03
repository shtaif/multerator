export default findWholeMatches;

function* findWholeMatches(
  buf: Buffer,
  sequenceBuf: Buffer,
  startFrom: number = 0
): Generator<number> {
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
