import { Readable } from 'stream';

export default asyncBufferIterToReadable;

function asyncBufferIterToReadable(iter: AsyncIterable<Buffer>): Readable {
  return Readable.from(iter, {
    objectMode: false,
    highWaterMark: 0, // TODO: Explain rational of this
  });
}
