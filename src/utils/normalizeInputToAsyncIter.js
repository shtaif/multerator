module.exports = normalizeInputToAsyncIter;

async function* normalizeInputToAsyncIter(source) {
  if (typeof source === 'string') {
    yield Buffer.from(source);
  } else if (Buffer.isBuffer(source)) {
    yield source;
  } else if (source[Symbol.asyncIterator] || source[Symbol.iterator]) {
    yield* source;
  } else {
    // TODO: Finalize this error!
    throw new Error('Invalid input');
  }
}
