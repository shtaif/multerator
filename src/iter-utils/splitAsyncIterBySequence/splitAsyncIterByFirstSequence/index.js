const pipe = require('../../../utils/pipe');
const lastElem = require('../../../utils/lastElem');
const bufferUntil = require('../../bufferUntil');
const asyncIterWindowBetweenOccuranceOf = require('../../asyncIterWindowBetweenOccuranceOf');
const combineBuffersWithMatchesForSequence = require('../combineBuffersWithMatchesForSequence');

module.exports = splitAsyncIterByFirstSequence;

function splitAsyncIterByFirstSequence(originalSource, sequenceBuf) {
  return pipe(
    originalSource,
    combineBuffersWithMatchesForSequence(sequenceBuf),
    async function* (source) {
      // TODO: Should avoid yielding empty buffers by surrounding each line with a `.subarray` call with an index check?

      const sourceIter = source[Symbol.asyncIterator]();

      for (let item, itemToRefeed, done = false; ; ) {
        if (itemToRefeed) {
          item = itemToRefeed;
          itemToRefeed = undefined;
        } else {
          ({ done, value: item } = await sourceIter.next());
          if (done) {
            break;
          }
        }

        if (!item.matches.length) {
          yield item.buffer;
        } else if (item.matches[0].endIdx !== -1) {
          const { startIdx, endIdx } = item.matches[0];
          const bufferBeforeMatchStart = item.buffer.subarray(0, startIdx);
          const bufferAfterMatchEnd = item.buffer.subarray(endIdx);
          yield bufferBeforeMatchStart;
          yield splitMarker;
          yield bufferAfterMatchEnd;
          break;
        } else {
          const matchSuccessionItems = [
            item,
            ...(await bufferMatchSuccession(sourceIter)),
          ];

          const successionLast = lastElem(matchSuccessionItems);

          if (
            !successionLast.matches[0] ||
            successionLast.matches[0].startIdx !== -1 ||
            successionLast.matches[0].endIdx === -1 // <- Checks whether the whole source was finished in the midst of the match succession
          ) {
            if (matchSuccessionItems.length > 1) {
              itemToRefeed = matchSuccessionItems.pop();
            }
            for (let i = 0; i < matchSuccessionItems.length; ++i) {
              yield matchSuccessionItems[i].buffer;
            }
          } else {
            const bufferBeforeMatchStart =
              matchSuccessionItems[0].buffer.subarray(
                0,
                matchSuccessionItems[0].matches[0].startIdx
              );
            const bufferAfterMatchEnd = successionLast.buffer.subarray(
              successionLast.matches[0].endIdx
            );
            yield bufferBeforeMatchStart;
            yield splitMarker;
            yield bufferAfterMatchEnd;
            break;
          }
        }
      }

      yield* originalSource;
    },
    asyncIterWindowBetweenOccuranceOf(splitMarker)
  );
}

async function bufferMatchSuccession(sourceIter) {
  const result = await bufferUntil(
    sourceIter,
    ({ matches }) =>
      !matches.length ||
      !(matches[0].startIdx === -1 && matches[0].endIdx === -1),
    { includeLast: true }
  );
  const { buffered: itemsOfMatchSuccession /*, done*/ } = result;
  return itemsOfMatchSuccession;
}

const splitMarker = {};
