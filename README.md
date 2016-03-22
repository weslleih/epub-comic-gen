# epub-comic-gen [![Build Status](https://travis-ci.org/weslleih/epub-comic-gen.svg?branch=master)](https://travis-ci.org/weslleih/epub-comic-gen)
Npm package to create comic epub books

## Installation

```bash
npm install epub-comic-gen
```

## Usage

```js
var Epub = require('epub-comic-gen');
var epub = new Epub(
    'node_modules/epub-comic-gen/exemples/Haruko',
    './',
    'Haruko.pub',
    'Haruko San No Kareshi',
    'Kuratsuka Riko',
    'ja-jp'
);
epub.genrate("3.0", function(err, file){
    if(err) return throw err;
    console.log(file+'  file was created!');
})
```
## License
[MIT](LICENSE)
