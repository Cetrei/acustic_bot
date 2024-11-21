////   DEPENDENCIAS  ////
const PATH = require("path");
const { createAnswer } = require(PATH.resolve("src","bot","utilities","utilities.js"));
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Expulsa permanentemente a un miembro.')
    .addUserOption(option =>
        option.setName('usuario')
        .setDescription('El miembro a banear.')
        .setRequired(true))
    .addStringOption(option =>
        option.setName('razon')
        .setDescription('El motivo del baneo.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    devOnly: false,
    execute: async (Client, Interaction) => {
        const user = Interaction.options.getUser('usuario');
		const reason = Interaction.options.getString('razon') ?? "Sin motivo.";

		await Interaction.guild.members.ban(user);
        createAnswer(Interaction, `${user.username} fue baneado: ${reason}`)
    }
}