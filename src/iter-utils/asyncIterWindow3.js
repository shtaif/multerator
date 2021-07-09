module.exports = asyncIterWindow;

function asyncIterWindow(operation) {
  return async function* (source) {
    const sourceIterator = source[Symbol.asyncIterator]();
    const modifiedSource = operation(sourceIterator, NEW_WINDOW_SIGNAL);
    let done = false;

    do {
      yield (async function* () {
        for (;;) {
          // TODO: Move to outside and prevent empty windows from being yielded?..
          const nextItem = await modifiedSource.next();
          const value = nextItem.value;
          done = nextItem.done;

          if (done) {
            return;
          } else if (value === NEW_WINDOW_SIGNAL) {
            break;
          } else {
            yield value;
          }
        }
      })();
    } while (!done);
  };
}

const NEW_WINDOW_SIGNAL = new (class NewWindowSignal {})();
