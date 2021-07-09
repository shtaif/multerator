module.exports = mapAsyncIter;

function mapAsyncIter(mapFn) {
  return async function* (source) {
    for await (const item of source) {
      yield mapFn(item);
    }
  };
}
