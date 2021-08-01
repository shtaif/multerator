import bufferUntil from './bufferUntil';
import prependAsyncIter from './prependAsyncIter';

export default bufferUntilAccumulatedLength;

async function bufferUntilAccumulatedLength(
  source: AsyncIterable<Buffer>,
  targetLength: number
): Promise<{
  result: Buffer;
  rest: AsyncIterable<Buffer>;
}> {
  let totalCollectedLength = 0;

  const resultOfBufferUntil = await bufferUntil(
    source,
    chunk => (totalCollectedLength += chunk.length) >= targetLength,
    { includeLast: true }
  );

  const bufferedChunks = resultOfBufferUntil.buffered;
  let rest = resultOfBufferUntil.rest;

  if (!bufferedChunks.length) {
    return {
      result: Buffer.alloc(0),
      rest,
    };
  }

  const diffFromTargetLength = totalCollectedLength - targetLength;

  if (diffFromTargetLength > 0) {
    const lastChunk = bufferedChunks[bufferedChunks.length - 1];

    const preSplitChunk = lastChunk.subarray(0, -diffFromTargetLength);
    const postSplitChunk = lastChunk.subarray(-diffFromTargetLength);

    bufferedChunks[bufferedChunks.length - 1] = preSplitChunk;

    rest = prependAsyncIter(postSplitChunk, rest);
  }

  const result = concatBuffers(bufferedChunks);

  return {
    result,
    rest,
  };
}

function concatBuffers(buffersArr: Buffer[]): Buffer {
  return buffersArr.length === 1 ? buffersArr[0] : Buffer.concat(buffersArr);
}
