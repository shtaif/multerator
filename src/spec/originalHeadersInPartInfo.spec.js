const { expect } = require('chai');
const multerator = require('..').default;
const pipe = require('./utils/pipe');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe("Part info's original headers reflection", () => {
  it("Original part headers are reflected via the yielded part info's `headers` prop as an object", async () => {
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

    const { headers } = (await source.next()).value;

    expect(headers).to.deep.equal({
      'Content-Disposition': 'form-data; name="field_1"',
      'Content-Type': 'text/plain',
      'My-Custom-Header-1': 'my_custom_header_1_value',
    });
  });
});

const boundary = '--------------------------120789128139917295588288';
