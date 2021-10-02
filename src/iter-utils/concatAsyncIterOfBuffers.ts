export default concatAsyncIterOfBuffers;

async function concatAsyncIterOfBuffers(
  inputIter: AsyncIterable<Buffer>
): Promise<Buffer> {
  const chunks = [];

  for await (const chunk of inputIter) {
    chunks.push(chunk);
  }

  const combinedChunk = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks);

  return combinedChunk;
}
