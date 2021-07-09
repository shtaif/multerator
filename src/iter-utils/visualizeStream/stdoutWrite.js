module.exports = stdoutWrite;

async function stdoutWrite(chunk, encoding) {
  return await new Promise((resolve, reject) => {
    process.stdout.write(chunk, encoding, err => {
      err ? reject(err) : resolve();
    });
  });
}
