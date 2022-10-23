import { expect } from 'chai';
import { multerator } from '../src/index.js';
import pipe from './utils/pipe.js';
import prepareMultipartIterator from './utils/prepareMultipartIterator.js';

describe('Content Disposition header errors', () => {
  it('Part with missing Content Disposition header throws an error of type "ERR_INVALID_OR_MISSING_CONTENT_DISPOSITION_HEADER"', async () => {
    const source = pipe(
      [
        `--${boundary}`,
        'Content-Type: text/plain',
        '',
        'text value of field_1',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary })
    );

    const partInfoPromise = source.next();

    await expect(partInfoPromise).to.eventually.be.rejected.and.containSubset({
      code: 'ERR_INVALID_OR_MISSING_CONTENT_DISPOSITION_HEADER',
    });
  });

  it('Part with Content Disposition header with value other then "form-data" throws an error of type "ERR_INVALID_OR_MISSING_CONTENT_DISPOSITION_HEADER"', async () => {
    const source = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: super-form-data; name="field_1"',
        'Content-Type: text/plain',
        '',
        'text value of field_1',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary })
    );

    const partInfoPromise = source.next();

    await expect(partInfoPromise).to.eventually.be.rejected.and.containSubset({
      code: 'ERR_INVALID_OR_MISSING_CONTENT_DISPOSITION_HEADER',
    });
  });

  it('Part with a Content Disposition header that has no "name" param throws an error of type "ERR_MISSING_PART_NAME"', async () => {
    const source = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data',
        'Content-Type: text/plain',
        '',
        'text value of field_1',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input => multerator({ input, boundary })
    );

    const partInfoPromise = source.next();

    await expect(partInfoPromise).to.eventually.be.rejected.and.containSubset({
      code: 'ERR_MISSING_PART_NAME',
    });
  });
});

const boundary = '--------------------------120789128139917295588288';
