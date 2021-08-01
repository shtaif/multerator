export default asyncIterWindowBetweenOccuranceOf;

function asyncIterWindowBetweenOccuranceOf<VAL_T, SPLIT_MARK_T>(
  valueToSplitBy: SPLIT_MARK_T
): (
  src: AsyncIterable<VAL_T | SPLIT_MARK_T>
) => AsyncGenerator<AsyncGenerator<VAL_T, void>, void> {
  return async function* (src) {
    const srcIterator = src[Symbol.asyncIterator]();
    let done: boolean | undefined = false;
    let hasError = false;
    let error;
    let value: VAL_T | SPLIT_MARK_T;

    try {
      for (;;) {
        yield (async function* () {
          for (;;) {
            try {
              ({ value, done } = await srcIterator.next());
            } catch (err) {
              hasError = true;
              error = err;
              throw err;
            }

            if (value === valueToSplitBy || done) {
              return;
            }

            yield value as VAL_T; // TODO: What do I do about this `as`?...
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
      srcIterator.return?.();
    }
  };
}
