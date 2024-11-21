////   DEPENDENCIAS  ////
const PATH = require("path");
const { createAnswer } = require(PATH.resolve("src","bot","utilities","utilities.js"));
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Muestra el ping del bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    devOnly: false,
    execute: async (Client, Interaction) => {
        createAnswer(Interaction, `Ping: ${Client.ws.ping} ms`, true, 5);
    }
}