const looseAsyncIterWrapper = require('./looseAsyncIterWrapper');

module.exports = asyncIterWindow;

function asyncIterWindow(fn) {
  return async function* (source) {
    const looseSource = looseAsyncIterWrapper(source);

    let tmpItem1;

    for (;;) {
      tmpItem1 = await looseSource.next();

      if (tmpItem1.done) {
        break;
      }

      yield (async function* () {
        if (tmpItem1) {
          yield tmpItem1.value;
          tmpItem1 = undefined;
        }
        yield* fn(looseSource);
      })();
    }
  };
}
