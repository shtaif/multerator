const stdoutWrite = require('./stdoutWrite');

module.exports = visualizeStream;

async function* visualizeStream(source, bufferGetter = item => item) {
  for await (const item of source) {
    const buf = bufferGetter(item);
    await stdoutWrite(buf);
    yield item;
  }
}
