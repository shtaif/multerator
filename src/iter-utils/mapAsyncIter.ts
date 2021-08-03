export default mapAsyncIter;

function mapAsyncIter<IN_T, OUT_T>(
  mapFn: (val: IN_T) => OUT_T
): (src: AsyncIterable<IN_T>) => AsyncIterable<OUT_T> {
  return async function* (source) {
    for await (const item of source) {
      yield mapFn(item);
    }
  };
}
