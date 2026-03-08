import { configManager } from '../../utils/configManager.js';

/**
 * Handle autocomplete interactions.
 * @param {import('discord.js').AutocompleteInteraction} interaction
 */
export async function handleAutocomplete(interaction) {
    const commandName = interaction.commandName;
    const focusedOption = interaction.options.getFocused(true);

    if (commandName === 'deleteaccount' && focusedOption.name === 'account_name') {
        const userId = interaction.user.id;
        const accounts = configManager.getUserAccounts(userId);
        const query = focusedOption.value.toLowerCase();

        const filtered = accounts
            .filter(a => a.accountName.toLowerCase().includes(query))
            .slice(0, 25)  // Discord max 25 choices
            .map(a => ({
                name: `${a.accountName} (${a.skGameRole})`,
                value: a.accountName
            }));

        await interaction.respond(filtered);
    }
}
