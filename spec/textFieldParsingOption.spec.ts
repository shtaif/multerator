import { expect } from 'chai';
import { multerator } from '../src';
import pipe from './utils/pipe';
import collectMultipartStream from './utils/collectMultipartStream';
import prepareMultipartIterator from './utils/prepareMultipartIterator';

describe('Text field body parsing option', () => {
  it('Conveys bodies of yielded text parts as readable streams if text field parsing is disabled', async () => {
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
        `--${boundary}--`,
      ]),
      stream =>
        multerator({
          input: stream,
          boundary,
          parseTextFields: false,
        }),
      collectMultipartStream
    );

    expect(results).to.containSubset([
      {
        name: 'field1',
        type: 'text',
        filename: undefined,
        contentType: 'text/plain',
        encoding: '7bit',
        data: Buffer.from('text value of field1'),
      },
      {
        name: 'field2',
        type: 'text',
        filename: undefined,
        contentType: 'text/plain',
        encoding: '7bit',
        data: Buffer.from('text value of field2'),
      },
    ]);
  });

  it('Conveys bodies of yielded text parts as entire collected strings if text field parsing is enabled', async () => {
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
        `--${boundary}--`,
      ]),
      stream =>
        multerator({
          input: stream,
          boundary,
          parseTextFields: true,
        }),
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
    ]);
  });
});

const boundary = '--------------------------120789128139917295588288';
