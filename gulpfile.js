var gulp = require('gulp');
var Epub = require('./');
var fs = require('fs');
var mocha = require('gulp-mocha');

gulp.task('exemple', function() {
    var inPath = "exemples/Haruko.epub";
    fs.access(inPath, function( err ) {
        if(!err) fs.unlinkSync(inPath);
        var epub = new Epub("exemples/Haruko",
            "exemples",
            "Haruko.epub",
            "Haruko San No Kareshi",
            "Kuratsuka Riko",
            "ja-jp",
            "rtl"
        );
        epub.genrate("3.0", function(err,file){
            if(err) throw(err);
        })
    })
});

gulp.task('mocha', function () {
  return gulp.src('test/*.js')
    .pipe(mocha());
});

gulp.task('default', ['exemple']);
