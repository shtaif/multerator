export default asyncIterWindowBetweenOccurrenceOf;

function asyncIterWindowBetweenOccurrenceOf<VAL_T, SPLIT_MARK_T>(
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
          try {
            for (;;) {
              ({ value, done } = await srcIterator.next());
              if (value === valueToSplitBy || done) {
                break;
              }
              yield value as VAL_T; // TODO: What do I do about this `as`?...
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
      srcIterator.return?.();
    }
  };
}
