////   DEPENDENCIAS  ////
const FS = require('fs');
const PATH = require("path");
////   INICIO CODIGO ////
module.exports = function getFiles(Directory, FoldersOnly = false) {
    let fileNames = [];
    FS.readdirSync(Directory, { withFileTypes: true}).forEach(File => {
        const FilePath = PATH.join(Directory, File.name);
        if (FoldersOnly){
            if (File.isDirectory()){
                fileNames.push(FilePath);
            }
        } else if (File.isFile()){
            fileNames.push(FilePath);
        }
    });
    return fileNames;
}