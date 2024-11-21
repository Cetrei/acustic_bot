////   DEPENDENCIAS  ////
const PATH = require("path");
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, EmbedBuilder , Colors } = require("discord.js");
const { createAnswer, getGuildQueue } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
////   INICIO CÓDIGO  ////
module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Muestra las canciones en la cola."),
    devOnly: false,
    async execute(Client, Interaction) {
        await Interaction.deferReply();    
        const queue = getGuildQueue(Interaction.guild.id);
        if (!queue || queue.songs.length === 0) {
            await createAnswer(Interaction, "No hay canciones en la cola.", true, 5);
            return;
        }

        const songsPerPage = 10;
        const totalPages = Math.ceil(queue.songs.length / songsPerPage);

        let currentPage = 1;

        function createQueueEmbed(page) {
            const startIndex = (page - 1) * songsPerPage;
            const endIndex = page * songsPerPage;
            const currentSongs = queue.songs.slice(startIndex, endIndex);

            let fields = {};
            currentSongs.forEach((song, index) => {
                fields[`#${startIndex + index + 1}`] = {
                    name: song.title,
                    value: `[Escuchar](${song.url})`
                };
            });

            return new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle("🎶 Lista de Canciones en Cola")
            .setDescription("Estas son las canciones que están en la cola de reproducción:")
            .addFields(Object.values(fields))
            .setFooter({ text: `Página ${page} de ${totalPages} | Total: ${queue.songs.length} canciones`})
            .setTimestamp();
        }

        function createPaginationButtons(page) {
            const row = new ActionRowBuilder();

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Anterior')
                    .setStyle('Primary')
                    .setDisabled(page === 1)
            );

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Siguiente')
                    .setStyle('Primary')
                    .setDisabled(page === totalPages)
            );

            return row;
        }
        const embed = createQueueEmbed(currentPage);
        const row = createPaginationButtons(currentPage);

        const message = await createAnswer(
            Interaction,
            embed,
            false,
            0,
            { components: [row], fetchReply: true }
        );

        const filter = (interaction) => interaction.user.id === Interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 60000 * 5 });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.customId === 'previous') {
                if (currentPage > 1) currentPage--;
            } else if (buttonInteraction.customId === 'next') {
                if (currentPage < totalPages) currentPage++;
            }

            const newEmbed = createQueueEmbed(currentPage);
            const newRow = createPaginationButtons(currentPage);

            await buttonInteraction.update({
                embeds: [newEmbed],
                components: [newRow]
            });
        });

        collector.on('end', () => {
            const disabledRow = createPaginationButtons(currentPage);
            disabledRow.components.forEach(button => button.setDisabled(true));

            message.edit({ components: [disabledRow] });
        });
    },
};