export default splitBufferBySequenceOnce;

function splitBufferBySequenceOnce(
  inputBuffer: Buffer,
  sequence: Buffer
): [Buffer] | [Buffer, Buffer] {
  const idxOfMatch = inputBuffer.indexOf(sequence);
  if (idxOfMatch === -1) {
    return [inputBuffer];
  }
  const beforeMatch = inputBuffer.subarray(0, idxOfMatch);
  const afterMatch = inputBuffer.subarray(idxOfMatch + 1);
  return [beforeMatch, afterMatch];
}
