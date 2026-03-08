import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import lang from '../configs/lang.js';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configDir = path.join(__dirname, '../configs');
const botConfigFile = path.join(configDir, 'botConfig.json');
const accountsFile = path.join(configDir, 'accounts.json');

// Max accounts per user
const MAX_ACCOUNTS_PER_USER = 10;

class ConfigManager {
    constructor() {
        // Ensure configs directory exists
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    }

    /**
     * Asks a question in the console and returns the answer.
     * @param {string} query - The question to ask.
     * @returns {Promise<string>} - The answer provided by the user.
     */
    async askQuestion(query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => rl.question(query, ans => {
            rl.close();
            resolve(ans);
        }));
    }

    /**
     * Check if debug mode is enabled in botConfig.
     * @returns {boolean}
     */
    isDebug() {
        if (fs.existsSync(botConfigFile)) {
            const config = JSON.parse(fs.readFileSync(botConfigFile, 'utf8'));
            return !!config.debug;
        }
        return false;
    }

    // Load bot configuration from file
    async loadBotConfig() {
        if (fs.existsSync(botConfigFile)) {
            const config = JSON.parse(fs.readFileSync(botConfigFile, 'utf8'));

            // Migrate legacy flat schedule fields to nested checkinSchedule
            if (!config.checkinSchedule) {
                config.checkinSchedule = {
                    hour: config.checkinHour ?? 0,
                    minute: config.checkinMinute ?? 5,
                    intervalHours: 6
                };
                delete config.checkinHour;
                delete config.checkinMinute;
                fs.writeFileSync(botConfigFile, JSON.stringify(config, null, 4));
            }

            return config;
        } 
        else {
            console.log(lang.noBotConfigFile);

            const token = await this.askQuestion(lang.askToken);
            const botId = await this.askQuestion(lang.askBotId);
            const checkinHour = await this.askQuestion(lang.askCheckinHour);
            const checkinMinute = await this.askQuestion(lang.askCheckinMinute);

            const botConfig = {
                token: token.trim(),
                botId: botId.trim(),
                checkinSchedule: {
                    hour: parseInt(checkinHour.trim()) || 0,
                    minute: parseInt(checkinMinute.trim()) || 5,
                    intervalHours: 6
                },
                debug: false,
            };

            fs.writeFileSync(botConfigFile, JSON.stringify(botConfig, null, 4));
            console.log(lang.savedBotConfig);

            return botConfig;
        }
    }

    // ===================== Account Management =====================

    /**
     * Load all accounts from file.
     * @returns {object} - Accounts keyed by Discord user ID.
     */
    loadAccounts() {
        if (fs.existsSync(accountsFile)) {
            return JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
        } 
        else {
            this.saveAccounts({});
            return {};
        }
    }

    /**
     * Save all accounts to file.
     * @param {object} accounts - Accounts object to save.
     */
    saveAccounts(accounts) {
        fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 4));
    }

    /**
     * Get accounts for a specific Discord user.
     * @param {string} userId - Discord user ID.
     * @returns {Array} - Array of account objects.
     */
    getUserAccounts(userId) {
        const accounts = this.loadAccounts();
        return accounts[userId] || [];
    }

    /**
     * Add an account for a Discord user.
     * @param {string} userId - Discord user ID.
     * @param {object} account - Account object to add.
     * @returns {{ success: boolean, message: string }}
     */
    addAccount(userId, account) {
        const accounts = this.loadAccounts();
        if (!accounts[userId]) accounts[userId] = [];

        // Check max accounts
        if (accounts[userId].length >= MAX_ACCOUNTS_PER_USER) {
            return { success: false, message: 'max_reached' };
        }

        // Check duplicate name
        const exists = accounts[userId].some(a => a.accountName.toLowerCase() === account.accountName.toLowerCase());
        if (exists) {
            return { success: false, message: 'name_exists' };
        }

        accounts[userId].push(account);
        this.saveAccounts(accounts);
        return { success: true };
    }

    /**
     * Delete an account for a Discord user.
     * @param {string} userId - Discord user ID.
     * @param {string} accountName - Name of the account to delete.
     * @returns {boolean} - True if deleted, false if not found.
     */
    deleteAccount(userId, accountName) {
        const accounts = this.loadAccounts();
        if (!accounts[userId]) return false;

        const index = accounts[userId].findIndex(a => a.accountName.toLowerCase() === accountName.toLowerCase());
        if (index === -1) return false;

        accounts[userId].splice(index, 1);

        // Remove user entry if no accounts left
        if (accounts[userId].length === 0) {
            delete accounts[userId];
        }

        this.saveAccounts(accounts);
        return true;
    }

    /**
     * Update the token for a specific account.
     * @param {string} userId - Discord user ID.
     * @param {string} accountName - Account name.
     * @param {string} newToken - New token value.
     */
    updateAccountToken(userId, accountName, newToken) {
        const accounts = this.loadAccounts();
        if (!accounts[userId]) return;

        const account = accounts[userId].find(a => a.accountName === accountName);
        if (account) {
            account.token = newToken;
            this.saveAccounts(accounts);
        }
    }

    /**
     * Get all accounts across all users (for scheduled check-in).
     * @returns {Array<{ userId: string, account: object }>}
     */
    getAllAccounts() {
        const accounts = this.loadAccounts();
        const result = [];

        for (const [userId, userAccounts] of Object.entries(accounts)) {
            for (const account of userAccounts) {
                result.push({ userId, account });
            }
        }

        return result;
    }

    /**
     * Get max accounts per user limit.
     * @returns {number}
     */
    getMaxAccountsPerUser() {
        return MAX_ACCOUNTS_PER_USER;
    }
}

export const configManager = new ConfigManager();
