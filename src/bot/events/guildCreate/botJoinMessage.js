////   DEPENDENCIAS  ////
const PATH = require("path");
const Config = JSON.parse(FS.readFileSync(PATH.resolve("config","db.json")));
require("dotenv").config()
////   INICIO CODIGO ////
module.exports = async (Client, Interaction) => {
    for (const channel in Interaction.guild.channels.cache.values()) {
        
    }
    const canales = GUILD.channels.cache.filter(channel => channel.isTextBased());
    Interaction.followUp("Hola, putos todos menos yo.");
}