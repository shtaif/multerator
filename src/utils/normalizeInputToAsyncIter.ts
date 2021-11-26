import MulteratorError from './MulteratorError';

export default normalizeInputToAsyncIter;

async function* normalizeInputToAsyncIter(
  source: AsyncIterable<Buffer> | Iterable<Buffer> | Buffer | string
): AsyncGenerator<Buffer, void, undefined> {
  if (typeof source === 'string') {
    yield Buffer.from(source);
  } else if (Buffer.isBuffer(source)) {
    yield source;
  } else if (
    // TS would have only accepted the following checks as `'prop' in obj` expressions, which I prefer to avoid here as they are slightly less performant
    (source as any)?.[Symbol.asyncIterator] ||
    (source as any)?.[Symbol.iterator]
  ) {
    yield* source;
  } else {
    throw new MulteratorError(
      'Invalid input type provided. Input must be either a string, a buffer, or an async/sync iterable of buffers.',
      'ERR_INVALID_INPUT_TYPE'
    );
  }
}
