////   DEPENDENCIAS  ////
const PATH = require("path");
const { SlashCommandBuilder } = require("discord.js");
const { createAnswer, getGuildQueue } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Reanuda la música pausada."),
    devOnly: false,
    async execute(Client, Interaction) {
        const queue = getGuildQueue(Interaction.guild.id);
        if (!queue || queue.playing) {
            await createAnswer(Interaction, "No hay música pausada.", true, 5);
            return;
        }

        queue.player.unpause();
        queue.playing = true;
        await createAnswer(Interaction, "▶ Música reanudada.", false);
    },
};