# Overview

Multerator (short for _multipart-iterator_) is a `multipart/form-data` parser for Node.js.

This is an initial README and more documentation will be eventually added.

# Installation

```sh
npm install multerator
```

# Usage examples

### _General usage:_

```js
const fs = require('fs');
const { PassThrough } = require('stream');
const FormData = require('form-data');
const multerator = require('multerator').default;

(async () => {
  // Obtain a multipart data stream with help from form-data package:
  const form = new FormData();
  form.append('my_text_field', 'my text value');
  form.append('my_file_field', fs.createReadStream(`${__dirname}/image.jpg`));
  const input = form.pipe(new PassThrough()); // Converting the form data instance into a normalized Node.js stream, which is async-iteration-friendly as required for multerator's input
  const boundary = form.getBoundary();

  // Feed it to multerator:
  try {
    for await (const part of multerator({ input, boundary })) {
      if (part.type === 'text') {
        console.log(
          `Got text field "${part.name}" with content type "${part.contentType}" and value "${part.data}"`
        );
      } else {
        console.log(
          `Got file field "${part.name}" of filename "${part.filename}" with content type "${part.contentType}" and incoming data chunks:`
        );
        for await (const chunk of part.data) {
          console.log(`Received ${chunk.length} bytes`);
        }
      }
    }
  } catch (err) {
    console.log('Multipart parsing failed:', err);
  }
})();
```

### _Very banal file upload server with Express:_

```js
const { createWriteStream } = require('fs');
const { pipeline, Readable } = require('stream');
const { promisify } = require('util');
const express = require('express');
const multerator = require('multerator').default;

const pipelinePromisified = promisify(pipeline);

const expressApp = express();

expressApp.post('/upload', async (req, res) => {
  const contentType = req.headers['content-type'];

  try {
    if (!contentType && !contentType.startsWith('multipart/form-data')) {
      throw new Error(
        '😢 Only requests of type multipart/form-data are allowed'
      );
    }

    const boundary = contentType.split('boundary=')[1];

    const parts = multerator({ input: req, boundary });

    for await (const part of parts) {
      if (part.type === 'file') {
        console.log(
          `Incoming upload: field name: ${part.name}, filename: ${part.filename}, content type: ${part.contentType}`
        );
        await pipelinePromisified(
          Readable.from(part.data),
          createWriteStream(`${__dirname}/uploads/${part.filename}`)
        );
      }
    }

    res.status(200).send({ success: true });
  } catch (err) {
    res.status(500).send({ success: false, error: err.message });
  }
});

expressApp.listen(8080, () => console.log('Server listening on 8080'));
```

...callable by e.g:

```shell
curl \
  -F my_text_field="my text value" \
  -F my_file_field=@src/spec/mockFiles/image.jpg \
  http://127.0.0.1:8080/upload
```
