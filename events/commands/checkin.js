import { configManager } from '../../utils/configManager.js';
import { checkinUser, buildResultEmbed } from '../../utils/checkinManager.js';
import lang from '../../configs/lang.js';

/**
 * Handle /checkin slash command — manually trigger check-in for all user accounts.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function handleCheckinCommand(interaction) {
    const userId = interaction.user.id;
    const accounts = configManager.getUserAccounts(userId);

    if (accounts.length === 0) {
        await interaction.reply({
            content: lang.checkinNoAccounts,
            ephemeral: true
        });
        return;
    }

    // Defer reply since check-in may take a while
    await interaction.deferReply({ ephemeral: true });

    // Run check-in for all user accounts
    const results = await checkinUser(userId);

    // Build and send result embed
    const embed = buildResultEmbed(results);

    const hasError = results.some(r => !r.success);
    const replyPayload = { embeds: [embed] };

    if (hasError) {
        replyPayload.content = lang.checkinErrorNotify;
    }

    await interaction.editReply(replyPayload);
}
