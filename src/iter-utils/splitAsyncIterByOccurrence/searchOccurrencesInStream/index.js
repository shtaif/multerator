const pipe = require('../../../utils/pipe');
const lastElem = require('../../../utils/lastElem').default;
const bufferUntil = require('../../bufferUntil');
// const visualizeOccurrences = require('../visualizeOccurrences');
const combineBuffersWithMatchesForSequence = require('../combineBuffersWithMatchesForSequence');

module.exports = searchOccurrencesInStream;

function searchOccurrencesInStream(source, sequenceBuf) {
  return pipe(
    source,
    combineBuffersWithMatchesForSequence(sequenceBuf),
    // source => visualizeOccurrences(source, '<<<<<<TEST BEFORE>>>>>>'),
    async function* (src) {
      const sourceIter = src[Symbol.asyncIterator]();
      let itemToRefeed;

      try {
        for (;;) {
          let done = false;
          let item;

          if (itemToRefeed) {
            item = itemToRefeed;
            itemToRefeed = undefined;
          } else {
            ({ done, value: item } = await sourceIter.next());
            if (done) {
              break;
            }
          }

          if (
            !item.matches.length ||
            item.matches[item.matches.length - 1].endIdx !== -1 // TODO: Can change this into `item.matches[0].endIdx !== -1`?...
          ) {
            yield item;
          } else {
            const itemsOfMatchSuccession = await bufferMatchSuccession(
              sourceIter
            );

            const lastContItemFirstMatch = itemsOfMatchSuccession.length
              ? lastElem(itemsOfMatchSuccession).matches[0]
              : undefined;

            if (
              !lastContItemFirstMatch ||
              lastContItemFirstMatch.startIdx !== -1 ||
              lastContItemFirstMatch.endIdx === -1 // <-- Means whether match actually is a "-1 and -1" - which this reaching up to here would mean that the whole source iter was suddenly finished in the midst of this very succession, rendering it an incomplete false succession
            ) {
              item.matches.pop();
              for (
                let i = 0, len = itemsOfMatchSuccession.length - 1;
                i < len;
                ++i
              ) {
                itemsOfMatchSuccession[i].matches.pop();
              }
            }

            yield item;

            if (itemsOfMatchSuccession.length) {
              if (
                itemsOfMatchSuccession[itemsOfMatchSuccession.length - 1]
                  .matches.length
              ) {
                itemToRefeed = itemsOfMatchSuccession.pop();
              }
              yield* itemsOfMatchSuccession;
            }
          }
        }
      } finally {
        // sourceIter.return();
      }
    }
    // source => visualizeOccurrences(source, '<<<<<<TEST AFTER>>>>>>')
  );
}

async function bufferMatchSuccession(sourceIter) {
  const { buffered: itemsOfMatchSuccession } = await bufferUntil(
    sourceIter,
    ({ matches }) =>
      !matches.length ||
      !(matches[0].startIdx === -1 && matches[0].endIdx === -1),
    { includeLast: true }
  );
  return itemsOfMatchSuccession;
}
