const fs = require('fs');
const { promisify } = require('util');
const { expect } = require('chai');
const multerator = require('../src');
const pipe = require('./utils/pipe');
const collectMultipartStream = require('./utils/collectMultipartStream');
const prepareMultipartIterator = require('./utils/prepareMultipartIterator');

// TODO: Check if text fields can and should support a user-specified content type other then "text/plain" (for e.g text fields that contain JSON)
// TODO: Max size validations - check if can take advantage of the presence of a Content-Length subheader to reject the sub-part to begin with, saving the need to consume and count it
// TODO: Implement max size limits for part headers as well?...
// TODO: Clear exception to throw when main input is NOT an async iterator?...

it('General test (TODO: refactor?)', async () => {
  const mockFilesPaths = [
    `${__dirname}/mockFiles/openapi-petstore.json`,
    `${__dirname}/mockFiles/image.jpg`,
    `${__dirname}/mockFiles/github.com.pem`,
  ];

  const mockFiles = await Promise.all(
    mockFilesPaths.map(path => readFile(path))
  );

  const results = await pipe(
    prepareMultipartIterator([
      `--${boundary}`,
      'Content-Disposition: form-data; name="field1"',
      'Content-Type: text/plain',
      '',
      'text value of field1',
      `--${boundary}`,
      'Content-Disposition: form-data; name="field2"',
      'Content-Type: text/plain',
      '',
      'text value of field2',
      `--${boundary}`,
      'Content-Disposition: form-data; name="field3"; filename="openapi-petstore.json";',
      'Content-Type: application/json',
      '',
      mockFiles[0],
      `--${boundary}`,
      'Content-Disposition: form-data; name="field4"; filename="image.jpg";',
      'Content-Type: image/jpeg',
      '',
      mockFiles[1],
      `--${boundary}--`,
    ]),
    stream => multerator({ input: stream, boundary }),
    collectMultipartStream
  );

  expect(results).to.containSubset([
    {
      name: 'field1',
      type: 'text',
      filename: undefined,
      contentType: 'text/plain',
      encoding: '7bit',
      data: 'text value of field1',
    },
    {
      name: 'field2',
      type: 'text',
      filename: undefined,
      contentType: 'text/plain',
      encoding: '7bit',
      data: 'text value of field2',
    },
    {
      name: 'field3',
      type: 'file',
      filename: 'openapi-petstore.json',
      contentType: 'application/json',
      encoding: '7bit',
      data: mockFiles[0],
    },
    {
      name: 'field4',
      type: 'file',
      filename: 'image.jpg',
      contentType: 'image/jpeg',
      encoding: '7bit',
      data: mockFiles[1],
    },
  ]);
});

describe('Variable chunk size mass generated tests (TODO: refactor?)', () => {
  for (let i = 1; i <= 500; ++i) {
    if (i !== 65) {
      continue;
    }

    const chunkSize = i;

    it(`${chunkSize} bytes chunk size`, async () => {
      const parsedIter = pipe(
        [
          `--${boundary}`,
          'Content-Disposition: form-data; name="stream1"; filename="file.txt"',
          'Content-Type: text/plain',
          `Content-Length: ${Buffer.from('data1').length}`,
          '',
          'data1',
          `--${boundary}`,
          'Content-Disposition: form-data; name="stream2"; filename="file.txt"',
          'Content-Type: text/plain',
          '',
          'data2',
          `--${boundary}`,
          'Content-Disposition: form-data; name="stream3"; filename="file.txt";',
          'Content-Type: text/plain',
          '',
          'data3',
          `--${boundary}--`,
        ],
        input => prepareMultipartIterator(input, chunkSize),
        input => multerator({ input, boundary })
      );

      const results = await collectMultipartStream(parsedIter);

      expect(results).to.containSubset([
        {
          name: 'stream1',
          type: 'file',
          filename: 'file.txt',
          contentType: 'text/plain',
          encoding: '7bit',
          data: Buffer.from('data1'),
        },
        {
          name: 'stream2',
          type: 'file',
          filename: 'file.txt',
          contentType: 'text/plain',
          encoding: '7bit',
          data: Buffer.from('data2'),
        },
        {
          name: 'stream3',
          type: 'file',
          filename: 'file.txt',
          contentType: 'text/plain',
          encoding: '7bit',
          data: Buffer.from('data3'),
        },
      ]);
    });
  }
});

const boundary = '--------------------------120789128139917295588288';

const readFile = promisify(fs.readFile);
