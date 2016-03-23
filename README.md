# epub-comic-gen [![Build Status](https://travis-ci.org/weslleih/epub-comic-gen.svg?branch=master)](https://travis-ci.org/weslleih/epub-comic-gen)
Npm package to create comic epub books

## Installation ##

```bash
npm install epub-comic-gen
```

## Usage ##

```js
var Epub = require('epub-comic-gen');
var epub = new Epub(
    'node_modules/epub-comic-gen/exemples/Haruko',
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
#### Epub(imagesFolder, destinationFolder, destinationFile *[, title, author, language, direction]* )
Instantiates the object

Required
- `imagesFolder` Path to images directory
- `destinationFolder` Path to output directory
- `destinationFile` Name of destination file, Ex. "Name.epub"

Optional
- `title` Title of the Comic (default: the file name without the ".epub")
- `author` Author name (default: "Anonymous")
- `language` Language of the comic, Ex. "en-us", "ja-jp", "pt-br" (default: "en-us")
- `direction` Base text direction, option "ltr" *left-to-right* or "rtl" *right-to-left* (default: "ltr")

#### genrate(*[version,]* endCallback(err, file))
Required
- `endCallback` Callback executed on end or in case of error
    * `err` the error message
    * `file` the name of file that was created

Optional        
- `version` Version of EPUB spec, currently only suport "3.0" (default: "3.0")

## License
[MIT](LICENSE)
