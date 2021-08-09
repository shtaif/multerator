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
});

const boundary = '--------------------------120789128139917295588288';
