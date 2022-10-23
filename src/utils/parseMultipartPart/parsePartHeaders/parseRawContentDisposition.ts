import allocUnsafeSlowFromUtf8 from '../../allocUnsafeSlowFromUtf8.js';
import MulteratorError from '../../MulteratorError.js';
import splitBufferBySequence from '../../splitBufferBySequence.js';

export default parseRawContentDisposition;

function parseRawContentDisposition(inputBuffer: Buffer): {
  value: string;
  nameParamValue: string;
  filenameParamValue: string | undefined;
} {
  const bufSplitBySpaces = splitBufferBySequence(inputBuffer, semicolonCharBuf);

  const mainValue = bufSplitBySpaces[0].toString('ascii').trim();

  let nameParamValue;
  let filenameParamValue;

  for (let i = 1; i < bufSplitBySpaces.length; ++i) {
    const part = bufSplitBySpaces[i];
    const [paramKey, paramValue] = splitBufferBySequence(
      part,
      equalsQuoteCharsBuf
    );

    if (!paramValue) {
      continue;
    }

    const paramKeyStr = paramKey.toString('ascii').trim();

    switch (paramKeyStr) {
      case 'name': {
        const paramValueStr = paramValue.toString('utf-8').slice(0, -1);
        nameParamValue = paramValueStr;
        break;
      }
      case 'filename': {
        const paramValueStr = paramValue.toString('utf-8').slice(0, -1);
        filenameParamValue = paramValueStr;
        break;
      }
    }
  }

  // TODO: Is `name` param allowed to appear as an "empty string"?...
  if (nameParamValue === undefined) {
    throw new MulteratorError(
      'Encountered a part that is missing the required "name" parameter inside it\'s Content Disposition header',
      'ERR_MISSING_PART_NAME'
    );
  }

  return {
    value: mainValue,
    nameParamValue,
    filenameParamValue,
  };
}

const equalsQuoteCharsBuf = allocUnsafeSlowFromUtf8('="');
const semicolonCharBuf = allocUnsafeSlowFromUtf8(';');
