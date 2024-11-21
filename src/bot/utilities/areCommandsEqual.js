module.exports = function areCommandsEqual(existingCommand, localCommand) {
    const equalChoices = () => {
        const existingChoices = (existingCommand.options?.choices || []);
        const localChoices = (localCommand.options?.choices || []);
        for (const localChoice of localChoices) {
            const existingChoice = existingChoices.find(choice => choice.name === localChoice.name);
            const sameChoice = (localChoice.value === existingChoice?.value);
            if (!existingChoice || !sameChoice) {
                return false;
            }
        }
        return true;
    };

    const equalOptions = () => {
        const existingOptions = (existingCommand.options || []);
        const localOptions = (localCommand.options || []);
        for (const localOption of localOptions) {
            const existingOption = existingOptions.find(option => option.name === localOption.name);
            const sameOptionData = (
                localOption.description === existingOption?.description &&
                localOption.type === existingOption?.type &&
                (localOption.required || false) === (existingOption?.required || false) &&
                (localOption.choices?.length || 0) === (existingOption?.choices?.length || 0) &&
                equalChoices()
            );
            if (!existingOption || !sameOptionData) {
                return false;
            }
        }
        return true;
    };

    const sameCommandData = (
        existingCommand.description === localCommand.description &&
        existingCommand.options?.length === (localCommand.options?.length || 0) &&
        equalOptions()
    );

    return sameCommandData;
};
