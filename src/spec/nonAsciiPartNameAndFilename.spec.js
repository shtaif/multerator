const { expect } = require('chai');
const multerator = require('..').default;
const pipe = require('./utils/pipe');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');
const collectMultipartStream = require('./utils/collectMultipartStream');

describe('Non-ASCII chars in part name and filename', () => {
  it("Correctly parses a part's name encoded with some non-ASCII chars", async () => {
    const results = await pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="something_with_€_and_𓂀𓂀𓃥𓃥"',
        'Content-Type: text/plain',
        '',
        'my text',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    expect(results[0].name).to.equal('something_with_€_and_𓂀𓂀𓃥𓃥');
  });

  it("Correctly parses a part's filename encoded with some non-ASCII chars", async () => {
    const results = await pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="something_with_€_and_𓂀𓂀𓃥𓃥.txt"',
        'Content-Type: text/plain',
        '',
        'my text',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    expect(results[0].filename).to.equal('something_with_€_and_𓂀𓂀𓃥𓃥.txt');
  });
});

const boundary = '--------------------------120789128139917295588288';
