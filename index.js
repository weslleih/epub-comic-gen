"use strict";
var fs = require('fs');
var path = require('path');

var ejs = require('ejs');
var Packer = require('zip-stream');
var mime = require('mime-types');
var sizeOf = require('image-size');

class Epub {
    constructor(inPath, epubPath, epubFile, title, author, lang) {
        this.inPath = path.normalize(inPath)+"/";
        this.epubPath = path.normalize(epubPath)+"/";
        this.epubFile = epubFile;
        this.date = new Date();
        this.archive = new Packer();

        lang = lang || "en-us";
        title = title || epubFile.replace('.epub','');
        author = author || "Anonymous";
        this.data = {
            "uuid" : this.generatUuid(),
            "title" : title,
            "author" : author,
            "lang1" : lang.slice(0,2),
            "lang2" : lang,
            "date" : this.date.toISOString().slice(0, 19)+'Z',
            "images" : [],
        }
    }
    convert(version, callback){
        var self = this;

        this.modelPath = "templates/"+version+"/";
        this.model = JSON.parse(fs.readFileSync(this.modelPath+"model.json",'utf8'));
        //Calback executed at the end of the process or in case of failure
        self.returnCallback = callback;

        //Read file from path
        fs.readdir(self.inPath, function(err, files) {
            if(err){
                self.returnCallback(err, null)
            }else if(files.length < 1){
                self.returnCallback(new Error("No files selected"), null)
            }else{
                var page = 1;
                for( var i = 0; i < files.length; i++){
                    var mimeType = mime.lookup(self.inPath+files[i]);
                    if(mimeType == "image/jpeg" || mimeType == "image/png"){
                        var dimensions = sizeOf(self.inPath+files[i]);
                        self.data.images.push({
                            "file" : files[i],
                            "mimeType" : mimeType,
                            "width": dimensions.width,
                            "height": dimensions.height,
                            "page" : page
                        })
                        page++;
                    }
                }
                if(self.data.images.length < 1){
                    self.returnCallback(new Error("The files are not supported!"), null);
                }else{
                    self.createStream();
                    self.insertLoo("static", 0, 0);
                }
            }
        });

    }

    //CreateWriteStream .epub file
    createStream(){
        var writeStream = fs.createWriteStream(this.epubPath+this.epubFile);
        writeStream.on('close', function() {
            this.end();
        });
        this.archive.pipe(writeStream);
    }

    //Recursive loop of files insertion
    insertLoo(type, current, imageCount){

        type = type || 'static';
        current = current || 0;
        imageCount = imageCount || 0;

        var self = this;
        var content = '';
        var path = '';
        var file = '';

        switch(type) {
            case 'static':
                //Static files end, reset the couters and go to list of interactive files
                if(self.model.statics && self.model.statics.length <= current){
                    self.insertLoo('interactive', 0, 0);
                    return;
                }
                file = self.model.statics[current];
                content =  fs.readFileSync(self.modelPath+self.model.statics[current]);
                current++;
                break;
            case 'interactive':
                //Interactive files end, reset the couters and go to list of ejs files
                if(self.model.interactives && self.model.interactives.length <= current){
                    self.insertLoo('ejs', 0, 0);
                    return;
                    //Current interactive ends, go to the next
                }else if(self.data.images.length <= imageCount){
                    self.insertLoo('interactive', current+1, 0);
                    return;
                }
                var interactive = self.model.interactives[current];
                if(imageCount == 0){
                    self.data[interactive.interator] = [];
                }

                //Create a file name for interactive file
                var filename = interactive.template.file.slice(0,interactive.template.file.length-4);
                var dotIndex = filename.lastIndexOf(".");
                filename = filename.slice(0, dotIndex) + self.data.images[imageCount].page + filename.slice(dotIndex);
                self.data[interactive.interator].push(filename);
                //Set current image data
                self.data.image = self.data.images[imageCount];

                file = interactive.template.path+filename;
                content = ejs.render(fs.readFileSync(this.modelPath+interactive.template.path+interactive.template.file, "utf8"), self.data);
                imageCount++;
                break;
            case 'ejs':
                //Ejs files end, reset the couters and go to list of images
                if(self.model.ejss && self.model.ejss.length <= current){
                    self.insertLoo('image', 0, 0);
                    return;
                }
                content =  content = ejs.render(fs.readFileSync(self.modelPath+self.model.ejss[current], "utf8"), self.data);
                var ejsFile = self.model.ejss[current]
                file = ejsFile.slice(0, ejsFile.length-4);
                current++;
                break;
            case 'image':
                //Images end, execute endCallback and exit program
                if(self.data.images && self.data.images.length <= current){
                    //Cluse writeStream
                    self.archive.finish();
                    self.returnCallback(false, this.epubFile);
                    return;
                }
                file = self.model.imagePath+self.data.images[current].file;
                content = fs.createReadStream(self.inPath+self.data.images[current].file);
                current++;
                break;
            default:
                self.archive.finish();
                self.returnCallback(new Error("Unknown error"), null)
                return;
        }

        self.archive.entry(content, { name: file , date: self.date}, function(err) {
            if ( err) throw err;
            self.insertLoo(type, current, imageCount);
        });
    }

    generatUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r;
            r = Math.random() * 16 | 0;
            return (c === 'x' ? r : r & 0x3 | 0x8).toString(16);
        });
    };
}

module.exports = Epub;
