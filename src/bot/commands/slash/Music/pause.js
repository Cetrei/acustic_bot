////   DEPENDENCIAS  ////
const PATH = require("path");
const { SlashCommandBuilder } = require("discord.js");
const { createAnswer, getGuildQueue } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("Pausa la música actual."),
    devOnly: false,
    async execute(Client, Interaction) {
        const queue = getGuildQueue(Interaction.guild.id);
        if (!queue || !queue.playing) {
            await createAnswer(Interaction, "No hay música reproduciéndose.", true, 5);
            return;
        }

        queue.player.pause();
        queue.playing = false;
        await createAnswer(Interaction, "⏸ Música pausada.", false);
    },
};