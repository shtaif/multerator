export default prependAsyncIter;

async function* prependAsyncIter<TSrc, TPrepended>(
  prependedValue: TPrepended,
  iter: AsyncIterable<TSrc>
): AsyncGenerator<TSrc | TPrepended, void, undefined> {
  yield prependedValue;
  yield* iter;
}
