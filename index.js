////   DEPENDENCIAS  ////
const PATH = require("path");
const FS = require("fs");
const DISCORD = require("discord.js");
const { getFiles, executeFile, getDirPaths, logger } = require(PATH.resolve("src","bot","utilities","utilities.js"));
require("dotenv").config()
const { generateDependencyReport } = require('@discordjs/voice');

console.log(generateDependencyReport());
////   CONSTANTES    ////}
const Config = JSON.parse(FS.readFileSync(PATH.resolve("config","db.json")));
////   CLIENTE       ////
const Client = new DISCORD.Client({ intents: [
    DISCORD.GatewayIntentBits.AutoModerationConfiguration,
    DISCORD.GatewayIntentBits.AutoModerationExecution,
    DISCORD.GatewayIntentBits.DirectMessagePolls,
    DISCORD.GatewayIntentBits.DirectMessageReactions,
    DISCORD.GatewayIntentBits.DirectMessageTyping,
    DISCORD.GatewayIntentBits.DirectMessages,
    DISCORD.GatewayIntentBits.GuildEmojisAndStickers,
    DISCORD.GatewayIntentBits.GuildIntegrations,
    DISCORD.GatewayIntentBits.GuildInvites,
    DISCORD.GatewayIntentBits.GuildMembers, // Privileged
    DISCORD.GatewayIntentBits.GuildMessagePolls,
    DISCORD.GatewayIntentBits.GuildMessageReactions,
    DISCORD.GatewayIntentBits.GuildMessageTyping,
    DISCORD.GatewayIntentBits.GuildMessages,
    DISCORD.GatewayIntentBits.GuildModeration,
    DISCORD.GatewayIntentBits.GuildPresences, // Privileged
    DISCORD.GatewayIntentBits.GuildScheduledEvents,
    DISCORD.GatewayIntentBits.GuildVoiceStates,
    DISCORD.GatewayIntentBits.GuildWebhooks,
    DISCORD.GatewayIntentBits.Guilds,
    DISCORD.GatewayIntentBits.MessageContent // Privileged
]});
logger.log(`[BOT INDEX] - Nivel de permisos: ${Client.options.intents.bitfield}`);
Client.Player = null;
Client.Queue = [];  
Client.Blacklist = Config.Blacklist;
Client.AccesRestricted = Config.AccesRestricted;
Client.Developers = Config.Developers;
Client.FullDebug = false;
Client.Commands = new DISCORD.Collection();
Client.Cooldowns = new DISCORD.Collection();
////   INICIADOR     ////
const Handlers = getFiles(getDirPaths.Handlers, false);
for (const Handler of Handlers){
    executeFile(Handler, Client);
}
try {
    Client.login(process.env.DISCORD_TOKEN);
} catch(error){
    logger.error(`[BOT INDEX] - No se pudo prender el bot: ${error}`);
}