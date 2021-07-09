module.exports = asyncIterToArray;

async function asyncIterToArray(source) {
  const items = [];
  for await (const item of source) {
    items.push(item);
  }
  return items;
}
