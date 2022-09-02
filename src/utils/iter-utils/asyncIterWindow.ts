export { asyncIterWindow as default, windowSplitMark };

async function* asyncIterWindow<ValueT>(
  src: AsyncIterable<ValueT | typeof windowSplitMark>
): AsyncGenerator<AsyncGenerator<ValueT, void>, void> {
  const srcIterator = src[Symbol.asyncIterator]();
  let hasError = false;
  let error;
  let item!: IteratorResult<typeof windowSplitMark | ValueT>;

  try {
    for (;;) {
      const windowIter = (async function* () {
        try {
          for (;;) {
            item = await srcIterator.next();
            if (item.value === windowSplitMark || item.done) {
              break;
            }
            yield item.value;
          }
        } catch (err) {
          hasError = true;
          error = err;
          throw err;
        }
      })();

      windowIter.return = async () => {
        await srcIterator.return?.();
        return {
          value: undefined,
          done: true,
        };
      };

      yield windowIter;

      if (item.done) {
        break;
      }

      if (hasError) {
        throw error;
      }
    }
  } finally {
    await srcIterator.return?.(); // To account for directly closing the base windowing iterable itself
  }
}

const windowSplitMark = Symbol('windowSplitMark');
