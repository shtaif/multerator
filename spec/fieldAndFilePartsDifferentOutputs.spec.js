const { expect } = require('chai');
const multerator = require('../src');
const pipe = require('./utils/pipe');
const bufferAsyncIterOfBuffers = require('./utils/bufferAsyncIterOfBuffers');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe('Field/file parts distinction in output part infos', () => {
  describe('When given a field part', () => {
    let yieldedPartInfo;

    before(async () => {
      const source = pipe(
        [
          `--${boundary}`,
          'Content-Disposition: form-data; name="field_1"',
          'Content-Type: text/plain',
          '',
          'text value of field_1',
          `--${boundary}--`,
        ],
        prepareMultipartIterator,
        input => multerator({ input, boundary })
      );

      yieldedPartInfo = (await source.next()).value;
    });

    it('has `type` = "text"', () => {
      expect(yieldedPartInfo.type).to.equal('text');
    });

    it('has `filename` = undefined', () => {
      expect(yieldedPartInfo.filename).to.be.undefined;
    });

    it('has `data` as correct value in string form', () => {
      expect(yieldedPartInfo.data).to.equal('text value of field_1');
    });
  });

  describe('When given a file part', () => {
    let yieldedPartInfo;

    before(async () => {
      const source = pipe(
        [
          `--${boundary}`,
          'Content-Disposition: form-data; name="field_1"; filename="my_file";',
          'Content-Type: application/octet-stream',
          '',
          Buffer.from([0, 1, 2, 0, 1, 2]),
          `--${boundary}--`,
        ],
        prepareMultipartIterator,
        input => multerator({ input, boundary })
      );

      yieldedPartInfo = (await source.next()).value;
    });

    it('has `type` = "file"', () => {
      expect(yieldedPartInfo.type).to.equal('file');
    });

    it('has `filename` as the original given file name', () => {
      expect(yieldedPartInfo.filename).to.equal('my_file');
    });

    it('has `data` as an async iterable of buffers that make up the correct file value', async () => {
      const wholeVal = await bufferAsyncIterOfBuffers(yieldedPartInfo.data);
      expect(wholeVal).to.deep.equal(Buffer.from([0, 1, 2, 0, 1, 2]));
    });
  });
});

const boundary = '--------------------------120789128139917295588288';
