import dedent from 'dedent';
import pipe from './pipe.js';
import asyncIterReorganizeChunks from './asyncIterReorganizeChunks.js';

export default prepareMultipartIterator;

function prepareMultipartIterator(
  source:
    | StringOrBuffer
    | StringOrBuffer[]
    | AsyncIterable<AsyncIterable<StringOrBuffer> | StringOrBuffer[]>
    | AsyncIterable<StringOrBuffer[] | AsyncIterable<StringOrBuffer>>,
  chunkSize = 100
): AsyncGenerator<Buffer> {
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
        const inputFormatted = dedent(input).replace(/[^\r]\n/g, '\r\n');
        return [inputFormatted];
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

type StringOrBuffer = string | Buffer;
