export { asyncIterWindow as default, windowSplitMark };

async function* asyncIterWindow<T>(
  src: AsyncIterable<ValueWithWindowSignals<T>>
): AsyncGenerator<AsyncGenerator<T, void>, void> {
  const srcIterator = src[Symbol.asyncIterator]();
  let hasError = false;
  let error;
  let item!: IteratorResult<ValueWithWindowSignals<T>>;

  let windowIter: AsyncGenerator<T, void>;

  try {
    for (;;) {
      windowIter = (async function* () {
        let endedWithoutAbort = false;

        try {
          for (;;) {
            item = await srcIterator.next();
            if (item.value === windowSplitMark || item.done) {
              break;
            }
            yield item.value;
          }
          endedWithoutAbort = true;
        } catch (err) {
          [hasError, error] = [true, err];
          throw err;
        } finally {
          if (!endedWithoutAbort) {
            await srcIterator.return?.();
          }
        }
      })();

      yield windowIter;

      if (item.done) {
        break;
      }

      if (hasError) {
        throw error;
      }
    }
  } finally {
    await windowIter!.return(); // To react to directly closing the base windowing iterable itself
  }
}

const windowSplitMark = Symbol('windowSplitMark');

type ValueWithWindowSignals<V> = V | typeof windowSplitMark;
