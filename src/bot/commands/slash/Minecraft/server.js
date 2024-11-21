////   DEPENDENCIAS  ////
require("dotenv").config();
const FS = require("fs");
const PATH = require("path");
const AXIOS = require("axios");
const { createAnswer, logger } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
const {
    PermissionFlagsBits,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    Colors,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    ButtonStyle,
    ModalBuilder
} = require("discord.js");
const EditableOptions = [
    'gamemode',
    'difficulty',
    'max_players',
    'pvp',
    'hardcore',
    'spawn-protection',
    'view-distance',
    'allow-nether'
];
const ChoicesOptions = {
    gamemode: [
        { label: "Survival", value: "survival" },
        { label: "Creative", value: "creative" },
        { label: "Spectator", value: "spectator" }
    ],
    difficulty: [
        { label: "Peaceful", value: "peaceful" },
        { label: "Easy", value: "easy" },
        { label: "Normal", value: "normal" },
        { label: "Hard", value: "hard" }
    ],
    pvp: [
        { label: "Enabled", value: "true" },
        { label: "Disabled", value: "false" }
    ],
    hardcore: [
        { label: "Enabled", value: "true" },
        { label: "Disabled", value: "false" }
    ],
    'allow-nether': [
        { label: "Enabled", value: "true" },
        { label: "Disabled", value: "false" }
    ]
}
const Config = JSON.parse(FS.readFileSync(PATH.resolve("config", "db.json")));
const SERVER_IMAGE = "";
let logData = [];
let consoleData = [];
////   INICIO CODIGO ////
module.exports = {
    data: new SlashCommandBuilder()
        .setName("server")
        .setDescription("Gestiona el servidor de Minecraft.")
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    devOnly: false,
    execute: async (Client, Interaction) => {
        await Interaction.deferReply();    
        const AdminList = Config.MinecraftAdmins;
        const IsAdmin = AdminList.includes(Interaction.user.id);

        try {
            const ServerStatusResponse = await AXIOS.get(`${process.env.SERVER_URL}/status`);
            const mainPage = await statusPage(ServerStatusResponse.data, IsAdmin);

            const message = await Interaction.editReply(mainPage);
            
            const filter = (interaction) => interaction.user.id === Interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 60000 * 5 });

            collector.on("collect", async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();
                const updates = {};

                try {
                    if (buttonInteraction.customId === "start") {
                        const startResponse = await AXIOS.post(`${process.env.SERVER_URL}/start`);
                        const { status, pid } = startResponse.data;
                        logData.push({ type: "start", data: `Status-> ${status} | PID-> ${pid}` });
                        const updatedPage = await statusPage(startResponse.data, IsAdmin);
                        await Interaction.editReply(updatedPage);
                    }

                    if (buttonInteraction.customId === "stop") {
                        await AXIOS.post(`${process.env.SERVER_URL}/command`, { command: "save-all" })
                        await AXIOS.post(`${process.env.SERVER_URL}/command`, { command: "stop" });
                        logData.push({ type: "stop", data: { status: "Detenido" } });
                        const updatedPage = await statusPage({ status: "Apagado" }, IsAdmin);
                        await Interaction.editReply(updatedPage);
                    }

                    if (buttonInteraction.customId === "options") {
                        const optionsResponse = await AXIOS.get(`${process.env.SERVER_URL}/options`);
                        const updatedPage = await optionsPage(optionsResponse.data, IsAdmin);
                        await Interaction.editReply(updatedPage);
                    }

                    if (buttonInteraction.customId === "log") {
                        const updatedPage = await logPage(logData, IsAdmin);
                        await Interaction.editReply(updatedPage);
                    }

                    if (buttonInteraction.customId === "console") {
                        const consoleResponse = await AXIOS.get(`${process.env.SERVER_URL}/console`);
                        consoleData = consoleResponse.data.console && consoleResponse.data.console.length > 0
                            ? consoleResponse.data.console
                            : ["Sin datos disponibles."];
                        const updatedPage = await consolePage(consoleData, IsAdmin);
                        await Interaction.editReply(updatedPage);
                    }

                    if (buttonInteraction.customId === "status") {
                        const ServerStatusResponse = await AXIOS.get(`${process.env.SERVER_URL}/status`);
                        const updatedPage = await statusPage(ServerStatusResponse.data, IsAdmin);
                        await Interaction.editReply(updatedPage);
                    }

                    if (buttonInteraction.customId === "send_command" && IsAdmin) {
                        const command = buttonInteraction.fields.getTextInputValue("command_input");
                        await AXIOS.post(`${process.env.SERVER_URL}/command`, { command });
                        const updatedPage = await consolePage(consoleData, IsAdmin);
                        await Interaction.editReply(updatedPage);
                    }

                } catch (error) {
                    logger.error(`[BUTTON INTERACTION ERROR] ${error}`);
                    const errorEmbed = new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setTitle("Error")
                        .setDescription("Ocurrió un error al procesar tu solicitud.")
                        .setTimestamp();
                    await Interaction.editReply({ embeds: [errorEmbed], components: [] });
                    setTimeout(async ()=>{
                        const ServerStatusResponse = await AXIOS.get(`${process.env.SERVER_URL}/status`);
                        const updatedPage = await statusPage(ServerStatusResponse.data, IsAdmin);
                        Interaction.editReply(updatedPage);
                    }, 5000);
                }
            })

            collector.on("end", async () => {
                await createAnswer(Interaction, "", true, 1);
            });
        } catch(error) {
            logger.error(`[MC SERVER] ${error}`);
            const errorEmbed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle("Error en el Servidor")
            .setDescription("No se pudo obtener el estado del servidor.")
            .setTimestamp();
            await createAnswer(Interaction, errorEmbed, true, 5);
        }
    },
};
const statusPage = async (StatusData, IsAdmin) => {
    const { status, pid } = StatusData;
    ///
    const embed = new EmbedBuilder()
    .setColor(status === "Encendido" ? Colors.Green : Colors.Red)
    .setTitle("🌐 Acustic Server")
    .setDescription(`Estado actual: **${status}**`)
    .addFields(
        { name: "IP del Servidor ->", value: process.env.SERVER_IP && process.env.SERVER_IP !== "" ? process.env.SERVER_IP : "Sin Configurar.", inline: true},
        { name: "Jugadores Activos ->", value: "Obteniendo...", inline: true},
        { name: "PID del Servidor ->", value: pid ? pid.toString() : "Sin establecer.", inline: true}
    )
    .setFooter({ text: "Control del servidor"})
    .setTimestamp();

    if (SERVER_IMAGE && SERVER_IMAGE !== "") {
        embed.setThumbnail(SERVER_IMAGE);
    }
    const row = new ActionRowBuilder();
    row.addComponents(
        new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Iniciar")
        .setStyle("Success")
        .setDisabled(status === "Encendido")
    );

    if (IsAdmin) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("stop")
                .setLabel("Detener")
                .setStyle("Danger")
                .setDisabled(status !== "Encendido"),
            new ButtonBuilder()
                .setCustomId("options")
                .setLabel("Opciones")
                .setStyle("Secondary"),
            new ButtonBuilder()
                .setCustomId("log")
                .setLabel("Log")
                .setStyle("Secondary")
        );
    }

    row.addComponents(
        new ButtonBuilder()
            .setCustomId("console")
            .setLabel("Consola")
            .setStyle("Primary")
    );

    return { embeds: [embed], components: [row]};
}
const generateIds = async () => {
    const CustomIds = {};
    EditableOptions.forEach(Option => {
        CustomIds[`${Option}_input`] = Option;
        CustomIds[`${Option}_select`] = Option;
    })
    return CustomIds;
}
const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}
const EditableOptionsPages = chunkArray(EditableOptions, 3, currentPage = 0);
const optionsPage = async (OptionsData, IsAdmin) => {
    const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle("⚙️ Opciones del Servidor")
        .setDescription("Ajustes del servidor Minecraft:")
        .addFields(
            ...EditableOptions.map((key) => {
                const value = OptionsData[key] || "N/A";
                return {
                    name: key.replace(/_/g, ' ').replace(/-/g, ' ').toUpperCase(),
                    value: value.toString().length > 1024 
                        ? `${value.toString().substring(0, 1021)}...` 
                        : value.toString(),
                    inline: true
                };
            })
        )
        .setTimestamp();

    const rows = [];

    const navRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
        .setCustomId("status")
        .setLabel("Volver al status")
        .setStyle(ButtonStyle.Primary)
    )

    rows.push(navRow);

    return { embeds: [embed], components: rows };
};
const consolePage = async (ConsoleData, IsAdmin) => {
    const embed = new EmbedBuilder()
    .setColor(Colors.DarkGrey)
    .setTitle("📜 Consola del Servidor")
    .setDescription(
        "```" +
        ConsoleData.join("\n").substring(0,4000) +
        "```"
    )
    .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("status")
                .setLabel("Volver a Status")
                .setStyle("Primary")
        );

    if (IsAdmin) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("send_command_modal")
                .setLabel("Enviar Comando")
                .setStyle("Primary")
        );
    }

    return { embeds: [embed], components: [row] };
}
const logPage = async (LogData) => {
    const embed = new EmbedBuilder()
        .setColor(Colors.DarkGrey)
        .setTitle("📚 Log del Servidor")
        .setDescription(
            LogData.length
                ? "```" +
                  LogData.map((entry, index) => `[${index + 1}][${entry.type}] ${JSON.stringify(entry.data)}`).join("\n") +
                  "```"
                : "Sin registros disponibles."
        )
        .setTimestamp();

    const row = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId("status")
            .setLabel("Volver a Status")
            .setStyle("Primary")
    );

    return { embeds: [embed], components: [row] };
}

// SERVER RESPONSES HANDLER