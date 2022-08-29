export default asyncIterOfBuffersSizeLimiter;

function asyncIterOfBuffersSizeLimiter(
  sizeLimit: number | undefined | null,
  customError:
    | ((sizeLimit: number) => any)
    | (() => any) = defaultSizeLimitReachedErrorMaker
): (src: AsyncIterable<Buffer>) => AsyncGenerator<Buffer> {
  if (!isFiniteNumberPredicated(sizeLimit)) {
    return async function* (source) {
      yield* source;
    };
  }

  return async function* (source) {
    let sizeCount = 0;

    for await (const item of source) {
      sizeCount += item.length;
      if (sizeCount > sizeLimit) {
        throw customError(sizeLimit);
      }
      yield item;
    }
  };
}

function isFiniteNumberPredicated(num: unknown): num is number {
  return Number.isFinite(num);
}

function defaultSizeLimitReachedErrorMaker(sizeLimit: number) {
  return new Error(
    `Crossed max size limit of ${sizeLimit.toLocaleString()} bytes`
  );
}
