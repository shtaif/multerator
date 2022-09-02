import { expect } from 'chai';
import multerator from '../src';
import prepareMultipartIterator from './utils/prepareMultipartIterator';

describe('Manually ending the Multerator iterable', () => {
  it('Ending the Multerator iterable when the first part has been just opened immediately ends the original source as well', async () => {
    const source = generateSampleSource();

    const multeratedSource = multerator({
      input: source,
      boundary,
    });

    await multeratedSource.next();

    await multeratedSource.return();

    const sourceNextItem = await source.next();

    expect(sourceNextItem).to.contain({ done: true });
  });

  it('Ending the Multerator iterable during the first part in between chunks immediately ends the original source as well', async () => {
    const source = generateSampleSource();

    const multeratedSource = multerator({
      input: source,
      boundary,
    });

    const firstPart = (await multeratedSource.next()).value!;

    await firstPart.data[Symbol.asyncIterator]().next();

    await multeratedSource.return();

    const sourceNextItem = await source.next();

    expect(sourceNextItem).to.contain({ done: true });
  });

  it('Ending the Multerator iterable when some intermediate part has been just opened immediately ends the original source as well', async () => {
    const source = generateSampleSource();

    const multeratedSource = multerator({
      input: source,
      boundary,
    });

    const firstPart = (await multeratedSource.next()).value!;

    for await (const _ of firstPart.data);

    await multeratedSource.next();

    await multeratedSource.return();

    const sourceNextItem = await source.next();

    expect(sourceNextItem).to.contain({ done: true });
  });

  it('Ending the Multerator iterable during some intermediate part in between chunks immediately ends the original source as well', async () => {
    const source = generateSampleSource();

    const multeratedSource = multerator({
      input: source,
      boundary,
    });

    const firstPart = (await multeratedSource.next()).value!;

    for await (const _ of firstPart.data);

    const secondPart = (await multeratedSource.next()).value!;

    await secondPart.data[Symbol.asyncIterator]().next();

    await multeratedSource.return();

    const sourceNextItem = await source.next();

    expect(sourceNextItem).to.contain({ done: true });
  });

  it('Ending a part body sub iterable in between chunks immediately ends the original source as well', async () => {
    const source = generateSampleSource();

    const multeratedSource = multerator({
      input: source,
      boundary,
    });

    const firstPart = (await multeratedSource.next()).value!;

    for await (const _ of firstPart.data) {
      break;
    }

    const sourceNextItem = await source.next();

    expect(sourceNextItem).to.contain({ done: true });
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
