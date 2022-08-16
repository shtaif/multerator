import asyncIterOfBuffersSizeLimiter from '../../../iter-utils/asyncIterOfBuffersSizeLimiter';
import concatAsyncIterOfBuffers from '../../../iter-utils/concatAsyncIterOfBuffers';
import allocUnsafeSlowFromUtf8 from '../../allocUnsafeSlowFromUtf8';
import MulteratorError from '../../MulteratorError';
import pipe from '../../pipe';
import splitBufferBySequence from '../../splitBufferBySequence';
import splitBufferBySequenceOnce from '../../splitBufferBySequenceOnce';
import parseRawContentDisposition from './parseRawContentDisposition';

export default parsePartHeaders;

async function parsePartHeaders(input: AsyncIterable<Buffer>): Promise<{
  name: string;
  contentType: string;
  encoding: string;
  filename: string | undefined;
}> {
  const combinedChunk = await pipe(
    input,
    asyncIterOfBuffersSizeLimiter(
      headerSectionMaxTotalSize,
      () =>
        new MulteratorError(
          `A header section has crossed the internal max size limit of ${headerSectionMaxTotalSize} bytes`,
          'ERR_HEADERS_SECTION_TOO_BIG'
        )
    ),
    concatAsyncIterOfBuffers // Collecting the whole header section in memory first because experiments have shown that when dealing with the "typical" size header section expected 99% of the time - buffering the whole headers section and then spliting/parsing upon it is MORE performant then splitting it into sub iterables with the existing utilities and continuing from there...
  );

  const headerChunks = splitBufferBySequence(combinedChunk, CRLF);

  let contentDispositionInfo;
  let contentType = 'text/plain'; // TODO: Make a test with part that lacks a content-type header for verifying this fallback
  let contentTransferEncoding = '7bit';

  for (const headerChunk of headerChunks) {
    const [beforeColon, afterColon] = splitBufferBySequenceOnce(
      headerChunk,
      colonCharBuffer
    );

    if (!afterColon) {
      // TODO: Make a test that includes a header line that's missing the ":"?
      // TODO: Instead of continuing should probably error out in this case with a particular error code?...
      continue;
    }

    const headerKey = beforeColon.toString('ascii').trim().toLowerCase();

    switch (headerKey) {
      case 'content-disposition': {
        contentDispositionInfo = parseRawContentDisposition(afterColon);
        break;
      }
      case 'content-type': {
        contentType = afterColon.toString('ascii').trim();
        break;
      }
      case 'content-transfer-encoding': {
        contentTransferEncoding = afterColon.toString('ascii').trim();
        break;
      }
    }
  }

  if (contentDispositionInfo?.value !== 'form-data') {
    throw new MulteratorError(
      'Encountered a part that is either missing the required Content Disposition header or the header\'s value is not "form-data"',
      'ERR_INVALID_OR_MISSING_CONTENT_DISPOSITION_HEADER'
    );
  }

  return {
    name: contentDispositionInfo.nameParamValue,
    filename: contentDispositionInfo.filenameParamValue,
    contentType,
    encoding: contentTransferEncoding,
  };
}

const CRLF = allocUnsafeSlowFromUtf8('\r\n');
const colonCharBuffer = allocUnsafeSlowFromUtf8(':');

const headerSectionMaxTotalSize = 1024;
