const dedent = require('dedent');
const pipe = require('./pipe');
const asyncIterReorganizeChunks = require('./asyncIterReorganizeChunks');

module.exports = prepareMultipartIterator;

function prepareMultipartIterator(source, chunkSize = 100) {
  return pipe(
    source,
    input => {
      if (Array.isArray(input)) {
        return (async function* () {
          if (!input.length) {
            return;
          }
          const [first, ...rest] = input;
          yield first;
          for (const item of rest) {
            yield '\r\n';
            yield item;
          }
        })();
      }
      if (typeof input === 'string') {
        return [dedent(input).replace(/\n/g, '\r\n')];
      }
      return input;
    },
    async function* (input) {
      for await (const item of input) {
        if (Array.isArray(item) || item[Symbol.asyncIterator]) {
          yield* item;
        } else {
          yield item;
        }
      }
    },
    async function* (input) {
      for await (const item of input) {
        const bufferized = typeof item === 'string' ? Buffer.from(item) : item;
        yield bufferized;
      }
    },
    input => asyncIterReorganizeChunks(input, chunkSize)
  );
}
