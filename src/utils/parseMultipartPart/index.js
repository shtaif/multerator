const pipe = require('../pipe');
const {
  splitAsyncIterByFirstSequence,
} = require('../../iter-utils/splitAsyncIterBySequence');
const asyncIterOfBuffersSizeLimiter = require('../../iter-utils/asyncIterOfBuffersSizeLimiter');
const concatBufferIterToString = require('../../iter-utils/concatBufferIterToString');
const allocUnsafeSlowFromUtf8 = require('../allocUnsafeSlowFromUtf8');
const parsePartHeaders = require('./parsePartHeaders');
const MultiParserError = require('../MultiParserError');

module.exports = parseMultipartPart;

async function parseMultipartPart({
  partStream,
  maxFileSize,
  maxFieldSize,
} = {}) {
  const headersAndBodyItersSplit = splitAsyncIterByFirstSequence(
    partStream,
    headersEndTokenBuf
  );

  const headersIter = (await headersAndBodyItersSplit.next()).value;

  const partInfo = await parsePartHeaders(headersIter); // TODO: Handle having the required "Content-Disposition" header not present?...

  const { done, value: bodyIter } = await headersAndBodyItersSplit.next();

  if (done) {
    throw new MultiParserError(
      'Invalid part structure; missing headers-body delimiter token "\r\n\r\n"',
      'ERR_MISSING_PART_HEADERS_BODY_DELIMITER'
    );
  }

  const type = partInfo.filename ? 'file' : 'text';

  const partBodyContent = await pipe(
    bodyIter,
    asyncIterOfBuffersSizeLimiter(type === 'text' ? maxFieldSize : maxFileSize),
    async function* (source) {
      try {
        yield* source;
      } catch (err) {
        if (err.code === 'ERR_REACHED_SIZE_LIMIT') {
          err.info.partInfo = {
            name: partInfo.name,
            contentType: partInfo.contentType,
            filename: partInfo.filename,
          };
        }
        throw err;
      }
    },
    type === 'text' ? concatBufferIterToString : iter => iter
  );

  return {
    type,
    ...partInfo,
    data: partBodyContent,
  };
}

const headersEndTokenBuf = allocUnsafeSlowFromUtf8('\r\n\r\n');
