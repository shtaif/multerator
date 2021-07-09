module.exports = iterFrom;

function* iterFrom() {
  yield* arguments;
}
