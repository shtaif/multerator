export default getSubBufferWithin;

function getSubBufferWithin(
  inputBuffer: Buffer,
  startDelimiterSequence: Buffer,
  endDelimiterSequence: Buffer,
  startOffset = 0
): Buffer | undefined {
  const idxOfStartDelim = inputBuffer.indexOf(
    startDelimiterSequence,
    startOffset
  );
  if (idxOfStartDelim === -1) {
    return;
  }
  const idxOfStartDelimEnd = idxOfStartDelim + startDelimiterSequence.length;
  const idxOfEndDelim = inputBuffer.indexOf(
    endDelimiterSequence,
    idxOfStartDelimEnd
  );
  if (idxOfEndDelim === -1) {
    return;
  }
  const resultSubBuffer = inputBuffer.subarray(
    idxOfStartDelimEnd,
    idxOfEndDelim
  );
  return resultSubBuffer;
}
