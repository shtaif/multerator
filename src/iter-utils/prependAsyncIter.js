module.exports = prependAsyncIter;

async function* prependAsyncIter(prependedValue, iter) {
  yield prependedValue;
  yield* iter;
}
