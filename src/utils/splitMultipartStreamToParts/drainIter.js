module.exports = drainIter;

async function drainIter(source) {
  for await (const _ of source) {
  }
}
