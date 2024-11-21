////   DEPENDENCIAS  ////
const PATH = require("path");
const { getFiles, getDirPaths, logger } = require("../utilities/utilities.js");
////   INICIO CODIGO ////
module.exports = (Client) => {
    try {
        logger.info(`[COMMAND HANDLER] -> Inicializando comandos.`);

        const CommandTypes = getFiles(getDirPaths.Commands, true);
        for (const CommandType of CommandTypes) {
            const CommandCategories = getFiles(CommandType, true);
            for (const CommandCategory of CommandCategories) {
                const commandFiles = getFiles(CommandCategory);
                for (const commandFile of commandFiles) {
                    const commandObject = require(commandFile);
                    if ('data' in commandObject && 'execute' in commandObject) {
                        const commandName = commandObject.data.name;
                        logger.info(`[COMMAND HANDLER] Comando "${commandName}" cargado.`);
                        commandObject.path = PATH.resolve(CommandType, CommandCategory, commandFile);
                        Client.Commands.set(commandName, commandObject);
                    }
                }
            }
        }
       
        logger.info(`[COMMAND HANDLER] <- Comandos inicializados.`);
    } catch (error ){
        logger.error(`[COMMAND HANDLER] ${error}`);
    }
}