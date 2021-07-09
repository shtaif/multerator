module.exports = tapAsyncIter;

function tapAsyncIter(fn) {
  return async function* (source) {
    let counter = 0;
    for await (const item of source) {
      await fn(item, counter++);
      yield item;
    }
  };
}
