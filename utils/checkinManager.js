import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { configManager } from './configManager.js';
import { format } from './formatLang.js';
import lang from '../configs/lang.js';
import { EmbedBuilder } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load rewards mapping from rewards.json
const rewardsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../configs/rewards.json'), 'utf8'));
const rewardsMap = new Map(rewardsData.filter(r => r.id).map(r => [r.id, r.name]));

class CheckinManager {
    static URLS = {
        refresh: 'https://zonai.skport.com/web/v1/auth/refresh',
        attendance: 'https://zonai.skport.com/web/v1/game/endfield/attendance'
    };

    constructor() {
        this.cache = new Map();
        this.cacheResetHour = 16;
        this.cacheResetMinute = 1;
    }

    /**
     * Set the cache reset time from bot config schedule.
     * @param {number} hour - UTC hour for daily reset.
     * @param {number} minute - UTC minute for daily reset.
     */
    setCacheResetTime(hour, minute) {
        this.cacheResetHour = hour;
        this.cacheResetMinute = minute;
    }

    /**
     * Get current cache period identifier based on config schedule time.
     * Period changes at the configured hour:minute UTC, not at midnight.
     * @returns {string} - ISO timestamp of current period start.
     */
    getCachePeriod() {
        const now = new Date();
        const todayReset = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
            this.cacheResetHour, this.cacheResetMinute, 0, 0
        ));

        const periodStart = now >= todayReset
            ? todayReset
            : new Date(todayReset.getTime() - 24 * 60 * 60 * 1000);

        return periodStart.toISOString();
    }

    /**
     * Resolve a reward name from its award ID using rewards.json.
     * @param {string} awardId - Full award ID from API response.
     * @returns {string} - Reward name or raw awardId if not found.
     */
    getRewardName(awardId) {
        const parts = awardId.split('_');
        const baseId = parts.slice(0, -1).join('_');
        return rewardsMap.get(baseId) || awardId;
    }

    /**
     * Generate sign for the API request (HMAC-SHA256 -> MD5).
     * @param {string} apiPath - API path.
     * @param {string} body - Request body.
     * @param {string} timestamp - Unix timestamp string.
     * @param {string} token - Auth token.
     * @param {string} platform - Platform ID.
     * @param {string} vName - Version name.
     * @returns {string} - Hex signature.
     */
    generateSign(apiPath, body, timestamp, token, platform, vName) {
        let str = apiPath + body + timestamp;
        const headerJson = `{"platform":"${platform}","timestamp":"${timestamp}","dId":"","vName":"${vName}"}`;
        str += headerJson;

        const hmac = crypto.createHmac('sha256', token).update(str).digest('hex');
        const md5 = crypto.createHash('md5').update(hmac).digest('hex');
        return md5;
    }

    /**
     * Refresh the authentication token for a profile.
     * @param {object} profile - Account profile.
     * @returns {Promise<string>} - New token.
     */
    async refreshToken(profile) {
        const { cred, platform, vName } = profile;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'cred': cred,
            'platform': platform,
            'vName': vName,
            'Origin': 'https://game.skport.com',
            'Referer': 'https://game.skport.com/'
        };

        const response = await fetch(CheckinManager.URLS.refresh, {
            method: 'GET',
            headers
        });

        const json = await response.json();

        if (configManager.isDebug()) {
            console.log(format(lang.debugRefreshResponse, { accountName: profile.accountName || 'unknown' }));
            console.log(JSON.stringify(json, null, 2));
        }

        if (json.code === 0 && json.data && json.data.token) {
            return json.data.token;
        } else {
            throw new Error(`Refresh Failed (Code: ${json.code}, Msg: ${json.message})`);
        }
    }

    /**
     * Perform check-in (attendance claim) for a profile.
     * @param {object} profile - Account profile with valid token.
     * @returns {Promise<object>} - Result object.
     */
    async performCheckin(profile) {
        const { cred, token, skGameRole, platform, vName, accountName } = profile;

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const apiPath = "/web/v1/game/endfield/attendance";
        const body = "";

        const sign = this.generateSign(apiPath, body, timestamp, token, platform, vName);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'sk-language': 'en_US',
            'sk-game-role': skGameRole,
            'cred': cred,
            'platform': platform,
            'vName': vName,
            'timestamp': timestamp,
            'sign': sign,
            'Origin': 'https://game.skport.com',
            'Referer': 'https://game.skport.com/'
        };

        let result = {
            name: accountName,
            success: false,
            status: "",
            rewards: "",
            rewardIcon: null
        };

        try {
            if (configManager.isDebug()) {
                console.log(format(lang.debugSignParams, { accountName, path: apiPath, timestamp, sign }));
            }

            const response = await fetch(CheckinManager.URLS.attendance, {
                method: 'POST',
                headers,
                body: body || undefined
            });

            const json = await response.json();

            console.log(format(lang.checkinApiResponse, { accountName, code: json.code }));

            if (configManager.isDebug()) {
                console.log(format(lang.debugAttendanceResponse, { accountName }));
                console.log(JSON.stringify(json, null, 2));
            }

            if (json.code === 0) {
                result.success = true;
                result.status = lang.checkinSuccess;

                if (json.data && json.data.awardIds) {
                    const awards = json.data.awardIds.map(award => {
                        const resource = json.data.resourceInfoMap ? json.data.resourceInfoMap[award.id] : null;
                        return {
                            name: this.getRewardName(award.id),
                            count: resource?.count ?? 1,
                            icon: resource?.icon || null
                        };
                    });
                    result.rewards = awards.map(a => `${a.name} x${a.count}`).join('\n');
                    result.rewardIcon = awards.find(a => a.icon)?.icon || null;
                } else {
                    result.rewards = lang.checkinNoRewardInfo;
                }

            } else if (json.code === 10001) {
                result.success = true;
                result.alreadyClaimed = true;
                result.status = lang.checkinAlreadyDone;
                result.rewards = lang.checkinNothingToClaim;
            } else {
                result.success = false;
                result.status = format(lang.checkinError, { code: json.code });
                result.rewards = json.message || "Unknown Error";
            }
        } catch (error) {
            result.success = false;
            result.status = lang.checkinException;
            result.rewards = error.message;
            console.error(error);
        }

        return result;
    }

    /**
     * Run check-in for a single account.
     * @param {string} userId - Discord user ID (owner of the account).
     * @param {object} account - Account object.
     * @returns {Promise<object>} - Check-in result.
     */
    async checkinAccount(userId, account) {
        const cacheKey = `${userId}:${account.accountName}`;
        const period = this.getCachePeriod();
        const cached = this.cache.get(cacheKey);

        if (cached && cached.period === period) {
            console.log(format(lang.checkinSkippedCached, { accountName: account.accountName }));
            return { ...cached.result, alreadyClaimed: true };
        }

        const profile = {
            cred: account.cred,
            token: account.token || "",
            skGameRole: account.skGameRole,
            platform: account.platform || "3",
            vName: account.vName || "1.0.0",
            accountName: account.accountName
        };

        try {
            const newToken = await this.refreshToken(profile);
            profile.token = newToken;
            console.log(format(lang.checkinTokenRefreshed, { accountName: profile.accountName }));

            configManager.updateAccountToken(userId, account.accountName, newToken);

            const result = await this.performCheckin(profile);

            if (result.success) {
                this.cache.set(cacheKey, { period, result });
            }

            return result;

        } catch (e) {
            console.error(format(lang.checkinTokenRefreshFailed, { accountName: profile.accountName, message: e.message }));
            return {
                name: profile.accountName,
                success: false,
                status: lang.checkinAuthFailed,
                rewards: format(lang.checkinUpdateCred, { message: e.message })
            };
        }
    }

    /**
     * Run check-in for all accounts of a specific user.
     * @param {string} userId - Discord user ID.
     * @returns {Promise<Array>} - Array of check-in results.
     */
    async checkinUser(userId) {
        const userAccounts = configManager.getUserAccounts(userId);
        const results = [];

        for (const account of userAccounts) {
            const result = await this.checkinAccount(userId, account);
            results.push(result);
            await this.sleep(1000);
        }

        return results;
    }

    /**
     * Run check-in for ALL registered users.
     * @param {import('discord.js').Client} client - Discord.js client for sending DMs.
     */
    async checkinAllUsers(client) {
        const allAccounts = configManager.getAllAccounts();

        if (allAccounts.length === 0) {
            console.log(lang.noAccountsToCheckin);
            return;
        }

        const userMap = new Map();
        for (const { userId, account } of allAccounts) {
            if (!userMap.has(userId)) userMap.set(userId, []);
            userMap.get(userId).push(account);
        }

        for (const [userId, accounts] of userMap) {
            const results = [];

            for (const account of accounts) {
                const result = await this.checkinAccount(userId, account);
                results.push(result);
                await this.sleep(1000);
            }

            const allAlreadyClaimed = results.every(r => r.success && r.alreadyClaimed);
            const hasError = results.some(r => !r.success);

            if (allAlreadyClaimed) {
                console.log(lang.scheduledCheckinAllClaimed);
                continue;
            }

            try {
                const notifyId = accounts[0]?.discordId || userId;
                const user = await client.users.fetch(notifyId);
                const embed = this.buildResultEmbed(results);

                const messagePayload = { embeds: [embed] };

                if (hasError) {
                    messagePayload.content = lang.checkinErrorNotify;
                }

                await user.send(messagePayload);
            } catch (err) {
                console.error(format(lang.checkinDmFailed, { userId, error: err.message }));
            }
        }

        console.log(format(lang.scheduledCheckinComplete, { count: userMap.size }));
    }

    /**
     * Build a Discord embed from check-in results.
     * @param {Array} results - Array of check-in result objects.
     * @returns {EmbedBuilder}
     */
    buildResultEmbed(results) {
        const allSuccess = results.every(r => r.success);
        const embedColor = allSuccess ? 0x57F287 : 0xED4245;

        const fields = results.map(r => ({
            name: format(lang.checkinAccountField, { accountName: r.name }),
            value: `**Status:** ${r.status}\n**Rewards:**\n${r.rewards || 'None'}`,
            inline: true
        }));

        const embed = new EmbedBuilder()
            .setTitle(lang.checkinReportTitle)
            .setColor(embedColor)
            .addFields(fields)
            .setFooter({
                text: `Time: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} (UTC)`,
                iconURL: 'https://assets.skport.com/assets/favicon.ico'
            })
            .setTimestamp();

        const firstIcon = results.find(r => r.rewardIcon)?.rewardIcon;
        if (firstIcon) {
            embed.setThumbnail(firstIcon);
        }

        return embed;
    }

    /**
     * Sleep helper for rate limiting.
     * @param {number} ms - Milliseconds to sleep.
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const checkinManager = new CheckinManager();
