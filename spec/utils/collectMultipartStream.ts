export default collectMultipartStream;

async function collectMultipartStream<T extends Record<string, unknown>>(
  source: AsyncGenerator<T & { data: AsyncIterable<Buffer> | string }>
): Promise<(T & { data: Buffer | string })[]> {
  const results: (T & { data: Buffer | string })[] = [];

  for await (const item of source) {
    // TODO: If by some unexpected mistake the source's `data` was an originally an array actually?... problem...
    const normalizedData =
      typeof item.data === 'string'
        ? item.data
        : await (async () => {
            const chunks: Buffer[] = [];
            const itemDataIter = item.data as Exclude<typeof item.data, string>;
            for await (const chunk of itemDataIter) {
              chunks.push(chunk);
            }
            return Buffer.concat(chunks);
          })();

    results.push({
      ...item,
      data: normalizedData,
    });
  }

  return results;
}
