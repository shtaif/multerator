export default findOccurrencesInBuffer;

function findOccurrencesInBuffer(
  inputBuffer: Buffer,
  sequence: Buffer
): number[] {
  const matchIndices = [];
  let nextStartIdx = 0;

  for (;;) {
    const idxOfMatch = inputBuffer.indexOf(sequence, nextStartIdx);
    if (idxOfMatch === -1) {
      break;
    }
    matchIndices.push(idxOfMatch);
    nextStartIdx = idxOfMatch + sequence.length;
  }

  return matchIndices;
}
