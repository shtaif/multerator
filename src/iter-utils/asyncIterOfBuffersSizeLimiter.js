const MultiParserError = require('../utils/MultiParserError');

module.exports = asyncIterOfBuffersSizeLimiter;

function asyncIterOfBuffersSizeLimiter(sizeLimit) {
  if (!Number.isFinite(sizeLimit)) {
    return source => source;
  }

  return async function* (source) {
    let sizeCount = 0;

    for await (const item of source) {
      sizeCount += item.length;
      if (sizeCount > sizeLimit) {
        throw new MultiParserError(
          `Stream crossed max size limit of ${sizeLimit.toLocaleString()} bytes`,
          'ERR_REACHED_SIZE_LIMIT',
          { sizeLimitBytes: sizeLimit }
        );
      }
      yield item;
    }
  };
}
