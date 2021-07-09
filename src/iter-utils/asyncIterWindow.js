const iterFrom = require('./iterFrom');

module.exports = asyncIterWindow;

function asyncIterWindow(
  shouldStartNewWindow = () => false,
  { after = false } = {}
) {
  return async function* (source) {
    const sourceIterator = source[Symbol.asyncIterator]();
    let done = false;
    let itemForNewWindow = iterFrom();

    do {
      yield (async function* () {
        yield* itemForNewWindow;

        for (;;) {
          // TODO: Move to outside and prevent empty windows from being yielded?..
          const nextItem = await sourceIterator.next();
          const value = nextItem.value;
          done = nextItem.done;

          if (done) {
            return;
          }

          if (shouldStartNewWindow(value)) {
            if (after) {
              yield value;
            } else {
              itemForNewWindow = iterFrom(value);
            }
            break;
          }

          yield value;
        }
      })();
    } while (!done);
  };
}
