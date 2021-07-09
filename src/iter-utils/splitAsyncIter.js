const pipe = require('../utils/pipe');

module.exports = { splitAsyncIter, splitAsyncIter2 };

function splitAsyncIter(splitPredicate = () => false) {
  return async function* (source) {
    const sourceIterator = source[Symbol.asyncIterator]();
    let chunk;
    let done = false;

    do {
      yield (async function* () {
        for (;;) {
          if (!chunk) {
            // TODO: Move to outside and prevent empty windows from being yielded?..
            const nextItem = await sourceIterator.next();
            chunk = nextItem.value;
            done = nextItem.done;
          }

          if (done) {
            return;
          }

          const { split: shouldSplit, appendToLast, prependToNew } =
            splitPredicate(chunk) || {};

          if (!shouldSplit) {
            yield chunk;
            chunk = undefined;
          } else {
            if (appendToLast) {
              yield appendToLast;
            }

            chunk = prependToNew;

            break;
          }
        }
      })();
    } while (!done);

    // sourceIterator.return();
  };
}

function splitAsyncIter2(splitPredicate = () => false) {
  return source => {
    return pipe(
      source,
      async function* () {
        const sourceIterator = source[Symbol.asyncIterator]();
        let done = false;

        do {
          yield (async function* () {
            for (;;) {
              // TODO: Move to outside and prevent empty windows from being yielded?..
              const nextItem = await sourceIterator.next();
              const chunk = nextItem.value;
              done = nextItem.done;

              if (done) {
                return;
              }

              const shouldSplit = splitPredicate(chunk);

              if (shouldSplit) {
                break;
              }

              yield chunk;
            }
          })();
        } while (!done);

        // sourceIterator.return();
      },
      async function* (source) {
        let resolve;
        let promise;

        for await (const partIter of source) {
          promise = new Promise(r => (resolve = r));

          yield (async function* () {
            yield* partIter;
            resolve();
          })();

          await promise;
        }
      }
    );
  };
}
