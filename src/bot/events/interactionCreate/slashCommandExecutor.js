////   DEPENDENCIAS  ////
require("dotenv").config();
const PATH = require("path");
const AXIOS = require("axios");
const commandExecutor = require(PATH.resolve("src","bot","commandExecutor.js"));
const { logger, createAnswer } = require(PATH.resolve("src", "bot", "utilities", "utilities.js"));
////   INICIO CODIGO ////
module.exports = async (Client, Interaction) => {
    try {
        if (Interaction.isChatInputCommand()){
            await commandExecutor(Client, Interaction);
        } else if (Interaction.isAutocomplete()) {
            const Command = Client.Commands.get(Interaction.commandName);
    
            if (Command) {
                try {
                    await Command.autocomplete(Client, Interaction);
                } catch (error) {
                    logger.error(`[AUTOCOMPLETE] ${error}`);
                    Interaction.respond([{name: "Sin resultados", value: "NO_RESULTS"}])
                }
             } else {
                logger.error(`[AUTOCOMPLETE] No se encontro un comando llamada: ${Interaction.commandName}.`);
                return;
            }
        } else if (Interaction.isModalSubmit()) {
            const option = Interaction.customId.replace("_modal", "");
            const value = Interaction.fields.getTextInputValue(`${option}_value`);
    
            try {
                const updates = { [option]: value};
                const response = await AXIOS.post(`${process.env.SERVER_URL}/options`, updates);
                const optionsResponse = await AXIOS.get(`${process.env.SERVER_URL}/options`);
                const updatedPage = await optionsPage(optionsResponse.data, IsAdmin);
    
                await Interaction.reply(updatedPage);
            } catch(error) {
                logger.error(`[MODAL SUBMIT] ${error}`);
                await createAnswer(Interaction,  "Error al actualizar la opcion", true, 5);
            }
        }
    } catch (error) {
        logger.error(`[SLASH COMM] ${error}`);
    }
}