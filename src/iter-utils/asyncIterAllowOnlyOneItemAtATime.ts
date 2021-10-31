export default asyncIterAllowOnlyOneItemAtATime;

async function* asyncIterAllowOnlyOneItemAtATime<T>(
  sourceIter: AsyncIterable<T>,
  delayFn: (item: T) => any
): AsyncGenerator<T, void, undefined> {
  let nextDelay: unknown = initialResolvedPromise;

  for await (const item of sourceIter) {
    nextDelay = delayFn(item);
    yield item;
    await nextDelay;
  }
}

const initialResolvedPromise = Promise.resolve();
