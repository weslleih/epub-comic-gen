var gulp = require('gulp');
var Epub = require('./');
var fs = require('fs');

gulp.task('exemple', function() {
    var inPath = "exemples/Haruko.epub";
    fs.access(inPath, function( err ) {
        if(!err) fs.unlinkSync(inPath);
        var epub = new Epub("exemples/Haruko",
            "exemples",
            "Haruko.epub",
            "3.0",
            "Haruko San No Kareshi",
            "Kuratsuka Riko",
            "ja-jp"
        );
        epub.convert(function(err,file){
            if(err) throw(err);
        })
    })
});
