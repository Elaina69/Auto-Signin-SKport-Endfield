import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from 'discord.js';
import { configManager } from '../../utils/configManager.js';
import { format } from '../../utils/formatLang.js';
import lang from '../../configs/lang.js';

/**
 * Handle /deleteaccount slash command — shows confirmation.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function handleDeleteAccountCommand(interaction) {
    const userId = interaction.user.id;
    const accountName = interaction.options.getString('account_name');

    // Check if user has any accounts
    const accounts = configManager.getUserAccounts(userId);
    if (accounts.length === 0) {
        await interaction.reply({
            content: lang.deleteAccountNoAccounts,
            ephemeral: true
        });
        return;
    }

    // Check if the specified account exists
    const account = accounts.find(a => a.accountName.toLowerCase() === accountName.toLowerCase());
    if (!account) {
        await interaction.reply({
            content: format(lang.deleteAccountNotFound, { accountName }),
            ephemeral: true
        });
        return;
    }

    // Show confirmation
    const embed = new EmbedBuilder()
        .setTitle(lang.deleteAccountConfirmTitle)
        .setDescription(format(lang.deleteAccountConfirmDescription, { accountName: account.accountName }))
        .setColor(0xED4245)  // Red
        .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`deleteaccount_confirm_${account.accountName}`)
            .setLabel(lang.deleteAccountConfirmYes)
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`deleteaccount_cancel_${account.accountName}`)
            .setLabel(lang.deleteAccountConfirmNo)
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
        embeds: [embed],
        components: [buttons],
        ephemeral: true
    });
}

/**
 * Handle delete confirmation/cancel button clicks.
 * @param {import('discord.js').ButtonInteraction} interaction
 */
export async function handleDeleteAccountButton(interaction) {
    const userId = interaction.user.id;
    const customId = interaction.customId;

    if (customId.startsWith('deleteaccount_confirm_')) {
        const accountName = customId.replace('deleteaccount_confirm_', '');

        const deleted = configManager.deleteAccount(userId, accountName);
        if (deleted) {
            await interaction.update({
                content: format(lang.deleteAccountSuccess, { accountName }),
                embeds: [],
                components: []
            });
        } else {
            await interaction.update({
                content: format(lang.deleteAccountNotFound, { accountName }),
                embeds: [],
                components: []
            });
        }
    }
    else if (customId.startsWith('deleteaccount_cancel_')) {
        await interaction.update({
            content: lang.deleteAccountCancelled,
            embeds: [],
            components: []
        });
    }
}
