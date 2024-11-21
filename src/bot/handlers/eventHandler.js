////   DEPENDENCIAS  ////
const { getFiles, executeFile, getDirPaths, logger } = require("../utilities/utilities.js");
////   INICIO CODIGO ////
module.exports = (Client) => {
    try {
        logger.info(`[EVENT HANDLER] -> Inicializando eventos`);
        const EventFolders = getFiles(getDirPaths.Events, true);
        for (const EventFolder of EventFolders){
            const EventFiles = getFiles(EventFolder);
            const EventName = EventFolder.replace(/\\/g,"/").split("/").pop();
            logger.log(`[EVENT HANDLER] Enlazando evento: ${EventName}`);
            Client.on(EventName, async (...arguments) =>{
                for (const EventFile of EventFiles){
                    executeFile(EventFile, Client, ...arguments)
                }
            })
        }
        logger.info(`[EVENT HANDLER] <- Eventos inicializados`);
    } catch (error ){
        logger.error(`[EVENT HANDLER] ${error}`);
    }
}