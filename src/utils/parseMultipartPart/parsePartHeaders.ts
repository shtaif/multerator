import concatBufferIterToString from '../../iter-utils/concatBufferIterToString';
import MulteratorError from '../MulteratorError';

export default parsePartHeaders;

async function parsePartHeaders(input: AsyncIterable<Buffer>): Promise<{
  name: string;
  contentType: string;
  encoding: string;
  filename: string | undefined;
}> {
  const headersContentString = await concatBufferIterToString(input);

  const headerMap: Record<string, string> = {};

  if (headersContentString) {
    headersContentString
      .trim()
      .split('\r\n')
      .forEach(line => {
        const idx = line.indexOf(':');
        const key = line.substring(0, idx).trim().toLowerCase();
        const value = line.substring(idx + 1).trim();
        headerMap[key] = value;
      });
  }

  const contentDispositionParts = headerMap['content-disposition']
    ? headerMap['content-disposition'].split(/; */)
    : [];

  const contentDispositionValue = contentDispositionParts[0];

  const contentDispositionEntries: Record<string, string> = {};

  for (let i = 1; i < contentDispositionParts.length; ++i) {
    const part = contentDispositionParts[i].trim();
    const idx = part.indexOf('=');
    const key = part.slice(0, idx);
    // TODO: Devise some check/validation/something to counter mistakes in which the quotes are missing or partially missing?
    const value = part.slice(idx + 2, -1); // The "+ 2" (instead of "+ 1") AND the "-1" are to account for the wrapping literal quotes at either side
    contentDispositionEntries[key] = value;
  }

  const contentType = headerMap['content-type'] || 'text/plain';
  const encoding = headerMap['content-transfer-encoding'] || '7bit';

  if (contentDispositionValue !== 'form-data') {
    throw new MulteratorError(
      'Encountered a part that is either missing the required Content Disposition header or the header\'s value is not "form-data"',
      'ERR_INVALID_OR_MISSING_CONTENT_DISPOSITION_HEADER'
    );
  }

  // TODO: Is `name` param allowed to appear as an "empty string"?...
  if (contentDispositionEntries.name === undefined) {
    throw new MulteratorError(
      'Encountered a part that is missing the "name" parameter inside it\'s Content Disposition header',
      'ERR_MISSING_PART_NAME'
    );
  }

  return {
    name: contentDispositionEntries.name,
    contentType,
    filename: contentDispositionEntries.filename,
    encoding,
  };
}
