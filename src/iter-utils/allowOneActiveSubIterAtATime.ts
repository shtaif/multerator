export default allowOneActiveSubIterAtATime;

async function* allowOneActiveSubIterAtATime<T>(
  source: AsyncIterable<AsyncIterable<T>>
): AsyncGenerator<AsyncGenerator<T>, void, undefined> {
  let promise: Promise<void>;
  let resolve = noop;

  for await (const partIter of source) {
    promise = new Promise(_resolve => (resolve = _resolve));

    const delayedPartIter = (async function* () {
      yield* partIter;
      resolve();
    })();

    yield delayedPartIter;

    await promise;
  }
}

const noop: Function = () => {};
