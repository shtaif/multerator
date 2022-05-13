module.exports = bufferAsyncIterOfBuffers;

async function bufferAsyncIterOfBuffers(source) {
  const chunks = [];
  for await (const chunk of source) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
