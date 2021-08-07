module.exports = visualizeOccurrences;

async function* visualizeOccurrences(source, tag = '') {
  if (tag) {
    await stdoutWrite(`${tag}\n`);
  }

  for await (const item of source) {
    const charArr = item.buffer.toString('utf-8').split('');

    for (const { startIdx, endIdx } of arrayReverseIter(item.matches)) {
      if (endIdx !== -1) {
        charArr.splice(endIdx, 0, '}}}');
      }
      if (startIdx !== -1) {
        charArr.splice(startIdx, 0, '{{{');
      }
    }

    const strWithMarks = charArr.join('');

    await stdoutWrite(strWithMarks);

    yield item;
  }

  await stdoutWrite(`\n`);
}

function stdoutWrite(chunk, encoding) {
  return new Promise((resolve, reject) => {
    process.stdout.write(chunk, encoding, err => {
      err ? reject(err) : resolve();
    });
  });
}

function* arrayReverseIter(arr) {
  for (let i = arr.length - 1; i >= 0; --i) {
    yield arr[i];
  }
}
