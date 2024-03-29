import { expect } from 'chai';
import { multerator } from '../src/index.js';
import pipe from './utils/pipe.js';
import collectMultipartStream from './utils/collectMultipartStream.js';
import prepareMultipartIterator from './utils/prepareMultipartIterator.js';

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
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    const myField3 = results[2];

    expect(myField3).to.containSubset({
      type: 'text',
      name: 'my_field_3',
      contentType: 'text/plain',
      filename: undefined,
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
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    const myField3 = results[2];

    expect(myField3).to.containSubset({
      type: 'file',
      name: 'my_field_3',
      contentType: 'application/javascript',
      filename: 'my_file.js',
      data: Buffer.alloc(0),
    });
  });
});

const boundary = '--------------------------120789128139917295588288';
