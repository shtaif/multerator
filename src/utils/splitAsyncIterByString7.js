const pipe = require('../pipe');
const checkIfAsyncIterEmpty = require('../iter-utils/checkIfAsyncIterEmpty');
const readAsyncIterUntilSequence = require('./readAsyncIterUntilSequence');

module.exports = splitAsyncIterByString7;

function splitAsyncIterByString7(delimiter) {
  return async function* (source) {
    let rest = source;
    let untilNextOccurance;
    for (;;) {
      rest = await checkIfAsyncIterEmpty(rest);
      if (!rest) {
        break;
      }
      [untilNextOccurance, rest] = readAsyncIterUntilSequence(rest, delimiter);
      yield untilNextOccurance;
    }
  };
}

// function splitAsyncIterByString8(delimiter) {
//   return async function* recurse(source) {
//     [untilNextOccurance, rest] = readAsyncIterUntilSequence(source, delimiter);
//     yield untilNextOccurance;
//     const reminder = await checkIfAsyncIterEmpty(rest);
//     if (reminder) {
//       yield* recurse(reminder);
//     }
//   };
// }
