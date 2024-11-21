////   DEPENDENCIAS  ////
const PATH = require("path");
////   INICIO CODIGO ////
module.exports = {
    Handlers: PATH.resolve("src", "bot", "handlers"),
    Events:   PATH.resolve("src", "bot", "events"),
    Commands: PATH.resolve("src", "bot", "commands"),
}