module.exports = visualizeStream;

async function* visualizeStream(source, bufferGetter = item => item) {
  for await (const item of source) {
    const buf = bufferGetter(item);
    await stdoutWrite(buf);
    yield item;
  }
}

async function stdoutWrite(chunk, encoding) {
  return await new Promise((resolve, reject) => {
    process.stdout.write(chunk, encoding, err => {
      err ? reject(err) : resolve();
    });
  });
}
