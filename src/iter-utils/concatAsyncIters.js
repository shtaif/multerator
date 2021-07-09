module.exports = concatAsyncIters;

async function* concatAsyncIters(...sources) {
  for (let i = 0; i < sources.length; ++i) {
    yield* sources[i];
  }
}
