////   DEPENDENCIAS  ////
const FS = require('fs');
const PATH = require("path");
////   INICIO CODIGO ////
let utilities = {};
FS.readdirSync(__dirname).forEach( File => {
    if (File.endsWith(".js")){
        const fileName = File.replace(".js", "");
        try {
            utilities[fileName] = require(PATH.join(__dirname,File));
            //console.log(`[UTILITIES LOADER] - ${fileName} cargado`);
        } catch(error){
            console.error(`[UTILITIES LOADER] - Error al cargar ${fileName}: ${error.message}`);
        }
    }
});
module.exports = utilities;