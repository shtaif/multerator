export default drainIter;

async function drainIter(source: AsyncIterable<unknown>): Promise<void> {
  for await (const _ of source);
}
