export default visualizeStream;

async function* visualizeStream<T>(
  source: AsyncIterable<T>,
  bufferGetter: (a: T) => Buffer
): AsyncGenerator<T> {
  for await (const item of source) {
    const buf = bufferGetter(item);
    await stdoutWrite(buf);
    yield item;
  }
}

async function stdoutWrite(
  chunk: Buffer,
  encoding?: BufferEncoding | undefined
): Promise<void> {
  return await new Promise((resolve, reject) => {
    process.stdout.write(chunk, encoding, err => {
      err ? reject(err) : resolve();
    });
  });
}
