////   DEPENDENCIAS  ////
const PATH = require("path");
const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");
const { createAnswer, getGuildQueue } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Detiene la música y limpia la cola."),
    devOnly: false,
    async execute(Client, Interaction) {
        const queue = getGuildQueue(Interaction.guild.id);
        const existingConnection = getVoiceConnection(Interaction.guild.id);

        if (!queue && !existingConnection) {
            return await createAnswer(Interaction, "No hay música reproduciéndose.", true, 5);
        }
        
        queue.songs = [];
        queue.player.stop();
        if (existingConnection) {
            existingConnection.destroy();
        }
        await createAnswer(Interaction, "⏹ Música detenida.", false);
    },
};