////   DEPENDENCIAS  ////
const FS = require("fs");   
const PATH = require("path");
const { logger } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
const playCommand = require(PATH.resolve("src", "bot", "commands", "slash", "Music","play.js")); 
const Config = JSON.parse(FS.readFileSync(PATH.resolve("config","db.json")));
////   INICIO CODIGO ////
module.exports = async (Client) => {
    const laSalsera = "https://radio5.domint.net:8110/stream";
    if (!Config.onlySalsaHellYea) return;
    for (const Guild of Client.guilds.cache.values()) {
        const voiceChannel = Guild.channels.cache.find(
            channel => channel.type === 2 && channel.joinable
        );
        if (voiceChannel) {
            const fakeInteraction = {
                guild: Guild,
                client: Client,
                member: {
                    voice: { channel: voiceChannel },
                    permissions: { has: () => true },
                },
                options: {
                    getSubcommand: () => "radio",
                    getString: (name) => (name === "emisora" ? laSalsera : null),
                },
                reply: async (message) => logger.log("Simulado:", message),
                deferReply: async () => logger.log("Procesando interacción simulada..."),
                fake: true
            };

            try {
                await playCommand.execute(Client, fakeInteraction);
                logger.log("Radio sintonizada automáticamente.");
            } catch (error) {
                logger.error("Error al sintonizar la radio automáticamente:", error);
            }
        } else {
            logger.error("No se encontro un canal de voz.")
        }
    }
}