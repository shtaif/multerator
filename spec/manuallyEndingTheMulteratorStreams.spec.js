const { expect } = require('chai');
const multerator = require('../src');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe('Manually ending the Multerator iterable', () => {
  it('Ending the Multerator iterable when the first part is just starting ends the original source as well', async () => {
    const source = generateSampleSource();

    const multeratedSource = multerator({
      input: source,
      boundary,
    });

    await multeratedSource.next();

    await multeratedSource.return();

    const sourceNextItem = await source.next();

    expect(sourceNextItem.done).to.be.true;
  });

  it('Ending the Multerator iterable between chunks of the first part ends the original source as well', async () => {
    const source = generateSampleSource();

    const multeratedSource = multerator({
      input: source,
      boundary,
    });

    const firstPart = (await multeratedSource.next()).value;

    await firstPart.data[Symbol.asyncIterator]().next();

    await multeratedSource.return();

    const sourceNextItem = await source.next();

    expect(sourceNextItem.done).to.be.true;
  });

  it('Ending the Multerator iterable when some intermediate part is just starting ends the original source as well', async () => {
    const source = generateSampleSource();

    const multeratedSource = multerator({
      input: source,
      boundary,
    });

    const firstPart = (await multeratedSource.next()).value;

    for await (const _ of firstPart.data);

    await multeratedSource.next();

    await multeratedSource.return();

    const sourceNextItem = await source.next();

    expect(sourceNextItem.done).to.be.true;
  });

  it('Ending the Multerator iterable between chunks of some intermediate part ends the original source as well', async () => {
    const source = generateSampleSource();

    const multeratedSource = multerator({
      input: source,
      boundary,
    });

    const firstPart = (await multeratedSource.next()).value;

    for await (const _ of firstPart.data);

    const secondPart = (await multeratedSource.next()).value;

    await secondPart.data[Symbol.asyncIterator]().next();

    await multeratedSource.return();

    const sourceNextItem = await source.next();

    expect(sourceNextItem.done).to.be.true;
  });
});

function generateSampleSource() {
  return prepareMultipartIterator(
    [
      `--${boundary}`,
      'Content-Disposition: form-data; name="field_1"; filename="my_file_1.json"',
      'Content-Type: application/octet-stream',
      '',
      'a'.repeat(200),
      `--${boundary}`,
      'Content-Disposition: form-data; name="field_2"; filename="my_file_2.json"',
      'Content-Type: application/octet-stream',
      '',
      'a'.repeat(200),
      `--${boundary}--`,
    ],
    10
  );
}

const boundary = '--------------------------120789128139917295588288';
