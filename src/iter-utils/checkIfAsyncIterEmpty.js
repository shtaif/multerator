module.exports = checkIfAsyncIterEmpty;

async function checkIfAsyncIterEmpty(source) {
  const srcIterator = source[Symbol.asyncIterator]();

  const { value, done } = await srcIterator.next();

  if (done) {
    return;
  }

  return (async function* () {
    yield value;
    yield* srcIterator;
  })();
}
