import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder
} from 'discord.js';
import { configManager } from '../../utils/configManager.js';
import { format } from '../../utils/formatLang.js';
import lang from '../../configs/lang.js';
import { checkinUser, buildResultEmbed } from '../../utils/checkinManager.js';

// Store botConfig reference (set from index.js)
let botConfig = null;
export function setBotConfig(config) {
    botConfig = config;
}

/**
 * Handle /addaccount slash command — shows guide + button to open modal.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function handleAddAccountCommand(interaction) {
    const embed = new EmbedBuilder()
        .setTitle(lang.addAccountGuideTitle)
        .setDescription(lang.addAccountGuideDescription)
        .setColor(0x5865F2)  // Discord Blurple
        .setTimestamp();

    const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('addaccount_open_modal')
            .setLabel(lang.addAccountButtonLabel)
            .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
        embeds: [embed],
        components: [button],
        ephemeral: true
    });
}

/**
 * Handle the "Open Form" button click — shows the registration modal.
 * @param {import('discord.js').ButtonInteraction} interaction
 */
export async function handleAddAccountButton(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('addaccount_modal')
        .setTitle(lang.addAccountModalTitle);

    const accountNameInput = new TextInputBuilder()
        .setCustomId('accountName')
        .setLabel(lang.addAccountModalAccountName)
        .setPlaceholder(lang.addAccountModalAccountNamePh)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(32);

    const credInput = new TextInputBuilder()
        .setCustomId('cred')
        .setLabel(lang.addAccountModalCred)
        .setPlaceholder(lang.addAccountModalCredPh)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const skGameRoleInput = new TextInputBuilder()
        .setCustomId('skGameRole')
        .setLabel(lang.addAccountModalSkGameRole)
        .setPlaceholder(lang.addAccountModalSkGameRolePh)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const discordIdInput = new TextInputBuilder()
        .setCustomId('discordId')
        .setLabel(lang.addAccountModalDiscordId)
        .setPlaceholder(lang.addAccountModalDiscordIdPh)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(accountNameInput),
        new ActionRowBuilder().addComponents(credInput),
        new ActionRowBuilder().addComponents(skGameRoleInput),
        new ActionRowBuilder().addComponents(discordIdInput)
    );

    await interaction.showModal(modal);
}

/**
 * Handle modal submission — saves the account.
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
export async function handleAddAccountModal(interaction) {
    const userId = interaction.user.id;

    const accountName = interaction.fields.getTextInputValue('accountName').trim();
    const cred = interaction.fields.getTextInputValue('cred').trim();
    const skGameRole = interaction.fields.getTextInputValue('skGameRole').trim();
    const discordId = interaction.fields.getTextInputValue('discordId')?.trim() || userId;

    const account = {
        accountName,
        cred,
        skGameRole,
        token: "",
        platform: "3",
        vName: "1.0.0",
        discordId
    };

    const result = configManager.addAccount(userId, account);

    if (!result.success) {
        if (result.message === 'name_exists') {
            await interaction.reply({
                content: format(lang.addAccountNameExists, { accountName }),
                ephemeral: true
            });
        } else if (result.message === 'max_reached') {
            await interaction.reply({
                content: format(lang.addAccountMaxReached, { max: configManager.getMaxAccountsPerUser() }),
                ephemeral: true
            });
        }
        return;
    }

    const hour = String(botConfig?.checkinSchedule?.hour ?? 0).padStart(2, '0');
    const minute = String(botConfig?.checkinSchedule?.minute ?? 5).padStart(2, '0');

    await interaction.deferReply({ ephemeral: true });

    // Run check-in immediately for the new account
    const results = await checkinUser(userId);
    const embed = buildResultEmbed(results);

    const hasError = results.some(r => !r.success);
    const replyPayload = {
        content: format(lang.addAccountSuccess, { accountName, hour, minute }),
        embeds: [embed]
    };

    if (hasError) {
        replyPayload.content += '\n' + lang.checkinErrorNotify;
    }

    await interaction.editReply(replyPayload);
}
