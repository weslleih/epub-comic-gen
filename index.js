"use strict";
var fs = require('fs');
var path = require('path');

var ejs = require('ejs');
var Packer = require('zip-stream');
var StreamZip = require('node-stream-zip');
var mime = require('mime-types');
var sizeOf = require('image-size');
var ImageSizeStream = require('image-size-stream');

var queue = require('queue');

/*
* MAIN CLASS
* This class represents the comic data
*/
class Epub {

    /**
    * The comic basic data
    * @constructor
    * @param  {string} comic                   - Path to comic or directory of images.
    * @param  {string} [destinationFolder ]    - Path to output directory
    * @param  {string} [destinationFile]       - Name of destination file
    * @param  {string} [title=destinationFile] - Title of the Comic
    * @param  {string} [author="Anonymous"]    - Author name
    * @param  {string} [lang="en-us"]          - Language abbreviation of the comic, "en-us"
    * @param  {string} [direction="ltr"]       - Base text direction, options "ltr" left-to-right or "rtl" right-to-left (default: "ltr")
    */
    constructor(comic, destinationFolder , destinationFile, title, author, lang, direction) {

        this._comic = path.normalize(comic);
        let parse = path.parse(this._comic);
        this._destinationFolder  = destinationFolder?path.normalize( destinationFolder ): parse.dir;
        this._destinationFile = destinationFile || parse.name+".epub";
        this._date = new Date();
        this._archive = new Packer();

        lang = lang || "en-us";
        title = title || this._destinationFile.replace('.epub','');
        author = author || "Anonymous";
        direction = direction || "ltr";

        this._data = {
            "uuid" : this._generatUuid(),
            "title" : title,
            "author" : author,
            "lang1" : lang.slice(0,2),
            "lang2" : lang,
            "date" : this._date.toISOString().slice(0, 19)+'Z',
            "images" : [],
            "direction" : direction
        }
    }

    /**
    * Starts the conversion of comic
    * @param  {string} [version="3.0"] - The version of Epub to convert
    * @param  {returnCallback} param2 - Callback executed at the end of the process
    */
    genrate(param1, param2){
        var self = this;

        var version = (typeof param1 == 'function')?"3.0":param1;
        this._modelPath = path.join("templates",version);
        let jsonPath = path.join(this._modelPath,"model.json");
        this._model = JSON.parse(fs.readFileSync(jsonPath,'utf8'));

        //Calback executed at the end of the process or in case of failure
        self._returnCallback = (typeof param1 == 'function')?param1:param2;
        if(fs.lstatSync(self._comic).isDirectory()){
            if(fs.readdirSync(self._comic) < 0){
                self._callError(new Error("The folder is empty"));
            }else{
                self._createStream();
                self._insertStatics(0, 0);
            }
        }else if(path.extname(self._comic) != ".cbz" ){
            self._callError(new Error("The file format is not supported"))
        }else{
            self._createStream();
            self._insertStatics(0, 0);
        }
    }
    /**
    * Callback executed at the end of the process.
    * @callback requestCallback
    * @param {number} responseCode
    * @param {string} responseMessage
    */

    /**
    * Insert images from a folder in epub
    */
    _insertFromFolder(){
        var self = this;
        fs.readdir(self._comic, function(err, files) {
            if(err){
                self._callError(err);
            }else if(files.length < 1){
                self._callError(new Error("No files selected"));
            }else{
                var page = 1;
                var q = queue();
                q.concurrency = 1;
                for( var i = 0; i < files.length; i++){
                    let filePath = path.join(self._comic,files[i]);
                    let mimeType = mime.lookup(filePath);
                    let image = files[i];
                    if( mimeType == "image/jpeg" || mimeType == "image/png" ){
                        let dimensions = sizeOf(filePath);
                        self._data.images.push({
                            "file" : image,
                            "mimeType" : mimeType,
                            "width": dimensions.width,
                            "height": dimensions.height,
                            "page" : (page < 10)?0+page:page
                        })
                        page++;
                        q.push(function(cb) {
                            var file = path.join(self._model.imagePath,image);
                            var content = fs.createReadStream(filePath);
                            self._archive.entry(content, { name: file , date: self._date}, function(err) {
                                if ( err) self._callError(err);
                                cb();
                            });
                        })
                    }
                }
                q.start(function(err) {
                    if ( err) self._callError(err);
                    if(self._data.images.length < 1){
                        self._callError(new Error("The files are not supported!"));
                    }else{
                        self._insertInteractive( 0, 0);
                    }
                });
            }
        });
    }

