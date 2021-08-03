export default lastElem;

function lastElem<T>(arr: T[]): T {
  return arr[arr.length - 1];
}
