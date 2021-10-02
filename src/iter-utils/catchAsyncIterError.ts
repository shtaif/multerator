export default catchAsyncIterError;

async function* catchAsyncIterError<TSourceVals, TRecoveryFallbackVals>(
  sourceIter: AsyncIterable<TSourceVals>,
  recoveryFallbackFn: (
    err: any
  ) => Iterable<TRecoveryFallbackVals> | AsyncIterable<TRecoveryFallbackVals>
): AsyncIterable<TSourceVals | TRecoveryFallbackVals> {
  try {
    yield* sourceIter;
  } catch (err) {
    yield* recoveryFallbackFn(err);
  }
}
