const { expect } = require('chai');
const multerator = require('..').default;
const pipe = require('./utils/pipe');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe('Size limits', () => {
  it('Throws size limit error when text field crosses specified text field size limit', async () => {
    const gen = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_1"',
        'Content-Type: text/plain',
        '',
        'a'.repeat(10),
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_2"',
        'Content-Type: text/plain',
        '',
        'a'.repeat(11),
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input =>
        multerator({
          input,
          boundary,
          maxFieldSize: 10,
        })
    );

    const firstPart = await gen.next();
    for await (const _ of firstPart.value.data);

    const secondPartPromise = gen.next();

    await expect(secondPartPromise).to.eventually.be.rejected.and.containSubset(
      {
        code: 'ERR_REACHED_SIZE_LIMIT',
        info: {
          sizeLimitBytes: 10,
          partInfo: {
            name: 'field_2',
            contentType: 'text/plain',
            filename: undefined,
          },
        },
      }
    );
  });

  it('Throws size limit error when file field crosses specified file field size limit', async () => {
    const gen = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_1"; filename="my_file_1.json"',
        'Content-Type: application/octet-stream',
        '',
        'a'.repeat(10),
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_2"; filename="my_file_2.json"',
        'Content-Type: application/octet-stream',
        '',
        'a'.repeat(11),
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input =>
        multerator({
          input,
          boundary,
          maxFileSize: 10,
        })
    );

    const firstPart = await gen.next();
    for await (const _ of firstPart.value.data);

    const secondPartPromise = (async () => {
      const thirdPart = await gen.next();
      for await (const _ of thirdPart.value.data);
    })();

    await expect(secondPartPromise).to.eventually.be.rejected.and.containSubset(
      {
        code: 'ERR_REACHED_SIZE_LIMIT',
        info: {
          sizeLimitBytes: 10,
          partInfo: {
            name: 'field_2',
            contentType: 'application/octet-stream',
            filename: 'my_file_2.json',
          },
        },
      }
    );
  });

  it('Throws size limit error when part headers cross specified headers size limit', async () => {
    const exaggeratedHeaders = [
      'Content-Disposition: form-data; name="field_2"; filename="my_file_2.json"',
      'Content-Type: application/octet-stream',
      'X-My-Custom-Header-1: my_custom_header_1_value',
      'X-My-Custom-Header-2: my_custom_header_2_value',
      'X-My-Custom-Header-3: my_custom_header_3_value',
      'X-My-Custom-Header-4: my_custom_header_4_value',
    ].join('\r\n');

    const maxHeadersSizeToUse = exaggeratedHeaders.length - 1;

    const gen = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_1"; filename="my_file_1.json"',
        'Content-Type: application/octet-stream',
        '',
        'My part body data...',
        `--${boundary}`,
        exaggeratedHeaders,
        '',
        'My part body data...',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input =>
        multerator({
          input,
          boundary,
          maxHeadersSize: maxHeadersSizeToUse,
        })
    );

    const firstPart = await gen.next();
    for await (const _ of firstPart.value.data);

    const secondPartPromise = gen.next(); // (By the time this gets fulfilled, headers should have already been attempted to be parsed)

    await expect(secondPartPromise).to.eventually.be.rejected.and.containSubset(
      {
        code: 'ERR_REACHED_SIZE_LIMIT', // Better name for this size error variation?...
        info: {
          sizeLimitBytes: maxHeadersSizeToUse,
        },
      }
    );
  });
});

const boundary = '--------------------------120789128139917295588288';
