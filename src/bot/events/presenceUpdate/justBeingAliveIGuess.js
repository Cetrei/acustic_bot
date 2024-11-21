////   DEPENDENCIAS  ////
const FS = require('fs')
const PATH = require("path");
const Config = JSON.parse(FS.readFileSync(PATH.resolve("config","db.json")));
const cooldownsDND = new Map();
const cooldownsONL = new Map();
const cooldownTime = 5 * 60 * 1000;
const sigmaImage = "https://media.discordapp.net/attachments/1306468930608693360/1307069966629077043/image.png?ex=6738f744&is=6737a5c4&hm=232d687f8a521879132a55cb80171d0c0297690209172589284ceb0b4005d4ef&=&format=webp&quality=lossless&width=537&height=479";
const alphaImage = "";
let dbgStatus = "";
////   INICIO CODIGO ////
module.exports = async (Client, oldPresence, newPresence) => {
    const oldStatus = oldPresence?.status;
    const newStatus = newPresence?.status;
    if ((Config.JustBeingAlive.includes(newPresence.userId)) && !(oldStatus === newStatus)) {
        const now = Date.now();
        let cooldowns;
        let answer = "";
        let lastUsed;
        
        if (newStatus === 'dnd') {
            cooldowns = cooldownsDND;
            lastUsed = cooldownsDND.get(newPresence.userId) || 0;
            answer = `⚠️ <@${newPresence.userId}> se volvio un papu misterioso.\n${sigmaImage}`;
            dbgStatus = newStatus;
        } else if ((oldStatus === 'dnd' || dbgStatus === 'dnd') && newStatus === 'online') {
            cooldowns = cooldownsONL;
            lastUsed = cooldownsONL.get(newPresence.userId) || 0;
            answer = `⚠️ <@${newPresence.userId}> dejó de ser misterioso.\n${alphaImage}`;
            dbgStatus = "";
        }
        if (now - lastUsed >= cooldownTime && !(answer === "")) {
            Config.SigmaChannelsID.forEach(channelID => {
                const notfChannel = newPresence.guild.channels.cache.get(channelID);
                if (notfChannel) {
                    notfChannel.send(answer);
                }
            });
            cooldowns.set(newPresence.userId, now);
        }
    }
}