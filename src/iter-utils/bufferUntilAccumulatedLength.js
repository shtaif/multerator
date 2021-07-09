const bufferUntil = require('./bufferUntil');

module.exports = bufferUntilAccumulatedLength;

async function bufferUntilAccumulatedLength(source, targetLength) {
  let totalCollectedLength = 0;

  const resultOfBufferUntil = await bufferUntil(
    source,
    chunk => (totalCollectedLength += chunk.length) >= targetLength,
    { includeLast: true }
  );

  const bufferedChunks = resultOfBufferUntil.buffered;
  let rest = resultOfBufferUntil.rest;

  if (!bufferedChunks.length) {
    return { result: Buffer.alloc(0), rest };
  }

  const diffFromTargetLength = totalCollectedLength - targetLength;

  if (diffFromTargetLength > 0) {
    const lastChunk = bufferedChunks[bufferedChunks.length - 1];

    const preSplitChunk = lastChunk.subarray(0, -diffFromTargetLength);
    const postSplitChunk = lastChunk.subarray(-diffFromTargetLength);

    bufferedChunks[bufferedChunks.length - 1] = preSplitChunk;

    rest = prependValueToAsyncIter(rest, postSplitChunk);
  }

  const result = concatBuffers(bufferedChunks);

  return { result, rest };
}

function concatBuffers(buffersArr) {
  return buffersArr.length === 1 ? buffersArr[0] : Buffer.concat(buffersArr);
}

async function* prependValueToAsyncIter(source, value) {
  yield value;
  yield* source;
}
