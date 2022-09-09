import { Readable } from 'stream';

function asyncBufferIterToReadableInternal(
  iter: AsyncIterable<Buffer>
): Readable {
  return Readable.from(iter, {
    objectMode: false,
    highWaterMark: 0, // TODO: Explain rational of this
  });
}

const asyncBufferIterToReadable = process.versions.node.startsWith('10.')
  ? (iter: AsyncGenerator<Buffer>): Readable => {
      // Monkey patching specific to Node 10 since its `Readable.from`-returned streams, when get destroyed, they miss out closing the source iterable if it was yet to be finished at that point
      // TODO: If wanting the package to support Node 11.x.x as well, then check if this monkey patching is relevant also for it
      const readable = asyncBufferIterToReadableInternal(iter);
      readable._destroy = async (possibleError, cb) => {
        try {
          await iter.return(undefined);
          cb(possibleError);
        } catch (errorFromClosingIter: any) {
          cb(errorFromClosingIter);
        }
      };
      return readable;
    }
  : asyncBufferIterToReadableInternal;

export default asyncBufferIterToReadable;
