import concatBufferIterToString from '../../iter-utils/concatBufferIterToString';

export default parsePartHeaders;

async function parsePartHeaders(input: AsyncIterable<Buffer>): Promise<{
  name: string;
  contentType: string;
  encoding: string;
  filename: string | undefined;
}> {
  const headersContentString = await concatBufferIterToString(input);

  const headerObj: Record<string, string | undefined> = {};

  if (headersContentString) {
    headersContentString.split('\r\n').forEach(line => {
      const idx = line.indexOf(':');
      let key = line.substring(0, idx).trim();
      let value = line.substring(idx + 1).trim();
      headerObj[key] = value;
    });
  }

  const contentDispositionParamParts = headerObj['Content-Disposition']
    ? headerObj['Content-Disposition'].split(/; */)
    : [];

  const contentDispositionParams: Record<string, string | undefined> = {};

  for (let i = 1; i < contentDispositionParamParts.length; ++i) {
    const part = contentDispositionParamParts[i].trim();
    const idx = part.indexOf('=');
    const key = part.slice(0, idx);
    // TODO: Devise some check/validation/something to counter mistakes in which the quotes are missing or partially missing?
    const value = part.slice(idx + 2, -1); // The "+ 2" (instead of "+ 1") AND the "-1" are to account for the wrapping literal quotes at either side
    contentDispositionParams[key] = value;
  }

  const contentType = headerObj['Content-Type'] || 'text/plain';
  const { name = '', filename } = contentDispositionParams; // TODO: OK to default `name` to ""? Or should this be an invalidity that should be rejected and errored? Check in the specs...
  const encoding = headerObj['Content-Transfer-Encoding'] || '7bit';

  return {
    name,
    contentType,
    filename,
    encoding,
  };
}