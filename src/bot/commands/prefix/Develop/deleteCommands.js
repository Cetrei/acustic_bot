////   DEPENDENCIAS  ////
require("dotenv").config();
const PATH = require("path");
const { REST, Routes } = require('discord.js');
const { logger, PrefixCommandBuilder, createAnswer } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));

////   INICIO CODIGO ////
const rest = new REST().setToken(process.env.DISCORD_TOKEN);
module.exports = {
    data: new PrefixCommandBuilder()
        .setName("deleteCommands")
        .setDescription("Elimina comandos globales o de un servidor específico."),
    devOnly: true,
    execute: async (Client, Message, GuildId = 0) => {
        try {
            if (GuildId === 0) {
                await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: [] });
                logger.warn(`[COMMAND DELETER] Todos los comandos globales fueron eliminados.`);
                await createAnswer(Message, "✅ Todos los comandos globales han sido eliminados.", false, 5);

                let deletedCount = 0;
                for (const Guild of Client.guilds.cache.values()) {
                    try {
                        await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, Guild.id), { body: [] });
                        logger.warn(`[COMMAND DELETER] Todos los comandos del servidor ${Guild.name} fueron eliminados.`);
                        deletedCount++;
                    } catch (error) {
                        logger.error(`[COMMAND DELETER] Error al eliminar comandos del servidor ${Guild.name}: ${error.message}`);
                    }
                }
                if (deletedCount > 0) {
                    await createAnswer(Message, `✅ Comandos eliminados en ${deletedCount} servidores.`, false, 5);
                }
            } else {
                await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GuildId), { body: [] });
                logger.warn(`[COMMAND DELETER] Todos los comandos del servidor ${GuildId} fueron eliminados.`);
                await createAnswer(Message, `✅ Todos los comandos del servidor ${GuildId} han sido eliminados.`, false, 5);
            }
        } catch (error) {
            logger.error(`[COMMAND DELETER] Error al eliminar comandos: ${error.message}`);
            await createAnswer(Message, `❌ Error al eliminar comandos: ${error.message}`, false, 5);
        }
    },
};
