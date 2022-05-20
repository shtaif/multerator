export { asyncIterWindow as default, windowSplitMark };

async function* asyncIterWindow<VAL_T>(
  src: AsyncIterable<VAL_T | typeof windowSplitMark>
): AsyncGenerator<AsyncGenerator<VAL_T, void>, void> {
  const srcIterator = src[Symbol.asyncIterator]();
  let done: boolean | undefined = false;
  let hasError = false;
  let error;
  let value: VAL_T | typeof windowSplitMark;

  try {
    for (;;) {
      yield (async function* () {
        try {
          for (;;) {
            ({ value, done } = await srcIterator.next());
            if (value === windowSplitMark || done) {
              break;
            }
            yield value;
          }
        } catch (err) {
          hasError = true;
          error = err;
          throw err;
        }
      })();

      if (done) {
        break;
      }

      if (hasError) {
        throw error;
      }
    }
  } finally {
    await srcIterator.return?.();
  }
}

const windowSplitMark = Symbol('windowSplitMark');
