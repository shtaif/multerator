const { expect } = require('chai');
const multerator = require('..').default;
const pipe = require('./utils/pipe');
const collectMultipartStream = require('./utils/collectMultipartStream');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');
const bufferToChunks = require('./utils/bufferToChunks');

describe('Accepted input data types', () => {
  it('Successfully handles an async iterator of buffers', async () => {
    const collectedData = await pipe(
      sourceAsString,
      prepareMultipartIterator,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    expect(collectedData).to.containSubset(sourceExpectedDataCollected);
  });

  it('Successfully handles an iterator of buffers', async () => {
    const collectedData = await pipe(
      sourceAsString,
      Buffer.from,
      buf => bufferToChunks(buf, 20),
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    expect(collectedData).to.containSubset(sourceExpectedDataCollected);
  });

  it('Successfully handles a plain string', async () => {
    const collectedData = await pipe(
      sourceAsString,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    expect(collectedData).to.containSubset(sourceExpectedDataCollected);
  });

  it('Successfully handles a raw buffer', async () => {
    const collectedData = await pipe(
      sourceAsString,
      Buffer.from,
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    expect(collectedData).to.containSubset(sourceExpectedDataCollected);
  });

  it('Throws a "ERR_INVALID_INPUT_TYPE" error for any other thing', async () => {
    const collectedDataPromise = pipe(
      {},
      input => multerator({ input, boundary }),
      collectMultipartStream
    );

    await expect(
      collectedDataPromise
    ).to.eventually.be.rejected.and.containSubset({
      code: 'ERR_INVALID_INPUT_TYPE',
    });
  });
});

const boundary = '--------------------------120789128139917295588288';

const sourceAsString = [
  `--${boundary}`,
  'Content-Disposition: form-data; name="field_1"; filename="my_file_1.json"',
  'Content-Type: application/octet-stream',
  '',
  'my file content',
  `--${boundary}`,
  'Content-Disposition: form-data; name="field_2"',
  'Content-Type: text/plain',
  '',
  'my field content',
  `--${boundary}--`,
].join('\r\n');

const sourceExpectedDataCollected = [
  {
    name: 'field_1',
    data: Buffer.from('my file content'),
  },
  {
    name: 'field_2',
    data: 'my field content',
  },
];
