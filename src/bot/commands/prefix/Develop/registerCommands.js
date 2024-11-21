////   DEPENDENCIAS  ////
require("dotenv").config();
const PATH = require("path");
const { REST, Routes } = require('discord.js');
const { logger, PrefixCommandBuilder, createAnswer, getCommands, areCommandsEqual } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));

////   INICIO CODIGO ////
const rest = new REST().setToken(process.env.DISCORD_TOKEN);
module.exports = {
    data: new PrefixCommandBuilder()
        .setName("registerCommands")
        .setDescription("Actualiza comandos globales o de un servidor específico."),
    devOnly: true,
    execute: async (Client, Message, GuildId = 0) => {
        const { SlashCommands } = getCommands(Client, []);
        try {
            logger.debug(`[COMMAND LOADER] Obteniendo comandos actuales...`);
            const currentCommands = await rest.get(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID)
            );

            const commandsToUpdate = SlashCommands.filter(localCommand => {
                const existingCommand = currentCommands.find(cmd => cmd.name === localCommand.name);
                return !existingCommand || !areCommandsEqual(existingCommand, localCommand);
            });

            if (commandsToUpdate.length === 0) {
                logger.info("[COMMAND LOADER] No hay comandos nuevos o actualizados.");
                await createAnswer(Message, "✅ No hay comandos nuevos o actualizados.", false, 5);
                return;
            }

            logger.info(`[COMMAND LOADER] Refrescando ${commandsToUpdate.length} comandos.`);
            
            if (GuildId === 0) {
                const data = await rest.put(
                    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                    { body: commandsToUpdate },
                );
                logger.log(`[COMMAND LOADER] ${data.length} comandos globales actualizados.`);
                await createAnswer(Message, `✅ ${data.length} comandos globales actualizados.`, false, 5);
            } else {
                const currentGuildCommands = await rest.get(
                    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GuildId)
                );

                const guildCommandsToUpdate = commandsToUpdate.filter(localCommand => {
                    const existingCommand = currentGuildCommands.find(cmd => cmd.name === localCommand.name);
                    return !existingCommand || !areCommandsEqual(existingCommand, localCommand);
                });

                if (guildCommandsToUpdate.length > 0) {
                    const data2 = await rest.put(
                        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GuildId),
                        { body: guildCommandsToUpdate },
                    );
                    logger.log(`[COMMAND LOADER] ${data2.length} comandos actualizados en el servidor ${GuildId}.`);
                    await createAnswer(Message, `✅ ${data2.length} comandos actualizados en el servidor ${GuildId}.`, false, 5);
                } else {
                    await createAnswer(Message, "✅ No hay comandos nuevos o actualizados en la guild.", false, 5);
                }
            }
        } catch (error) {
            logger.error(`[COMMAND LOADER] ${error}`);
            await createAnswer(Message, `❌ Error al actualizar comandos: ${error.message}`, false, 5);
        }
    }
};
