////   DEPENDENCIAS  ////
const PATH = require("path");
const { SlashCommandBuilder } = require("discord.js");
const { createAnswer, getGuildQueue } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Salta a la siguiente canción."),
    devOnly: false,
    async execute(Client, Interaction) {
        const queue = getGuildQueue(Interaction.guild.id);
        if (!queue || !queue.songs.length) {
            await createAnswer(Interaction, "No hay más canciones en la cola.", true, 5);
            return;
        }

        queue.player.stop();
        await createAnswer(Interaction, "⏭ Canción saltada.", false);
    },
};