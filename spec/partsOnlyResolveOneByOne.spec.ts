import { expect } from 'chai';
import multerator from '../src';
import pipe from './utils/pipe';
import prepareMultipartIterator from './utils/prepareMultipartIterator';

it("Each yielded part can resolve only after previous's body was finished", async () => {
  const source = pipe(
    [
      `--${boundary}`,
      'Content-Disposition: form-data; name="field_1"; filename="my_file_1.json"',
      'Content-Type: application/octet-stream',
      '',
      'a'.repeat(200),
      `--${boundary}`,
      'Content-Disposition: form-data; name="field_2"; filename="my_file_2.json"',
      'Content-Type: application/octet-stream',
      '',
      'a'.repeat(200),
      `--${boundary}`,
      'Content-Disposition: form-data; name="field_3"; filename="my_file_3.json"',
      'Content-Type: application/octet-stream',
      '',
      'a'.repeat(200),
      `--${boundary}--`,
    ],
    prepareMultipartIterator,
    input => multerator({ input, boundary })
  );

  // We're attempting to pull all the 3 multipart parts at the same time:
  const firstPartPromise = source.next();
  const secondPartPromise = source.next();
  const thirdPartPromise = source.next();

  const firstPartBodyFinishedPromise = (async () => {
    const part = await firstPartPromise;
    for await (const _ of part.value.data);
  })();

  const secondPartBodyFinishedPromise = (async () => {
    const spart = await secondPartPromise;
    for await (const _ of spart.value.data);
  })();

  const thirdPartBodyFinishedPromise = (async () => {
    const part = await thirdPartPromise;
    for await (const _ of part.value.data);
  })();

  // We'll compare resolution order based on some textual representations instead of by the original promises' object references, because this way Chai's output diff in case of failure could look more informative then the other way around
  const promisesWithNamedReflection = [
    firstPartPromise.then(() => 'firstPartPromise'),
    firstPartBodyFinishedPromise.then(() => 'firstPartBodyFinishedPromise'),
    secondPartPromise.then(() => 'secondPartPromise'),
    secondPartBodyFinishedPromise.then(() => 'secondPartBodyFinishedPromise'),
    thirdPartPromise.then(() => 'thirdPartPromise'),
    thirdPartBodyFinishedPromise.then(() => 'thirdPartBodyFinishedPromise'),
  ];

  const promiseNameReflectionsOrderedByActualResolution = [];

  await Promise.all(
    promisesWithNamedReflection.map(async promise => {
      const reflectedName = await promise;
      promiseNameReflectionsOrderedByActualResolution.push(reflectedName);
    })
  );

  expect(promiseNameReflectionsOrderedByActualResolution).to.deep.equal([
    'firstPartPromise',
    'firstPartBodyFinishedPromise',
    'secondPartPromise',
    'secondPartBodyFinishedPromise',
    'thirdPartPromise',
    'thirdPartBodyFinishedPromise',
  ]);

  const firstPartName = (await firstPartPromise).value.name;
  const secondPartName = (await secondPartPromise).value.name;
  const thirdPartName = (await thirdPartPromise).value.name;
  expect(firstPartName).to.equal('field_1');
  expect(secondPartName).to.equal('field_2');
  expect(thirdPartName).to.equal('field_3');
});

const boundary = '--------------------------120789128139917295588288';
