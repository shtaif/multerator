import MulteratorError from '../utils/MulteratorError';

export default asyncIterOfBuffersSizeLimiter;

function asyncIterOfBuffersSizeLimiter(
  sizeLimit: number | undefined | null
): (src: AsyncIterable<Buffer>) => AsyncIterable<Buffer> {
  if (!isFiniteNumberPredicated(sizeLimit)) {
    return source => source;
  }

  return async function* (source) {
    let sizeCount = 0;

    for await (const item of source) {
      sizeCount += item.length;
      if (sizeCount > sizeLimit) {
        throw new MulteratorError(
          `Stream crossed max size limit of ${sizeLimit.toLocaleString()} bytes`,
          'ERR_REACHED_SIZE_LIMIT',
          { sizeLimitBytes: sizeLimit }
        );
      }
      yield item;
    }
  };
}

function isFiniteNumberPredicated(num: unknown): num is number {
  return Number.isFinite(num);
}
