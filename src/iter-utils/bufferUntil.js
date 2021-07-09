module.exports = bufferUntil;

async function bufferUntil(
  source,
  predicate = () => false,
  { includeLast = false } = {}
) {
  const buffered = [];
  const sourceIter = source[Symbol.asyncIterator]();

  let value;
  let done;

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
    done,
  };
}
