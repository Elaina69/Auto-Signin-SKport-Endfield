import { handleAddAccountCommand, handleAddAccountButton, handleAddAccountModal } from './commands/addAccount.js';
import { handleDeleteAccountCommand, handleDeleteAccountButton } from './commands/deleteAccount.js';
import { handleListAccountsCommand } from './commands/listAccounts.js';
import { handleCheckinCommand } from './commands/checkin.js';
import { handleAutocomplete } from './commands/autocomplete.js';
import lang from '../configs/lang.js';
import { format } from '../utils/formatLang.js';

export class HandleInteractionCreate {
    /**
     * Route all interactions to the appropriate handler.
     * @param {import('discord.js').Interaction} interaction
     */
    async handle(interaction) {
        try {
            // Slash commands
            if (interaction.isChatInputCommand()) {
                await this.handleCommand(interaction);
            }
            // Button interactions
            else if (interaction.isButton()) {
                await this.handleButton(interaction);
            }
            // Modal submissions
            else if (interaction.isModalSubmit()) {
                await this.handleModal(interaction);
            }
            // Autocomplete
            else if (interaction.isAutocomplete()) {
                await handleAutocomplete(interaction);
            }
        } catch (error) {
            console.error('Interaction error:', error);
            
            const errorMessage = format(lang.errorOccurred, { error: error.message });

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
            }
        }
    }

    /**
     * Handle slash commands.
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async handleCommand(interaction) {
        switch (interaction.commandName) {
            case 'addaccount':
                await handleAddAccountCommand(interaction);
                break;
            case 'deleteaccount':
                await handleDeleteAccountCommand(interaction);
                break;
            case 'listaccounts':
                await handleListAccountsCommand(interaction);
                break;
            case 'checkin':
                await handleCheckinCommand(interaction);
                break;
            default:
                await interaction.reply({ content: lang.unknownCommand, ephemeral: true });
        }
    }

    /**
     * Handle button interactions.
     * @param {import('discord.js').ButtonInteraction} interaction
     */
    async handleButton(interaction) {
        const customId = interaction.customId;

        if (customId === 'addaccount_open_modal') {
            await handleAddAccountButton(interaction);
        }
        else if (customId.startsWith('deleteaccount_confirm_')) {
            await handleDeleteAccountButton(interaction);
        }
        else if (customId.startsWith('deleteaccount_cancel_')) {
            await handleDeleteAccountButton(interaction);
        }
    }

    /**
     * Handle modal submissions.
     * @param {import('discord.js').ModalSubmitInteraction} interaction
     */
    async handleModal(interaction) {
        const customId = interaction.customId;

        if (customId === 'addaccount_modal') {
            await handleAddAccountModal(interaction);
        }
    }
}
