const { expect } = require('chai');
const multiparser = require('..');
const pipe = require('./utils/pipe');
const collectMultipartStream = require('./utils/collectMultipartStream');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

it('Returns empty async iterator when given multipart source with zero parts (empty)', async () => {
  const results = await pipe(
    ['', `--${boundary}--`, ''],
    prepareMultipartIterator,
    input => multiparser({ input, boundary }),
    collectMultipartStream
  );

  expect(results).deep.equal([]);
});

const boundary = '--------------------------120789128139917295588288';
