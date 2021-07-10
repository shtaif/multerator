const { expect } = require('chai');
const multerator = require('..');
const pipe = require('./utils/pipe');
const collectMultipartStream = require('./utils/collectMultipartStream');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe('Size limits', () => {
  it('Throws size limit error when crossing the defined size limit in a text part', async () => {
    const collectedStreamPromise = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="binary_field"; filename="my_file.json"',
        'Content-Type: application/octet-stream',
        '',
        'a'.repeat(1025),
        `--${boundary}`,
        'Content-Disposition: form-data; name="text_field"',
        'Content-Type: text/plain',
        '',
        'a'.repeat(1025),
        `--${boundary}--`,
        '', // TODO: Is extra trailing "\r\n" required here?...
      ],
      prepareMultipartIterator,
      stream =>
        multerator({
          input: stream,
          boundary,
          maxFieldSize: 1024,
          maxFileSize: 1024 * 2,
        }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset({
      code: 'ERR_REACHED_SIZE_LIMIT',
      info: {
        sizeLimitBytes: 1024,
        partInfo: {
          name: 'text_field',
          contentType: 'text/plain',
          filename: undefined,
        },
      },
    });
  });

  it('Throws size limit error when crossing the defined size limit in a file part', async () => {
    const collectedStreamPromise = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="text_field"',
        'Content-Type: text/plain',
        '',
        'a'.repeat(1025),
        `--${boundary}`,
        'Content-Disposition: form-data; name="binary_field"; filename="my_file.json"',
        'Content-Type: application/octet-stream',
        '',
        'a'.repeat(1025),
        `--${boundary}--`, // TODO: Is extra trailing "\r\n" required here?...
      ],
      prepareMultipartIterator,
      stream =>
        multerator({
          input: stream,
          boundary,
          maxFieldSize: 1024 * 2,
          maxFileSize: 1024,
        }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset({
      code: 'ERR_REACHED_SIZE_LIMIT',
      info: {
        sizeLimitBytes: 1024,
        partInfo: {
          name: 'binary_field',
          contentType: 'application/octet-stream',
          filename: 'my_file.json',
        },
      },
    });
  });
});

const boundary = '--------------------------120789128139917295588288';
