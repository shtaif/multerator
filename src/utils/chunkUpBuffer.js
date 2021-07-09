module.exports = chunkUpBuffer;

function chunkUpBuffer(buffer, chunkSize) {
  const chunks = [];
  for (i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.subarray(i, i + chunkSize));
  }
  return chunks;
}
