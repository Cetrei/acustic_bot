////   DEPENDENCIAS  ////
const PATH = require("path");
const FS = require('fs');
const commandExecutor = require(PATH.resolve("src","bot","commandExecutor.js"));
const Config = JSON.parse(FS.readFileSync(PATH.resolve("config", "db.json")));
////   INICIO CODIGO ////
module.exports = async (Client, Message) => {
    if (!Message.author.bot && Message.content.startsWith(Config.Prefix)) {
        await commandExecutor(Client, Message);
    }
}