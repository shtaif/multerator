import { expect } from 'chai';
import { multerator } from '../src';
import pipe from './utils/pipe';
import prepareMultipartIterator from './utils/prepareMultipartIterator';

describe('Size limits', () => {
  it('Throws size limit error when text field crosses specified text field size limit', async () => {
    const gen = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_1"',
        'Content-Type: text/plain',
        '',
        'a'.repeat(10),
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_2"',
        'Content-Type: text/plain',
        '',
        'a'.repeat(11),
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input =>
        multerator({
          input,
          boundary,
          maxFieldSize: 10,
        })
    );

    const firstPart = await gen.next();
    for await (const _ of firstPart.value.data);

    const secondPartPromise = gen.next();

    await expect(secondPartPromise).to.eventually.be.rejected.and.containSubset(
      {
        code: 'ERR_BODY_REACHED_SIZE_LIMIT',
        info: {
          sizeLimitBytes: 10,
          partInfo: {
            name: 'field_2',
            contentType: 'text/plain',
            filename: undefined,
          },
        },
      }
    );
  });

  it('Throws size limit error when file field crosses specified file field size limit', async () => {
    const gen = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_1"; filename="my_file_1.json"',
        'Content-Type: application/octet-stream',
        '',
        'a'.repeat(10),
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_2"; filename="my_file_2.json"',
        'Content-Type: application/octet-stream',
        '',
        'a'.repeat(11),
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input =>
        multerator({
          input,
          boundary,
          maxFileSize: 10,
        })
    );

    const firstPart = await gen.next();
    for await (const _ of firstPart.value.data);

    const secondPartPromise = (async () => {
      const thirdPart = await gen.next();
      for await (const _ of thirdPart.value.data);
    })();

    await expect(secondPartPromise).to.eventually.be.rejected.and.containSubset(
      {
        code: 'ERR_BODY_REACHED_SIZE_LIMIT',
        info: {
          sizeLimitBytes: 10,
          partInfo: {
            name: 'field_2',
            contentType: 'application/octet-stream',
            filename: 'my_file_2.json',
          },
        },
      }
    );
  });

  it("Throws size limit error when a part's header section's length crosses limit of 1024 bytes", async () => {
    const exaggeratedHeaders = [
      'Content-Disposition: form-data; name="field_2"; filename="my_file_2.json"',
      'Content-Type: application/octet-stream',
      'X-My-Custom-Header-1: my_custom_header_1_value',
      'X-My-Custom-Header-2: my_custom_header_2_value',
      'X-My-Custom-Header-3: my_custom_header_3_value',
      'X-My-Custom-Header-4: my_custom_header_4_value',
      'X-My-Custom-Header-5: my_custom_header_5_value',
      'X-My-Custom-Header-6: my_custom_header_6_value',
      'X-My-Custom-Header-7: my_custom_header_7_value',
      'X-My-Custom-Header-8: my_custom_header_8_value',
      'X-My-Custom-Header-9: my_custom_header_9_value',
      'X-My-Custom-Header-0: my_custom_header_0_value',
      'X-My-Custom-Header-1: my_custom_header_1_value',
      'X-My-Custom-Header-2: my_custom_header_2_value',
      'X-My-Custom-Header-3: my_custom_header_3_value',
      'X-My-Custom-Header-4: my_custom_header_4_value',
      'X-My-Custom-Header-5: my_custom_header_5_value',
      'X-My-Custom-Header-6: my_custom_header_6_value',
      'X-My-Custom-Header-7: my_custom_header_7_value',
      'X-My-Custom-Header-8: my_custom_header_8_value',
      'X-My-Custom-Header-9: my_custom_header_9_value',
    ].join('\r\n'); // This whole header section is exactly 1025 bytes long - 1 longer than the allowed max

    const gen = pipe(
      [
        `--${boundary}`,
        'Content-Disposition: form-data; name="field_1"; filename="my_file_1.json"',
        'Content-Type: application/octet-stream',
        '',
        'My part body data...',
        `--${boundary}`,
        exaggeratedHeaders,
        '',
        'My part body data...',
        `--${boundary}--`,
      ],
      prepareMultipartIterator,
      input =>
        multerator({
          input,
          boundary,
        })
    );

    // Following consumption of the first part having reasonable headers should complete fine...
    const firstPart = await gen.next();
    for await (const _ of firstPart.value.data);

    const secondPartPromise = gen.next(); // (By the time this gets fulfilled, headers should have already been attempted to be parsed)

    await expect(secondPartPromise).to.eventually.be.rejected.and.containSubset(
      {
        code: 'ERR_HEADERS_SECTION_TOO_BIG',
      }
    );
  });
});

const boundary = '--------------------------120789128139917295588288';
