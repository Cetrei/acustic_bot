const { EmbedBuilder } = require("discord.js");
module.exports = async function createAnswer(target, Answer, Ephemeral = false, Delay = 0, Options = { components:[], fetchReply:false}) {
    if (target.fake && target.fake === true) return;
    try {
        let message;
        const isInteraction = target.isCommand ? target.isCommand() : false;
        const isEmbed = Answer instanceof EmbedBuilder; // Verificar si Answer es un Embed
        const { components, fetchReply } = Options;
        let isChannel = false;

        const response = {
            content: isEmbed ? null : Answer,
            embeds: isEmbed ? [Answer] : [],
            components: components,
            ephemeral: Ephemeral, 
        };

        if (isInteraction) {
            if (target.deferred || target.replied) {
                message = await target.editReply(response);
            } else {
                message = await target.reply({
                    ...response,
                    fetchReply,
                });
            }
        } else if (target.channel && target.author) {
            message = await target.reply({
                ...response,
                fetchReply,
            });
        } else {
            try {
                message = await target.send(response);
                isChannel = true;
            } catch (error) {
                throw new Error("Tipo de target no compatible.");
            }
        }

        if (Delay > 0 && typeof Delay === "number") {
            setTimeout(() => {
                if (message && message.delete) {
                    message.delete().catch(() => {});
                    if (!isInteraction && !isChannel) {
                        target.delete().catch(() => {});
                    }
                }
            }, Delay * 1000);
        }

        return message;
    } catch (error) {
        console.error(`[CREATE ANSWER] Error al responder: ${error.message}`);
    }
};