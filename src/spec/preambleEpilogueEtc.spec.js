const { expect } = require('chai');
const multerator = require('..');
const pipe = require('./utils/pipe');
const collectMultipartStream = require('./utils/collectMultipartStream');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe('Preamble epilogue etc.............', () => {
  it('Input with empty preamble not interfering with correct parsing', async () => {
    const results = await pipe(
      prepareMultipartIterator([
        `--${boundary}`,
        'Content-Disposition: form-data; name="field1"',
        'Content-Type: text/plain',
        '',
        'text value of field1',
        `--${boundary}`,
        'Content-Disposition: form-data; name="field2"',
        'Content-Type: text/plain',
        '',
        'text value of field2',
        `--${boundary}--`,
      ]),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    expect(results).to.deep.equal([
      {
        type: 'text',
        name: 'field1',
        contentType: 'text/plain',
        data: 'text value of field1',
        filename: undefined,
        encoding: '7bit',
      },
      {
        type: 'text',
        name: 'field2',
        contentType: 'text/plain',
        data: 'text value of field2',
        filename: undefined,
        encoding: '7bit',
      },
    ]);
  });

  it('Input with a preamble of just a CRLF is not interfering with correct parsing', async () => {
    // The challenge that's intended in this test is that it happens to make the initial boundary in the input to resemble an inter-boundary
    const results = await pipe(
      prepareMultipartIterator([
        '',
        `--${boundary}`,
        'Content-Disposition: form-data; name="field1"',
        'Content-Type: text/plain',
        '',
        'text value of field1',
        `--${boundary}`,
        'Content-Disposition: form-data; name="field2"',
        'Content-Type: text/plain',
        '',
        'text value of field2',
        `--${boundary}--`,
      ]),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    expect(results).to.deep.equal([
      {
        type: 'text',
        name: 'field1',
        contentType: 'text/plain',
        data: 'text value of field1',
        filename: undefined,
        encoding: '7bit',
      },
      {
        type: 'text',
        name: 'field2',
        contentType: 'text/plain',
        data: 'text value of field2',
        filename: undefined,
        encoding: '7bit',
      },
    ]);
  });
});

// const results = await pipe(
//   prepareMultipartIterator(
//     [
//       '',
//       'aaa',
//       `aaa--${boundary}`,
//       'Content-Disposition: form-data; name="field1"',
//       'Content-Type: text/plain',
//       '',
//       'text value of field1',
//       `--${boundary}`,
//       'Content-Disposition: form-data; name="field2"',
//       'Content-Type: text/plain',
//       '',
//       'text value of field2',
//       `--${boundary}--`,
//       '___',
//       `--${boundary}\r\n--aaa`,
//       // 'aaa',
//       // '',
//       // 'a',
//       // '',
//     ],
//     10
//   ),
//   stream => multerator({ input: stream, boundary }),
//   collectMultipartStream
// );

const boundary = '--------------------------120789128139917295588288';
