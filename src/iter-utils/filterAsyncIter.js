module.exports = filterAsyncIter;

function filterAsyncIter(predicate) {
  return async function* (source) {
    // let count = 0;
    for await (const item of source) {
      // if (await predicate(item, count++)) {
      //   yield item;
      // }
      if (await predicate(item)) {
        yield item;
      }
    }
  };
}
