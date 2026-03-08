import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import lang from '../configs/lang.js';

/**
 * Register global slash commands for the bot.
 * @param {string} token - Bot token.
 * @param {string} botId - Bot application ID.
 */
export async function registerCommands(token, botId) {
    const commands = [
        new SlashCommandBuilder()
            .setName('addaccount')
            .setDescription(lang.addAccountDescription)
            .setDMPermission(true),

        new SlashCommandBuilder()
            .setName('deleteaccount')
            .setDescription(lang.deleteAccountDescription)
            .setDMPermission(true)
            .addStringOption(option =>
                option
                    .setName('account_name')
                    .setDescription(lang.deleteAccountNameDescription)
                    .setRequired(true)
                    .setAutocomplete(true)
            ),

        new SlashCommandBuilder()
            .setName('listaccounts')
            .setDescription(lang.listAccountsDescription)
            .setDMPermission(true),

        new SlashCommandBuilder()
            .setName('checkin')
            .setDescription(lang.checkinDescription)
            .setDMPermission(true),
    ];

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log(lang.registeringCommands);
        await rest.put(
            Routes.applicationCommands(botId),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        console.log(lang.commandRegistered);
    } catch (error) {
        console.error(lang.commandRegisterError, error);
    }
}
