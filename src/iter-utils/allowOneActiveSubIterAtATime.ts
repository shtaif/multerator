export default allowOneActiveSubIterAtATime;

async function* allowOneActiveSubIterAtATime<T>(
  sourceIter: AsyncIterable<AsyncIterable<T>>
): AsyncGenerator<AsyncGenerator<T>, void, undefined> {
  let promise: Promise<void>;
  let resolve = noop;

  for await (const subIter of sourceIter) {
    promise = new Promise(_resolve => (resolve = _resolve));

    yield (async function* () {
      yield* subIter;
      resolve();
    })();

    await promise;
  }
}

const noop: Function = () => {};
