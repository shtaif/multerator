module.exports = allowOneActiveSubIterAtATime;

async function* allowOneActiveSubIterAtATime(source) {
  let promise;
  let resolve;

  for await (const partIter of source) {
    promise = new Promise(res => (resolve = res));

    const delayedPartIter = (async function* () {
      yield* partIter;
      resolve();
    })();

    yield delayedPartIter;

    await promise;
  }
}
