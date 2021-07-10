const { expect } = require('chai');
const multerator = require('..');
const pipe = require('./utils/pipe');
const collectMultipartStream = require('./utils/collectMultipartStream');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe('Empty fields', () => {
  it('Empty text field from source ends up as an empty string', async () => {
    const results = await pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="my_field_1"',
        '',
        'hello world!',
        `--${boundary}`,
        'Content-Disposition: form-data; name="my_field_2"; filename="my_file.json"',
        'Content-Type: application/json',
        '',
        Buffer.from(`{"value":"${'a'.repeat(1024 * 3)}"}`),
        `--${boundary}`,
        'Content-Disposition: form-data; name="my_field_3"',
        '',
        '',
        `--${boundary}--`,
        '', // TODO: Is extra trailing "\r\n" required here?...
      ],
      prepareMultipartIterator,
      source => multerator({ input: source, boundary }),
      collectMultipartStream
    );

    const myField3 = results[2];

    expect(myField3).to.deep.equal({
      type: 'text',
      name: 'my_field_3',
      contentType: 'text/plain',
      filename: undefined,
      encoding: '7bit',
      data: '',
    });
  });

  it('Empty file field from source ends up as an empty stream', async () => {
    const results = await pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="my_field_1"',
        '',
        'hello world!',
        `--${boundary}`,
        'Content-Disposition: form-data; name="my_field_2"; filename="file1.json"',
        'Content-Type: application/json',
        '',
        Buffer.from(`{"value":"${'a'.repeat(1024 * 3)}"}`),
        `--${boundary}`,
        'Content-Disposition: form-data; name="my_field_3"; filename="my_file.js"',
        'Content-Type: application/javascript',
        '',
        Buffer.alloc(0),
        `--${boundary}--`,
        '', // TODO: Is extra trailing "\r\n" required here?...
      ],
      prepareMultipartIterator,
      source => multerator({ input: source, boundary }),
      collectMultipartStream
    );

    const myField3 = results[2];

    expect(myField3).to.deep.equal({
      type: 'file',
      name: 'my_field_3',
      contentType: 'application/javascript',
      filename: 'my_file.js',
      encoding: '7bit',
      data: Buffer.alloc(0),
    });
  });
});

const boundary = '--------------------------120789128139917295588288';
