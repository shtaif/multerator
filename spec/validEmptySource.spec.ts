import { expect } from 'chai';
import { multerator } from '../src/index.js';
import pipe from './utils/pipe.js';
import collectMultipartStream from './utils/collectMultipartStream';
import prepareMultipartIterator from './utils/prepareMultipartIterator';

it('Returns empty async iterator when given multipart source with zero parts (empty)', async () => {
  const results = await pipe(
    ['', `--${boundary}--`, ''],
    prepareMultipartIterator,
    input => multerator({ input, boundary }),
    collectMultipartStream
  );

  expect(results).deep.equal([]);
});

const boundary = '--------------------------120789128139917295588288';
