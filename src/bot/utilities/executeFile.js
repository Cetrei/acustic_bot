////   DEPENDENCIAS  ////
const PATH = require("path");
////   INICIO CODIGO ////
module.exports = function executeFile(Path, Client, ...arguments) {
    if (PATH.extname(Path) === ".js"){
        const FilePath = PATH.resolve(Path);
        const FileFunction = require(FilePath)
        if (typeof FileFunction === 'function') {
            try {
                FileFunction(Client, ...arguments)
            } catch(error){
                console.error(`[FILE EXECUTOR] Error al leer "${Path}":, ${error.message}`);
            }
          } else {
            console.error(`[FILE EXECUTOR] Error: ${FilePath} no exporta una funcion.`);
          }
    }
}