export default asyncIterReorganizeChunks;

async function* asyncIterReorganizeChunks(
  source: AsyncIterable<Buffer>,
  chunkSizeThres: number
): AsyncGenerator<Buffer> {
  let buffers: Buffer[] = [];
  let buffersTotalSize = 0;

  for await (const chunk of source) {
    buffers.push(chunk);
    buffersTotalSize += chunk.length;

    while (buffersTotalSize >= chunkSizeThres) {
      const lastChunk = buffers[buffers.length - 1];
      const sliceIdx = lastChunk.length - buffersTotalSize + chunkSizeThres;
      const leftPart = lastChunk.subarray(0, sliceIdx);
      const rightPart = lastChunk.subarray(sliceIdx);

      buffers[buffers.length - 1] = leftPart;

      const wholeBuffer = Buffer.concat(buffers);

      if (rightPart.length) {
        buffers = [rightPart];
        buffersTotalSize = rightPart.length;
      } else {
        buffers = [];
        buffersTotalSize = 0;
      }

      yield wholeBuffer;
    }
  }

  if (buffers.length) {
    yield Buffer.concat(buffers);
  }
}
