////   DEPENDENCIAS  ////
const PATH = require("path");
const { createAnswer } = require(PATH.resolve("src","bot","utilities","utilities.js"));
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Elimina mensajes")
    .addIntegerOption(option =>
        option.setName("cantidad")
        .setDescription("Numero de mensajes a eliminar.")
        .setRequired(true)
        .setMinValue(1)
    )
    .addChannelOption(option =>
        option.setName("canal")
        .setDescription("Define el canal.")
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    devOnly: false,
    execute: async (Client, Interaction) => {
        const ammount = Interaction.options.getInteger('cantidad') || 0;
		const channel = Interaction.options.getChannel('canal') || Interaction.channel;

        if (ammount === 0) {
            createAnswer(Interaction, `Debes especificar una cantidad.`, true, 5);
            return;
        }

        if(channel.permissionsFor(Interaction.guild.members.me).has('ManageMessages')) {
            try {
                const messages = await channel.messages.fetch({ limit: ammount});
                await channel.bulkDelete(messages, false);
                createAnswer(Interaction, `${messages.size} mensajes eliminados.`, true, 5);
            } catch (error) {
                console.error(`[CLEAR] ${error}`);
                createAnswer(Interaction, `Error al eliminar los mensajes (notificar a Heimerdinger)`, true, 5);
            }
        } else {
            createAnswer(Interaction, `El bot no tiene permisos para eliminar mensajes en este canal.   `, true, 5);
        }
    }
}