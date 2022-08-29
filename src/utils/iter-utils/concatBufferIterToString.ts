export default concatBufferIterToString;

async function concatBufferIterToString(
  source: AsyncIterable<Buffer>
): Promise<string> {
  let concatted = '';

  for await (const chunk of source) {
    concatted += chunk.toString('utf-8');
  }

  return concatted;
}
