import { expect } from 'chai';
import { multerator } from '../src/index.js';
import pipe from './utils/pipe.js';
import collectMultipartStream from './utils/collectMultipartStream';
import prepareMultipartIterator from './utils/prepareMultipartIterator';

describe('Preamble and epilogue', () => {
  it('Input with empty preamble is not interfering with correct parsing', async () => {
    const results = await pipe(
      prepareMultipartIterator(multipartContentBase),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    expect(results).to.deep.equal(multipartContentBaseExpectedParsedResults);
  });

  it('Input with a preamble of just a CRLF is not interfering with correct parsing', async () => {
    // The challenge intended in this test is that it happens to make the initial boundary in the input resemble an inter-boundary
    const results = await pipe(
      prepareMultipartIterator(`\r\n${multipartContentBase}`),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    expect(results).to.deep.equal(multipartContentBaseExpectedParsedResults);
  });

  it('Input with a preamble of some bigger multi line data is not interfering with correct parsing', async () => {
    const results = await pipe(
      prepareMultipartIterator(
        `aaa\r\naaa\r\n${'\0'.repeat(128)}${multipartContentBase}`
      ),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    expect(results).to.deep.equal(multipartContentBaseExpectedParsedResults);
  });

  it('Input with an epilogue of some data is not interfering with correct parsing', async () => {
    const results = await pipe(
      prepareMultipartIterator(`${multipartContentBase}${'\0'.repeat(128)}`),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    expect(results).to.deep.equal(multipartContentBaseExpectedParsedResults);
  });

  it('Input with a preamble and epilogue of some data is not interfering with correct parsing', async () => {
    const results = await pipe(
      prepareMultipartIterator(
        `${'\0'.repeat(128)}${multipartContentBase}${'\0'.repeat(128)}`
      ),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );

    expect(results).to.deep.equal(multipartContentBaseExpectedParsedResults);
  });
});

const boundary = '--------------------------120789128139917295588288';

const multipartContentBase = [
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
].join('\r\n');

const multipartContentBaseExpectedParsedResults = [
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
];
