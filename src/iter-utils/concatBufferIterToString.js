module.exports = concatBufferIterToString;

async function concatBufferIterToString(source) {
  let concatted = '';

  for await (const chunk of source) {
    concatted += chunk.toString('utf-8');
  }

  return concatted;
}
