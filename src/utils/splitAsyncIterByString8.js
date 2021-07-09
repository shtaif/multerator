const pipe = require('../pipe');
const checkIfAsyncIterEmpty = require('../iter-utils/checkIfAsyncIterEmpty');
const readAsyncIterUntilSequence = require('./readAsyncIterUntilSequence2');

module.exports = splitAsyncIterByString8;

function splitAsyncIterByString8(delimiter) {
  return async function* (source) {
    let rest = source;
    let untilNextOccurance;
    while ((rest = await checkIfAsyncIterEmpty(rest))) {
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
