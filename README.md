# epub-comic-gen
[![Build Status](https://travis-ci.org/weslleih/epub-comic-gen.svg?branch=master)](https://travis-ci.org/weslleih/epub-comic-gen)
[![npm version](https://badge.fury.io/js/epub-comic-gen.svg)](https://www.npmjs.com/package/epub-comic-gen)
[![Inline docs](http://inch-ci.org/github/weslleih/epub-comic-gen.svg?branch=master)](http://inch-ci.org/github/weslleih/epub-comic-gen)
[![Code Climate](https://codeclimate.com/github/weslleih/epub-comic-gen/badges/gpa.svg)](https://codeclimate.com/github/weslleih/epub-comic-gen)

Npm package to create comic epub books, without temporary files when using stream for reading and writing
## Requirements ##
- Node 4.0.0+

## Installation ##

```bash
npm install --save epub-comic-gen
```

## Usage ##
Complete

```js
var Epub = require('epub-comic-gen');
var epub = new Epub(
    'node_modules/epub-comic-gen/exemples/Haruko.cbz',
    './',
    'Haruko.pub',
    'Haruko San No Kareshi',
    'Kuratsuka Riko',
    'ja-jp',
    'rtl'
);
epub.genrate("3.0", function(err, file){
    if(err) return throw err;
    console.log(file+'  file was created!');
})
```
Minimal
```js
var epub2 = new Epub(
    'node_modules/epub-comic-gen/exemples/Haruko',
);
epub2.genrate(function(err, file){
    if(err) return throw err;
    console.log(file+'  file was created!');
})
```

#### Epub(comic, destinationFolder, destinationFile *[, title, author, language, direction]* )
Instantiates the object

Required
- `comic` Path to images directory or cbz file

Optional
- `destinationFolder` Path to output directory (default: The same of comic)
- `destinationFile` Name of destination file (default: The same of comic + ".epub")
- `title` Title of the Comic (default: the destinationFile without the ".epub")
- `author` Author name (default: "Anonymous")
- `language` Language of the comic (default: "en-us")
- `direction` Base text direction, options "ltr" *left-to-right* or "rtl" *right-to-left* (default: "ltr")

#### genrate(*[version,]* endCallback(err, file))
Required
- `endCallback` Callback executed on end or in case of error
    * `err` The error
    * `file` The patch of the file that was created

Optional        
- `version` The version of EPUB spec, currently only suport "3.0" (default: "3.0")

## License
[MIT](LICENSE)
