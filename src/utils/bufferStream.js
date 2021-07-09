module.exports = bufferStream;

async function bufferStream(stream, encoding) {
  const chunks = [];

  stream.on('data', chunk => {
    chunks.push(chunk);
  });

  await new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  const combinedBuffer = Buffer.concat(chunks);

  return encoding ? combinedBuffer.toString(encoding) : combinedBuffer;
}
