var mocha = require('mocha');
var fs = require('fs');
var Epub = require('../');

var comicFolder = 'exemples/Haruko';
var comicCbz = 'exemples/Haruko.cbz';
var epubFile = 'Haruko.epub';

describe('mocha test', function() {

    afterEach(function(done){
        var book = 'test/'+epubFile;
        fs.access(book, function( err ) {
            if(!err)fs.unlinkSync(book);
            done();
        })
    });

    it('create epub 3 with folder and all parameters', function(done){
        var epub = new Epub(
            comicFolder,
            'test',
            epubFile,
            'Haruko San No Kareshi',
            'Kuratsuka Riko',
            'ja-jp',
            'rtl'
        );
        epub.genrate("3.0", function(err,file){
            if(err) return done(err);
            done();
        })
    })

    it('create epub 3 with folder and only 2 parameters', function(done){
        var epub = new Epub(
            comicFolder,
            'test'
        );
        epub.genrate("3.0", function(err,file){
            if(err) return done(err);
            done();
        })
    })

    it('create epub 3 with cbz and all parameters', function(done){
        var epub = new Epub(
            comicCbz,
            'test',
            epubFile,
            'Haruko San No Kareshi',
            'Kuratsuka Riko',
            'ja-jp',
            'rtl'
        );
        epub.genrate("3.0", function(err,file){
            if(err) return done(err);
            done();
        })
    })

    it('create epub 3 with cbz and only 2 parameters', function(done){
        var epub = new Epub(
            comicCbz,
            'test'
        );
        epub.genrate("3.0", function(err,file){
            if(err) return done(err);
            done();
        })
    })
});
