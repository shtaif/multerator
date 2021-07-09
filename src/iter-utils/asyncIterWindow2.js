module.exports = asyncIterWindow;

function asyncIterWindow(operation) {
  return async function* (source) {
    let startNewWindowResolve;
    let startNewWindowPromise = new Promise(
      res => (startNewWindowResolve = res)
    );

    const sourceIterator = source[Symbol.asyncIterator]();

    const modifiedSource = operation(sourceIterator, () => {
      startNewWindowResolve(NEW_WINDOW_SIGNAL);
      startNewWindowPromise = new Promise(res => (startNewWindowResolve = res));
    });

    let done = false;
    let nextItemPromise;

    do {
      yield (async function* () {
        for (;;) {
          // TODO: Move to outside and prevent empty windows from being yielded?..
          if (!nextItemPromise) {
            nextItemPromise = modifiedSource.next();
          }

          const nextItem = await Promise.race([
            nextItemPromise,
            startNewWindowPromise,
          ]);

          if (nextItem === NEW_WINDOW_SIGNAL) {
            break;
          }

          nextItemPromise = undefined;

          const item = nextItem.value;
          done = nextItem.done;

          if (done) {
            return;
          }

          yield item;
        }
      })();
    } while (!done);
  };
}

const NEW_WINDOW_SIGNAL = {};
