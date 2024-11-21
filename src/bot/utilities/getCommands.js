////   DEPENDENCIAS  ////
const getFiles = require("./getFiles.js");
const getDirPaths = require("./getDirPaths.js");
require("dotenv").config()

////   INICIO CODIGO ////
module.exports = function loadCommands(Client, Exceptions = []) {
    let sCommands = [];
    let pCommands = [];

    const slashCommandCategories = getFiles(getDirPaths.Commands + '/slash', true);
    for (const categoryDir of slashCommandCategories) {
        const commandFiles = getFiles(categoryDir);
        for (const commandFile of commandFiles) {
            const commandObject = require(commandFile);
            if (!Exceptions.includes(commandObject.name) && 'data' in commandObject && 'execute' in commandObject) {
                Client.Commands.set(commandObject.data.name, commandObject); 
                sCommands.push(commandObject.data.toJSON());
            }
        }
    }

    const prefixCommandCategories = getFiles(getDirPaths.Commands + '/prefix', true);
    for (const categoryDir of prefixCommandCategories) {
        const commandFiles = getFiles(categoryDir);
        for (const commandFile of commandFiles) {
            const commandObject = require(commandFile);
            if (!Exceptions.includes(commandObject.name) && 'execute' in commandObject) {
                Client.Commands.set(commandObject.name, commandObject); 
                pCommands.push(commandObject.data.toJSON()); 
            }
        }
    }

    return { SlashCommands: sCommands, PrefixCommands: pCommands };
}