    /**
    * Insert images from a cbz to epub
    */
    _insertFromCbz(){
        var self = this;
        self._zip = new StreamZip({
            file: self._comic,
            storeEntries: true
        });
        self._zip.on('error', function(err) {
            self._callError(err);
        });

        self._zip.on('ready', function() {
            var files = self._zip.entries();
            var total = self._zip.entriesCount, index = 0;
            var q = queue();
            q.concurrency = 1;
            for (let prop in files) {

                if (!files.hasOwnProperty(prop)) {
                    continue;
                }

                let ext = path.extname(prop);
                let name = path.basename(prop)
                if( ext == ".jpg" || ext == ".png" ){
                    q.push(function(cb) {
                        self._data.images.push({
                            "file" : name,
                            "page" : (index < 10)?0+index:index
                        })
                        self._zip.stream(prop, function(err, stream) {
                            if ( err) self._callError(err);
                            var imageSizeStream = ImageSizeStream()
                            .on('size', function(dimensions) {
                                self._data.images[index].mimeType =  mime.lookup(dimensions.type);
                                self._data.images[index].width = dimensions.width;
                                self._data.images[index].height = dimensions.height;
                            });
                            stream.pipe(imageSizeStream);
                            self._archive.entry(stream, { name: path.join(self._model.imagePath,name) , date: self._date}, function(err) {
                                index++;
                                if ( err) self._callError(err);
                                //self._insertLoop(type, counter, imageCounter);
                                cb();
                            });
                        });
                    })
                }
            }
            q.start(function(err) {
                if ( err) self._callError(err);
                if(self._data.images.length<1){
                    self._callError("No images found");
                }else{
                    self._insertInteractive(0, 0);
                }
            });
        })
    }

    /**
    * CreateWriteStream .epub file
    */
    _createStream(){
        var writeStream = fs.createWriteStream(path.join(this._destinationFolder,this._destinationFile));
        writeStream.on('close', function() {
            this.end();
        });
        this._archive.pipe(writeStream);
    }

    /**
    * Loop of static files insertion
    * @param {Number} counter - The interaction counter
    */
    _insertStatics(counter){
        var self = this;
        counter = counter || 0;
        if(self._model.statics && self._model.statics.length <= counter){
            self._insertImages();
        }else{
            var file = self._model.statics[counter];
            var content =  fs.createReadStream(path.join(self._modelPath,self._model.statics[counter]));
            counter++;
            self._archive.entry(content, { name: file , date: self._date}, function(err) {
                if ( err) self._callError(err);
                self._insertStatics(counter);
            });
        }
    }

    /**
    * Decide which method will be used to process images
    */
    _insertImages(){
        var self = this;
        if(fs.lstatSync(self._comic).isDirectory()){
            self._insertFromFolder();
        }else{
            self._insertFromCbz();
        }
    }

    /**
    * Loop of interactive files insertion
    * @param  {Number} counter      - The interaction counter
    * @param  {Number} imageCounter - The images interaction counter
    */
    _insertInteractive(counter, imageCounter){
        var self = this;
        if(self._model.interactives && self._model.interactives.length <= counter){
            self._insertDynamic(0);
            //Current interactive ends, go to the next
        }else if(self._data.images.length <= imageCounter){
            self._insertInteractive(counter+1, 0);
        }else{
            //The current interactive template
            var interactive = self._model.interactives[counter];
            //Create a attribute "interactive.interator" in data field if not exist
            if(imageCounter == 0){
                self._data[interactive.interator] = [];
            }

            //Create a file name for interactive file
            var filename = interactive.template.file.slice(0, interactive.template.file.length-4);
            var dotIndex = filename.lastIndexOf(".");
            filename = filename.slice(0, dotIndex) + self._data.images[imageCounter].page + filename.slice(dotIndex);

            self._data[interactive.interator].push(filename);
            //Set current image data
            self._data.image = self._data.images[imageCounter];

            var file = path.join(interactive.template.path, filename);
            var content = ejs.render(fs.readFileSync(path.join(this._modelPath,interactive.template.path,interactive.template.file), "utf8"), self._data);
            imageCounter++;

            self._archive.entry(content, { name: file , date: self._date}, function(err) {
                if ( err) self._callError(err);
                self._insertInteractive(counter, imageCounter);
            });
        }
    }

    /**
    * Loop of dynamic files insertion
    * @param  {Number} counter - The interaction counter
    */
    _insertDynamic(counter){
        var self = this;
        counter = counter || 0;
        if(self._model.ejss && self._model.ejss.length <= counter){
            //Close writeStream
            self._archive.finish();
            self._returnCallback(false, path.join(this._destinationFolder,self._destinationFile));
        }else{
            var content = ejs.render(fs.readFileSync(path.join(self._modelPath,self._model.ejss[counter]), "utf8"), self._data);
            var ejsFile = self._model.ejss[counter]
            var file = ejsFile.slice(0, ejsFile.length-4);
            counter++;
            self._archive.entry(content, { name: file , date: self._date}, function(err) {
                if ( err) self._callError(err);
                self._insertDynamic(counter);
            });
        }
    }

    /**
    * Delete the file generated if an error occurs during the process and calls the callback
    * @param  {Error} err - The error
    */
    _callError(err){
        var self = this;
        self._archive.finish();
        fs.access(inPath, function( err ) {
            if(!err) fs.unlinkSync(inPath);
            self._returnCallback(err, null)
        })
    }

    /**
    * Generada a random epub uuid
    * @return {String} - The generated uuid
    */
    _generatUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r;
            r = Math.random() * 16 | 0;
            return (c === 'x' ? r : r & 0x3 | 0x8).toString(16);
        });
    }
}

module.exports = Epub;
