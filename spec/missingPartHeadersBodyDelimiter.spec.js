const { expect } = require('chai');
const multerator = require('../src');
const pipe = require('./utils/pipe');
const collectMultipartStream = require('./utils/collectMultipartStream');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe('Missing part headers<->body delimiter', () => {
  it('Throws missing part headers<->body delimiter error on a part that has only headers', async () => {
    const collectedStreamPromise = pipe(
      [
        `--${boundary}`,
        `Content-Disposition: form-data; name="my_binary_field_1"; filename="my_file_1"`,
        `Content-Type: application/octet-stream`,
        `--${boundary}`,
        `Content-Disposition: form-data; name="my_binary_field_2"; filename="my_file_2"`,
        `Content-Type: application/octet-stream`,
        '',
        'data2 data2 data2 data2 data2 data2 data2 data2',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset(
      missingHeadersBodyDelimiterErrorRequiredProps
    );
  });

  it("Throws missing part headers<->body delimiter error on a part that has only data (which doesn't look like headers)", async () => {
    const collectedStreamPromise = pipe(
      [
        `--${boundary}`,
        'data1 data1 data1 data1 data1 data1 data1 data1',
        `--${boundary}`,
        `Content-Disposition: form-data; name="my_binary_field_2"; filename="my_file_2"`,
        `Content-Type: application/octet-stream`,
        '',
        'data2 data2 data2 data2 data2 data2 data2 data2',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset(
      missingHeadersBodyDelimiterErrorRequiredProps
    );
  });

  it('Throws missing part headers<->body delimiter error when a part has both headers and data but lacks a delimiter between them', async () => {
    const collectedStreamPromise = pipe(
      [
        `--${boundary}`,
        `Content-Disposition: form-data; name="my_binary_field_1"; filename="my_file_1"`,
        `Content-Type: application/octet-stream`,
        'data1 data1 data1 data1 data1 data1 data1 data1',
        `--${boundary}`,
        `Content-Disposition: form-data; name="my_binary_field_2"; filename="my_file_2"`,
        `Content-Type: application/octet-stream`,
        '',
        'data2 data2 data2 data2 data2 data2 data2 data2',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    await expect(
      collectedStreamPromise
    ).to.eventually.be.rejected.and.containSubset(
      missingHeadersBodyDelimiterErrorRequiredProps
    );
  });
});

const missingHeadersBodyDelimiterErrorRequiredProps = {
  code: 'ERR_MISSING_PART_HEADERS_BODY_DELIMITER',
  message:
    'Invalid part structure; missing headers-body delimiter token "\\r\\n\\r\\n"',
};

const boundary = '--------------------------120789128139917295588288';
