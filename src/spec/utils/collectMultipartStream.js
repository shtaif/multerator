module.exports = collectMultipartStream;

async function collectMultipartStream(source) {
  const results = [];

  for await (const item of source) {
    const { data, ...result } = item;

    // TODO: If by some unexpected mistake the source's `data` was an originally an array actually?... problem...
    const normalizedData = data[Symbol.asyncIterator]
      ? await (async () => {
          const chunks = [];
          for await (const chunk of data) {
            chunks.push(chunk);
          }
          return Buffer.concat(chunks);
        })()
      : data;

    result.data = normalizedData;

    results.push(result);
  }

  return results;
}
