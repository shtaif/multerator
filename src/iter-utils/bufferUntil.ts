export default bufferUntil;

async function bufferUntil<T>(
  source: AsyncIterable<T>,
  predicate: (val: T) => boolean = defaultPredicate,
  { includeLast = false } = {}
): Promise<{
  buffered: T[];
  rest: AsyncIterable<T>;
  done: boolean;
}> {
  const buffered: T[] = [];
  const sourceIter = source[Symbol.asyncIterator]();

  let value: T;
  let done: boolean | undefined;

  for (;;) {
    ({ done, value } = await sourceIter.next());
    if (done || predicate(value)) {
      break;
    }
    buffered.push(value);
  }

  let rest = source;

  if (!done) {
    if (includeLast) {
      buffered.push(value);
    } else {
      rest = (async function* () {
        yield value;
        yield* source;
      })();
    }
  }

  return {
    buffered,
    rest,
    done: !!done,
  };
}

function defaultPredicate() {
  return false;
}
