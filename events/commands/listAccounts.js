import { EmbedBuilder } from 'discord.js';
import { configManager } from '../../utils/configManager.js';
import { format } from '../../utils/formatLang.js';
import lang from '../../configs/lang.js';

/**
 * Handle /listaccounts slash command — shows all registered accounts.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function handleListAccountsCommand(interaction) {
    const userId = interaction.user.id;
    const accounts = configManager.getUserAccounts(userId);

    if (accounts.length === 0) {
        await interaction.reply({
            content: lang.listAccountsEmpty,
            ephemeral: true
        });
        return;
    }

    const description = accounts.map((acc, i) =>
        format(lang.listAccountsEntry, {
            index: i + 1,
            accountName: acc.accountName,
            skGameRole: acc.skGameRole,
            discordId: acc.discordId || userId
        })
    ).join('\n\n');

    const embed = new EmbedBuilder()
        .setTitle(lang.listAccountsTitle)
        .setDescription(description)
        .setColor(0x5865F2)
        .setFooter({ text: `Total: ${accounts.length}/${configManager.getMaxAccountsPerUser()}` })
        .setTimestamp();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}
