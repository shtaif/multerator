export default bufferAsyncIterOfBuffers;

async function bufferAsyncIterOfBuffers(
  source: AsyncIterable<Buffer>
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of source) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
