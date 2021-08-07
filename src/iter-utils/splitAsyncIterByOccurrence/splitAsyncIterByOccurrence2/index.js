const pipe = require('../../../utils/pipe');
const asyncIterWindowBetweenOccurrenceOf =
  require('../../asyncIterWindowBetweenOccurrenceOf').default;
const looseAsyncIterWrapper = require('../../looseAsyncIterWrapper');
const searchOccurrencesInStream = require('../searchOccurrencesInStream');
const visualizeOccurrences = require('../../visualizeOccurrences');

module.exports = splitAsyncIterByOccurrence2;

function splitAsyncIterByOccurrence2(source, sequence) {
  const sequenceBuf =
    sequence.constructor === Buffer ? sequence : Buffer.from(sequence);

  source = looseAsyncIterWrapper(source);

  let bufferToRestoreFrom;
  let posInBufferToRestoreFrom = 0;

  const result = pipe(
    source,
    source => searchOccurrencesInStream(source, sequenceBuf),
    // source => visualizeOccurrences(source, 'TEST AFTER'),
    async function* (source) {
      for await (const { buffer, matches } of source) {
        bufferToRestoreFrom = buffer;
        // posInBufferToRestoreFrom = 0;

        if (!matches.length) {
          yield buffer;
          continue;
        }

        if (matches[0].startIdx === -1 && matches[0].endIdx === -1) {
          continue;
        }

        if (matches[0].startIdx !== -1) {
          if (matches[0].startIdx !== 0) {
            posInBufferToRestoreFrom = matches[0].startIdx;
            const chunkBeforeFirstMatch = buffer.subarray(
              0,
              matches[0].startIdx
            );
            yield chunkBeforeFirstMatch;
          }

          yield splitMarker;
        }

        for (let i = 1; i < matches.length; ++i) {
          const prevMatchEnd = matches[i - 1].endIdx;
          const currMatchStart = matches[i].startIdx;
          posInBufferToRestoreFrom = currMatchStart;
          const chunkBetweenMatches = buffer.subarray(
            prevMatchEnd,
            currMatchStart
          );
          yield chunkBetweenMatches;
          yield splitMarker;
        }

        const lastMatch = matches[matches.length - 1];

        if (lastMatch.endIdx !== -1 && lastMatch.endIdx < buffer.length) {
          // bufferToRestoreFrom = undefined;
          // posInBufferToRestoreFrom = currMatchStart;
          posInBufferToRestoreFrom = 0;
          const chunkAfterLastMatch = buffer.subarray(lastMatch.endIdx);
          yield chunkAfterLastMatch;
        }
      }

      // console.log('!@#!@#!@@#');
    },
    // async function* (source) {
    //   let test = '';

    //   for await (const item of source) {
    //     test +=
    //       item === splitMarker
    //         ? '*'.repeat(sequenceBuf.length)
    //         : item.toString('utf-8');

    //     yield item;
    //   }

    //   console.log('TEST ***\n', test);
    // },
    asyncIterWindowBetweenOccurrenceOf(splitMarker)
  );

  // TODO: Try to complete this approach to have the `rest` here valid to move over to at any given point, and consider whether is simpler in design and performance...
  result.rest = (async function* () {
    if (posInBufferToRestoreFrom > 0) {
      yield bufferToRestoreFrom.subarray(posInBufferToRestoreFrom);
    }
    yield* source;
    // for await (const chunk of source) {
    //   yield chunk;
    // }
  })();

  return result;
}

const splitMarker = {};
