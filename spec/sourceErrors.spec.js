const { expect } = require('chai');
const multerator = require('../src');
const pipe = require('./utils/pipe');
const collectMultipartStream = require('./utils/collectMultipartStream');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

describe('Errors from source stream', () => {
  it('Conveys the error from source stream as-is that was being thrown immediately at start of consumption', async () => {
    const resultsPromise = pipe(
      (async function* () {
        throw plantedSourceError;
      })(),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );
    await expect(resultsPromise).to.eventually.be.rejected.and.deep.equal(
      plantedSourceError
    );
  });

  it('Conveys the error from source stream as-is that was being thrown right after the value of some part', async () => {
    const resultsPromise = pipe(
      (async function* () {
        yield* prepareMultipartIterator(
          `--${boundary}`,
          'Content-Disposition: form-data; name="field1"',
          '',
          'Text of field 1'
        );
        throw plantedSourceError;
      })(),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );
    await expect(resultsPromise).to.eventually.be.rejected.and.deep.equal(
      plantedSourceError
    );
  });

  it('Conveys the error from source stream as-is that was being thrown in the middle of a boundary occurrence', async () => {
    const halfInterBoundary = `--${boundary.slice(
      0,
      Math.round(boundary.length / 2)
    )}`;

    const resultsPromise = pipe(
      (async function* () {
        yield* prepareMultipartIterator(
          `--${boundary}`,
          'Content-Disposition: form-data; name="field1"',
          '',
          'Text of field 1',
          halfInterBoundary
        );
        throw plantedSourceError;
      })(),
      stream => multerator({ input: stream, boundary }),
      collectMultipartStream
    );
    await expect(resultsPromise).to.eventually.be.rejected.and.deep.equal(
      plantedSourceError
    );
  });
});

// TODO: Check if worth relying on the Error's "cause" property somehow?
const plantedSourceError = Object.assign(new Error('Oh no!...'), {
  info: 'My info',
  nestedInfo: { info: 'My nested info' },
});

const boundary = '--------------------------120789128139917295588288';
