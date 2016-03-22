var mocha = require('mocha');
var fs = require('fs.extra');
var Epub = require('../');

var inPath = 'test/images';
var epubFile = 'Haruko.epub';

describe('mocha test', function() {
    before('copy files', function(done) {
        fs.mkdirSync(inPath);
        fs.copy('exemples/Haruko/01.jpg', inPath+'/01.jpg', { replace: true }, function (err) {
            if (err) return done(err);
            fs.copy('exemples/Haruko/02.jpg', inPath+'/02.jpg', { replace: true }, function (err) {
                if (err) return done(err);
                done();
            });
        });
    });

    after(function() {
        fs.rmrf(inPath);
    });

    afterEach(function(){
        fs.unlinkSync('test/'+epubFile);
    });

    it('create epub 3 with all parameters', function(done){
        var epub = new Epub(
            inPath,
            "test",
            epubFile,
            "Haruko San No Kareshi",
            "Kuratsuka Riko",
            "ja-jp"
        );
        epub.convert("3.0", function(err,file){
            if(err) return done(err);
            done();
        })
    })
});
