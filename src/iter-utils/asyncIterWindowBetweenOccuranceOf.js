module.exports = asyncIterWindowBetweenOccuranceOf;

function asyncIterWindowBetweenOccuranceOf(valueToSplitBy) {
  return async function* (source) {
    const sourceIterator = source[Symbol.asyncIterator]();
    let done = false;
    let hasError = false;
    let error;
    let value;

    try {
      for (;;) {
        yield (async function* () {
          for (;;) {
            try {
              ({ value, done } = await sourceIterator.next());
            } catch (err) {
              hasError = true;
              error = err;
              throw err;
            }

            if (value === valueToSplitBy || done) {
              return;
            }

            yield value;
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
      source.return();
    }
  };
}
