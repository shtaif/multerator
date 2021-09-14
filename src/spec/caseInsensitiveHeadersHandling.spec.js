const { expect } = require('chai');
const multerator = require('..').default;
const pipe = require('./utils/pipe');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');
const collectMultipartStream = require('./utils/collectMultipartStream');

describe('Case-insensitive part headers handling', () => {
  it('Successfully parses and recognizes input data with headers in the conventional HTTP header case', async () => {
    const results = await pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_1"',
        'Content-Type: my/content-type',
        '',
        'text value of field_1',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    expect(results).to.containSubset([
      {
        name: 'field_1',
        contentType: 'my/content-type',
      },
    ]);
  });

  it('Successfully parses and recognizes input data with headers in lower case', async () => {
    const results = await pipe(
      [
        `--${boundary}`,
        'content-disposition: form-data; name="field_1"',
        'content-type: my/content-type',
        '',
        'text value of field_1',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    expect(results).to.containSubset([
      {
        name: 'field_1',
        contentType: 'my/content-type',
      },
    ]);
  });

  it('Successfully parses and recognizes input data with headers in upper case', async () => {
    const results = await pipe(
      [
        `--${boundary}`,
        'CONTENT-DISPOSITION: form-data; name="field_1"',
        'CONTENT-TYPE: my/content-type',
        '',
        'text value of field_1',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    expect(results).to.containSubset([
      {
        name: 'field_1',
        contentType: 'my/content-type',
      },
    ]);
  });
});

const boundary = '--------------------------120789128139917295588288';
