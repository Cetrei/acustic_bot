////   DEPENDENCIAS  ////
const PATH = require("path");
const FS = require('fs');
const DISCORD = require("discord.js");
const { createAnswer, logger } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));

const Config = JSON.parse(FS.readFileSync(PATH.resolve("config", "db.json")));

////   INICIO CODIGO ////
module.exports = async (Client, MessageOrInteraction) => {
    const isInteraction = MessageOrInteraction.isCommand ? MessageOrInteraction.isCommand() : false;
    let userId;

    if (isInteraction) {
        const Interaction = MessageOrInteraction;
        userId = Interaction.user.id;
        try {
            const commandObject = Client.Commands.get(Interaction.commandName);
            if (commandObject) {
                await handleCommandCooldowns(Client, commandObject, Interaction, Client.Cooldowns, userId);
                await handleCommandPermissions(commandObject, Interaction, Client, userId);
                commandObject.execute(Client, Interaction);
            } else {
                createAnswer(Interaction, "Comando no encontrado.", true, 5);
            }
        } catch (error) {
            logger.error(`[COMMAND EXECUTOR] Interaction: ${error}`);
            createAnswer(Interaction, "Ocurrió un error al ejecutar el comando (Notificar a Heimerdinger).", true, 5);
        }
    } else if (MessageOrInteraction instanceof DISCORD.Message) {
        const Message = MessageOrInteraction;
        userId = Message.author.id;
        const args = Message.content.slice(Config.Prefix.length).trim().split(/\s+/);
        const commandName = args.shift();

        try {
            const commandObject = Client.Commands.get(commandName);
            if (commandObject) {
                await handleCommandCooldowns(Client, commandObject, Message, Client.Cooldowns, false, userId);
                await handleCommandPermissions(commandObject, Message, Client, userId);
                await commandObject.execute(Client, Message, ...args);
            } else {
                createAnswer(Message, "Comando no encontrado.", false, 5);
            }
        } catch (error) {
            logger.error(`[COMMAND EXECUTOR] Prefix: ${error}`);
            createAnswer(Message, "Ocurrió un error al ejecutar el comando (Notificar a Heimerdinger).", false, 5);
        }
    }
};

async function handleCommandCooldowns(Client, commandObject, MessageOrInteraction, Cooldowns, userId) {
    const now = Date.now();
    const timestamps = Cooldowns.get(commandObject.name) || new DISCORD.Collection();
    const defaultCooldownDuration = 3;
    const cooldownAmount = (commandObject.cooldown ?? defaultCooldownDuration) * 1_000;

    if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId) + cooldownAmount;
        if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1_000);
            return createAnswer(MessageOrInteraction, `Tienes que esperar hasta <t:${expiredTimestamp}:R> para usar este comando.`, MessageOrInteraction.isCommand ? true : false, 5);
        }
    }

    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);
    Cooldowns.set(commandObject.name, timestamps);
}

async function handleCommandPermissions(commandObject, MessageOrInteraction, Client, userId) {
    if (commandObject.devOnly && !Client.Developers.includes(userId)) {
        return createAnswer(MessageOrInteraction, "Comando solo para desarrolladores.", MessageOrInteraction.isCommand ? true : false, 5);
    }

    if (Client.AccesRestricted.includes(userId)) {
        return createAnswer(MessageOrInteraction, "Sin acceso a este comando.", MessageOrInteraction.isCommand ? true : false, 5);
    }

    if (commandObject.userPermissionsRequired?.length) {
        for (const permission of commandObject.userPermissionsRequired) {
            if (!MessageOrInteraction.member.permissions.has(permission)) {
                return createAnswer(MessageOrInteraction, `No tienes los permisos necesarios: ${permission}.`, MessageOrInteraction.isCommand ? true : false, 5);
            }
        }
    }

    if (commandObject.botPermissionsRequired?.length) {
        for (const permission of commandObject.botPermissionsRequired) {
            if (!MessageOrInteraction.guild.me.permissions.has(permission)) {
                return createAnswer(MessageOrInteraction, `El bot no tiene los permisos necesarios: ${permission}.`, MessageOrInteraction.isCommand ? true : false, 5);
            }
        }
    }
}
