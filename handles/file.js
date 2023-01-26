//LiteLoaderScript Dev Helper
/// <reference path="c:\Users\86158\Documents/dts/llaids/src/index.d.ts"/> 



function exists(pt){
    return File.exists(pt);
}

function writeTo(pt,raw){
    File.writeTo(pt,raw);
}

function mkdir(pt){
    File.mkdir(pt);
}

function copy(pt,npt){
    File.copy(pt,npt);
}

function read(pt){
    return File.readFrom(pt);
}

function listdir(pt){
    return File.getFilesList(pt);
}

module.exports = {
    exists,writeTo,mkdir,copy,read,listdir
}