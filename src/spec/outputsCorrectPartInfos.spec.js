const { expect } = require('chai');
const multerator = require('..').default;
const pipe = require('./utils/pipe');
const bufferAsyncIterOfBuffers = require('./utils/bufferAsyncIterOfBuffers');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe('Correct part info structures', () => {
  describe('For a field part yields correct info structure', () => {
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

    it('has `name` as the actual name of the field', () => {
      expect(yieldedPartInfo.name).to.equal('field_1');
    });

    it('has `filename` = undefined', () => {
      expect(yieldedPartInfo.filename).to.be.undefined;
    });

    it('has `contentType` = "text/plain"', () => {
      expect(yieldedPartInfo.contentType).to.equal('text/plain');
    });

    it('has `data` as correct value in string form', () => {
      expect(yieldedPartInfo.data).to.equal('text value of field_1');
    });

    it('has `encoding` = "7bit"', () => {
      expect(yieldedPartInfo.encoding).to.equal('7bit');
    });

    it("has `headers` as object of the exact original part's headers", () => {
      expect(yieldedPartInfo.headers).to.deep.equal({
        'Content-Disposition': 'form-data; name="field_1"',
        'Content-Type': 'text/plain',
      });
    });
  });

  describe('For a file part yields correct info structure', () => {
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

    it('has `name` as the actual name of the field', () => {
      expect(yieldedPartInfo.name).to.equal('field_1');
    });

    it("has `contentType` as the original given file's content type", () => {
      expect(yieldedPartInfo.contentType).to.equal('application/octet-stream');
    });

    it('has `filename` as the original given file name', () => {
      expect(yieldedPartInfo.filename).to.equal('my_file');
    });

    it('has `data` as an async iterable of buffers that make up the correct file value', async () => {
      const wholeVal = await bufferAsyncIterOfBuffers(yieldedPartInfo.data);
      expect(wholeVal).to.deep.equal(Buffer.from([0, 1, 2, 0, 1, 2]));
    });

    it('has `encoding` = "7bit"', () => {
      expect(yieldedPartInfo.encoding).to.equal('7bit');
    });

    it("has `headers` as object of the exact original part's headers", () => {
      expect(yieldedPartInfo.headers).to.deep.equal({
        'Content-Disposition': 'form-data; name="field_1"; filename="my_file";',
        'Content-Type': 'application/octet-stream',
      });
    });
  });
});

const boundary = '--------------------------120789128139917295588288';
