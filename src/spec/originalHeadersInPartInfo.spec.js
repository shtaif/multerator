const { expect } = require('chai');
const multerator = require('..').default;
const pipe = require('./utils/pipe');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

// TODO: Add test with a "no-headers" part that expects it to correctly include an empty headers object in the yielded info

it('Yielded part info reflects exact original part headers', async () => {
  const source = pipe(
    [
      `--${boundary}`,
      'Content-Disposition: form-data; name="field_1"',
      'Content-Type: text/plain',
      'My-Custom-Header-1: my_custom_header_1_value',
      '',
      'text value of field_1',
      `--${boundary}--`,
    ],
    prepareMultipartIterator,
    input => multerator({ input, boundary })
  );

  const yieldedPartInfo = (await source.next()).value;

  expect(yieldedPartInfo.headers).to.deep.equal({
    'Content-Disposition': 'form-data; name="field_1"',
    'Content-Type': 'text/plain',
    'My-Custom-Header-1': 'my_custom_header_1_value',
  });
});

const boundary = '--------------------------120789128139917295588288';
