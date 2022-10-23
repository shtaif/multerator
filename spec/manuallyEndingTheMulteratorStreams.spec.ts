import { Readable } from 'stream';
import { expect } from 'chai';
import sinon from 'sinon';
import { multerator } from '../src/index.js';
import pipe from './utils/pipe.js';
import nextTick from './utils/nextTick';
import prepareMultipartIterator from './utils/prepareMultipartIterator';

describe('Manually ending the Multerator iterable', () => {
  beforeEach(() => {
    sinon.restore();
  });

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

  describe('Ending a part body sub iterable in between chunks ends the original source a tick later as well', () => {
    it('Source being an async iterable', async () => {
      const source = generateSampleSource();

      const sourceReturnFulfilledByNowSpy = sinon.spy();

      const sourceReturnStub = sinon
        .stub(source, 'return')
        .callsFake(async function () {
          const res = await sourceReturnStub.wrappedMethod.call(this);
          sourceReturnFulfilledByNowSpy();
          return res;
        });

      const multeratedSource = multerator({
        input: source,
        boundary,
      });

      const firstPart = (await multeratedSource.next()).value!;

      for await (const _ of firstPart.data) {
        break;
      }

      await nextTick();

      expect(sourceReturnStub).to.contain({ callCount: 1 });
      expect(sourceReturnFulfilledByNowSpy).to.contain({ callCount: 1 });
    });

    it('Source being a readable stream', async () => {
      const source = pipe(generateSampleSource(), Readable.from);

      const multeratedSource = multerator({
        input: source,
        boundary,
      });

      const firstPart = (await multeratedSource.next()).value!;

      for await (const _ of firstPart.data) {
        break;
      }

      await nextTick();

      expect(source).to.contain({ destroyed: true });
    });
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
