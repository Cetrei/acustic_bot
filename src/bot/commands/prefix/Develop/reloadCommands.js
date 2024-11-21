////   DEPENDENCIAS  ////
const PATH = require("path");
const { logger, PrefixCommandBuilder, createAnswer, getDirPaths } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
////   INICIO CODIGO ////
module.exports = {
    data: new PrefixCommandBuilder()
        .setName("reloadCommands")
        .setDescription("Recarga los comandos."),
    devOnly: true,
    execute: async (Client, Message) => {
        const Commands = Client.Commands;
        try {
            for (const Command of Commands.values()) {
                const commandPath = Command.path;
                delete require.cache[require.resolve(commandPath)];
    
                const updatedCommand = require(commandPath);
                Client.Commands.set(updatedCommand.data.name, updatedCommand);
            }
            await createAnswer(Message, `✅ ${Commands.size} comandos recargados.`, false, 5);
        } catch (error) {
            logger.error(`[RELOAD COMMANDS] ${error}`);
            await createAnswer(Message, `❌ Error recargar los comandos.`, false, 5);
        }
    },
};
