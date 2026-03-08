// Import Discord Lib
import { Client, GatewayIntentBits, Events, Partials, ActivityType } from 'discord.js';
// Import Utils
import { configManager } from './utils/configManager.js';
import { setupLockfile } from './utils/lockfile.js';
import { format } from './utils/formatLang.js';
import { Logger } from './utils/logger.js';
import { checkinAllUsers } from './utils/checkinManager.js';
import path from 'path';
import { fileURLToPath } from 'url';
// Import bot's events
import { HandleInteractionCreate } from './events/interactionCreate.js';
import { registerCommands } from './events/commands.js';
import { setBotConfig } from './events/commands/addAccount.js';
// Import language file
import lang from './configs/lang.js';


// Initialize logger
const logger = new Logger();

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load bot's config
const botConfig = await configManager.loadBotConfig();

// Share botConfig with addAccount command
setBotConfig(botConfig);

// Setup lockfile
setupLockfile(botConfig.botId, __dirname, lang);

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
    partials: [
        Partials.Channel,   // Required for DM-based interactions
    ],
    presence: {
        status: 'online',   // 'online' | 'idle' | 'dnd' | 'invisible'
        activities: [{
            name: 'Endfield Daily Check-in',
            type: ActivityType.Watching,
        }]
    }
});

// Register bot commands
await registerCommands(botConfig.token, botConfig.botId);

// Log bot online & start scheduler
client.once(Events.ClientReady, () => {
    console.log(format(lang.botOnline, { tag: client.user.tag }));

    // Start the daily check-in scheduler
    startCheckinScheduler(client, botConfig);
});

// Handle interactions
client.on(Events.InteractionCreate, async (interaction) => {
    const handler = new HandleInteractionCreate();
    await handler.handle(interaction);
});

// Login bot to Discord
client.login(botConfig.token);


// ===================== SCHEDULER =====================

/**
 * Start the auto check-in scheduler.
 * First run at the configured time, then every 6 hours.
 * Only sends DMs when there are new claims or errors (skips if already claimed).
 * @param {Client} client - Discord.js client.
 * @param {object} config - Bot configuration.
 */
function startCheckinScheduler(client, config) {
    const schedule = config.checkinSchedule ?? {};
    const targetHour = schedule.hour ?? 0;
    const targetMinute = schedule.minute ?? 5;
    const intervalHours = schedule.intervalHours ?? 6;

    const hour = String(targetHour).padStart(2, '0');
    const minute = String(targetMinute).padStart(2, '0');

    console.log(format(lang.schedulerStarted, { hour, minute }));

    const intervalMs = intervalHours * 60 * 60 * 1000;
    let schedulerStarted = false;

    // Check every 60 seconds for the first run at the target time
    const initialCheck = setInterval(async () => {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();

        if (currentHour === targetHour && currentMinute === targetMinute && !schedulerStarted) {
            schedulerStarted = true;
            clearInterval(initialCheck);

            // Run first check-in
            await runScheduledCheckin(client);

            // Then repeat every intervalHours
            setInterval(async () => {
                await runScheduledCheckin(client);
            }, intervalMs);
        }
    }, 60 * 1000);
}

/**
 * Execute a scheduled check-in run.
 * @param {Client} client - Discord.js client.
 */
async function runScheduledCheckin(client) {
    console.log(lang.runningScheduledCheckin);
    try {
        await checkinAllUsers(client);
    } catch (err) {
        console.error('Scheduled check-in error:', err);
    }
}


// ===================== ERROR HANDLING =====================

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [UnhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ [UncaughtException]', err);
});
