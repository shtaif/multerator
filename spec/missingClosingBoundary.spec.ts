import { expect } from 'chai';
import { multerator } from '../src/index.js';
import pipe from './utils/pipe.js';
import collectMultipartStream from './utils/collectMultipartStream';
import prepareMultipartIterator from './utils/prepareMultipartIterator';

describe('Missing closing boundary', () => {
  it('Throws missing closing boundary error on a completely empty stream', async () => {
    const collectedStreamPromise = pipe(
      [],
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset(
      missingClosingBoundaryErrorRequiredProps
    );
  });

  it('Throws missing closing boundary error when stream ends exactly after an intermediate boundary', async () => {
    const collectedStreamPromise = pipe(
      [
        `--${boundary}`,
        `Content-Disposition: form-data; name="my_binary_field"; filename="my_file"`,
        `Content-Type: application/octet-stream`,
        '',
        'data data data data data data data data',
        `--${boundary}`,
        '',
      ],
      prepareMultipartIterator,
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset(
      missingClosingBoundaryErrorRequiredProps
    );
  });

  it("Throws missing closing boundary error when stream ends during a part's headers", async () => {
    const collectedStreamPromise = pipe(
      [
        `--${boundary}`,
        `Content-Disposition: form-data; name="my_binary_field"; filename="my_fi`,
      ],
      prepareMultipartIterator,
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset(
      missingClosingBoundaryErrorRequiredProps
    );
  });

  it("Throws missing closing boundary error when stream ends during a part's body", async () => {
    const collectedStreamPromise = pipe(
      [
        `--${boundary}`,
        `Content-Disposition: form-data; name="my_binary_field"; filename="my_file"`,
        `Content-Type: application/octet-stream`,
        '',
        'data data data data data data data data',
      ],
      prepareMultipartIterator,
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset(
      missingClosingBoundaryErrorRequiredProps
    );
  });

  it('Throws missing closing boundary error when stream ends after emitting only partial closing boundary', async () => {
    const closingBoundary = `--${boundary}--`;

    const halfClosingBoundary = closingBoundary.slice(
      0,
      Math.round(closingBoundary.length / 2)
    );

    const collectedStreamPromise = pipe(
      [
        `--${boundary}`,
        `Content-Disposition: form-data; name="my_binary_field"; filename="my_file"\r\n`,
        `Content-Type: application/octet-stream`,
        '',
        'data data data data data data data data',
        halfClosingBoundary,
      ],
      prepareMultipartIterator,
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset(
      missingClosingBoundaryErrorRequiredProps
    );
  });
});

const missingClosingBoundaryErrorRequiredProps = {
  code: 'ERR_MISSING_CLOSING_BOUNDARY',
  message:
    'Invalid multipart payload format; stream ended unexpectedly without a closing boundary',
};

const boundary = '--------------------------120789128139917295588288';
