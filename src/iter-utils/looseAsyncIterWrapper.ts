export default looseAsyncIterWrapper;

async function* looseAsyncIterWrapper<T>(
  source: AsyncIterable<T>
): AsyncGenerator<T, void> {
  const srcIterator = source[Symbol.asyncIterator]();
  for (;;) {
    const { value, done } = await srcIterator.next();
    if (done) {
      break;
    }
    yield value;
  }
}
