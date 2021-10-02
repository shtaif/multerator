export default splitBufferBySequence;

function splitBufferBySequence(
  inputBuffer: Buffer,
  sequence: Buffer
): Buffer[] {
  const inputBufferSplits = [];
  let nextStartIdx = 0;

  for (;;) {
    const idxOfMatch = inputBuffer.indexOf(sequence, nextStartIdx);
    if (idxOfMatch === -1) {
      inputBufferSplits.push(inputBuffer.subarray(nextStartIdx));
      break;
    }
    inputBufferSplits.push(inputBuffer.subarray(nextStartIdx, idxOfMatch));
    nextStartIdx = idxOfMatch + sequence.length;
  }

  return inputBufferSplits;
}
