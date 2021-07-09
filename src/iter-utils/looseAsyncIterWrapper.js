module.exports = looseAsyncIterWrapper;

async function* looseAsyncIterWrapper(source) {
  // const srcIterator = source[Symbol.asyncIterator]();

  const srcIterator = (
    source[Symbol.asyncIterator] || source[Symbol.iterator]
  ).call(source);

  // let srcIterator;
  // if (source[Symbol.asyncIterator]) {
  //   srcIterator = source[Symbol.asyncIterator]();
  // } else {
  //   srcIterator = source[Symbol.iterator]();
  // }

  for (;;) {
    const { value, done } = await srcIterator.next();
    if (done) {
      break;
    }
    yield value;
  }
}
