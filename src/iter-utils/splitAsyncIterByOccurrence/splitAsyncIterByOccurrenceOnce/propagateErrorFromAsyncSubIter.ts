export default propagateErrorFromAsyncSubIter;

async function* propagateErrorFromAsyncSubIter<T>(
  sourceIter: AsyncIterable<AsyncIterable<T>>
): AsyncGenerator<AsyncGenerator<T, void>, void> {
  let hasError = false;
  let error;

  for await (const subIter of sourceIter) {
    yield (async function* () {
      try {
        yield* subIter;
      } catch (err) {
        hasError = true;
        error = err;
        throw err;
      }
    })();

    if (hasError) {
      throw error;
    }
  }
}
