module.exports = findPartialMatchFromStart;

function findPartialMatchFromStart(haystack, needle) {
  const matchIdx = needle.indexOf(haystack[0]);
  if (matchIdx !== -1) {
    // const partOfNeedle = needle.subarray(matchIdx);
    const partOfNeedle = needle.subarray(matchIdx, haystack.length);
    // TODO: Optimize by starting from "1" below instead of "0"?..
    if (haystack.subarray(0, partOfNeedle.length).equals(partOfNeedle)) {
      return partOfNeedle.length;
    }
  }
  return 0;
}
