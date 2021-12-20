const pipe = require('../utils/pipe');

module.exports = retrySomeItems;

function retrySomeItems(withModifiedSource, predicate = () => false) {
  return function (source) {
    let itemToRetry;
    let hasItemToRetry = false;

    return pipe(
      (async function* () {
        for await (const item of source) {
          if (hasItemToRetry) {
            hasItemToRetry = false;
            yield itemToRetry;
          }
          yield item;
        }
      })(),
      withModifiedSource,
      (async function* (src) {
        for await (const item of src) {
          if (predicate(item)) {
            hasItemToRetry = true;
            itemToRetry = item;
          } else {
            yield item;
          }
        }
      })()
    );
  };
}
