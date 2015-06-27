
# cheese
Express middleware that serves a browserified javascript file.

```javascript
// server.js

var express = require('express');
var cheese = require('cheese');
var path = require('path');

var app = express();

app.use('/', cheese(path.join(__dirname, 'client.js')));

app.listen(3000);
```

```javascript
// client.js
var _ = require('lodash');

document.write('hello');
```

Look in the `example` directory for a slightly more involved example.

## API
### cheese(path)
Produce a middleware that will browserify and serve the script at `path`.

## Installation
```sh
$ npm install --save cheese
```

## License
MIT License. See `./LICENSE` for details.
