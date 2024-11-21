const { createAudioPlayer, joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus} = require("@discordjs/voice");

const queues = new Map();
module.exports = function getGuildQueue(guildId, voiceChannel = null) {
    let queue = queues.get(guildId);

    if (!queue) {
        const player = createAudioPlayer();
        queue = {
            songs: [],
            playing: false,
            player: player,
        };

        queues.set(guildId, queue);
    }

    if (voiceChannel) {
        const existingConnection = getVoiceConnection(guildId);
    
        if (!existingConnection) {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
    
            connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                try {
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                    ]);
                } catch (error) {
                    console.error("Desconexión detectada, destruyendo conexión:", error);
                    connection.destroy();
                }
            });
    
            const subscription = connection.subscribe(queue.player);
            if (!subscription) {
                console.error("La conexión no pudo suscribirse al reproductor.");
            } else {
                console.log("Reproductor suscrito correctamente al canal de voz.");
            }
        } else {
            console.log("Conexión existente detectada, omitiendo nueva suscripción.");
        }
    }
    
    return queue;
};