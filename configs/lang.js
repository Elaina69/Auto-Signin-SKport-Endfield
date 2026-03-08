export default {
    // index.js
    botOnline                       : "Bot online as: {tag}",
    schedulerStarted                : "⏰ Check-in scheduler started (first run at {hour}:{minute} UTC, then every 6 hours)",
    runningScheduledCheckin         : "⏰ Running scheduled check-in...",
    scheduledCheckinComplete        : "✅ Scheduled check-in completed for {count} user(s)",
    scheduledCheckinAllClaimed      : "👌 All accounts already checked in, skipping DMs",
    noAccountsToCheckin             : "📭 No accounts registered for check-in",

    // utils/configManager.js
    noBotConfigFile                 : "⚙️ Bot config does not exist, please provide the following information:",
    askToken                        : "👉 Enter bot token (String): ",
    askBotId                        : "👉 Enter bot ID (String): ",
    askCheckinHour                  : "👉 Enter daily check-in hour (0-23, UTC, default 0): ",
    askCheckinMinute                : "👉 Enter daily check-in minute (0-59, default 5): ",
    savedBotConfig                  : "✅ Bot config saved to configs/botConfig.json",

    // utils/lockfile.js
    duplicatedLockFile              : "[WARN] Found old lock file (pid={oldPid}), process no longer exists. Deleting lock file and restarting.",
    lockFileInUse                   : "[ERROR] Bot with botId {botId} is already running (pid={oldPid}).",

    // events/commands.js
    registeringCommands             : "Registering GLOBAL slash commands...",
    commandRegistered               : "✅ Slash commands registered globally.",
    commandRegisterError            : "Failed to register slash commands: ",

    // Command descriptions
    addAccountDescription           : "Add a new Endfield game account for daily auto check-in.",
    deleteAccountDescription        : "Delete a registered Endfield game account.",
    deleteAccountNameDescription    : "Name of the account to delete.",
    listAccountsDescription         : "View all your registered Endfield accounts.",
    checkinDescription              : "Manually trigger check-in for all your accounts now.",

    // events/commands/addAccount.js
    addAccountGuideTitle            : "📋 Add Endfield Account",
    addAccountGuideDescription      : "📖 **[Click here for a detailed guide on how to find cred & skGameRole](https://gist.github.com/cptmacp/1e9a9f20f69c113a0828fea8d13cb34c?permalink_comment_id=5959869#gistcomment-5959869)**",
    addAccountButtonLabel           : "📝 Open Registration Form",
    addAccountModalTitle            : "Add Endfield Account",
    addAccountModalAccountName      : "Account Name (nickname)",
    addAccountModalAccountNamePh    : "e.g. Main Account",
    addAccountModalCred             : "Cred (from browser Network tab)",
    addAccountModalCredPh           : "Paste your cred string here",
    addAccountModalSkGameRole       : "skGameRole (Platform_UserID_Server)",
    addAccountModalSkGameRolePh     : "e.g. 3_4760396803_2",
    addAccountModalDiscordId        : "Discord ID for notifications",
    addAccountModalDiscordIdPh      : "Your Discord User ID (leave empty = your ID)",
    addAccountSuccess               : "✅ Account **{accountName}** has been added successfully!\n\n🔄 The bot will automatically check-in daily at **{hour}:{minute} UTC**.\nYou can also use `/checkin` to trigger it manually.",
    addAccountNameExists            : "⚠️ You already have an account named **{accountName}**. Please use a different name.",
    addAccountMaxReached            : "⚠️ You can register up to **{max}** accounts maximum.",

    // events/commands/deleteAccount.js
    deleteAccountNotFound           : "❌ Account **{accountName}** not found. Use `/listaccounts` to see your accounts.",
    deleteAccountConfirmTitle       : "🗑️ Confirm Account Deletion",
    deleteAccountConfirmDescription : "Are you sure you want to delete the account **{accountName}**?\n\nThis will remove all stored credentials and stop automatic check-ins for this account.\n\n⚠️ **This action cannot be undone.**",
    deleteAccountConfirmYes         : "Yes, Delete",
    deleteAccountConfirmNo          : "Cancel",
    deleteAccountSuccess            : "✅ Account **{accountName}** has been deleted successfully.",
    deleteAccountCancelled          : "❌ Account deletion cancelled.",
    deleteAccountExpired            : "⏰ Confirmation expired. Please run the command again if you still want to delete.",
    deleteAccountNoAccounts         : "📭 You don't have any registered accounts. Use `/addaccount` to add one.",

    // events/commands/listAccounts.js
    listAccountsTitle               : "📋 Your Registered Accounts",
    listAccountsEmpty               : "📭 You don't have any registered accounts.\nUse `/addaccount` to add your first account.",
    listAccountsEntry               : "**{index}. {accountName}**\n└ Role: `{skGameRole}` | Notify: <@{discordId}>",

    // events/commands/checkin.js
    checkinStarted                  : "🔄 Running check-in for your accounts...",
    checkinNoAccounts               : "📭 You don't have any registered accounts. Use `/addaccount` to add one.",

    // utils/checkinManager.js
    checkinReportTitle              : "📡 Endfield Daily Check-in Report",
    checkinAccountField             : "👤 {accountName}",
    checkinSuccess                  : "✅ Check-in Successful",
    checkinAlreadyDone              : "👌 Already Checked In",
    checkinError                    : "❌ Error (Code: {code})",
    checkinAuthFailed               : "⛔ Auth/Refresh Failed",
    checkinException                : "💥 Exception",
    checkinUpdateCred               : "Please update your 'cred': {message}",
    checkinNoRewardInfo             : "No detailed reward info.",
    checkinNothingToClaim           : "Nothing to claim",
    checkinSkippedCached            : "[{accountName}] Already claimed today, skipping API call.",
    checkinTokenRefreshed           : "[{accountName}] Token refreshed successfully.",
    checkinTokenRefreshFailed       : "[{accountName}] Token refresh failed: {message}",
    checkinApiResponse              : "[{accountName}] API Response Code: {code}",
    checkinDmFailed                 : "⚠️ Could not send DM to user {userId}: {error}",
    checkinErrorNotify              : "⚠️ Check-in encountered errors, please check your credentials!",
    debugRefreshResponse            : "[DEBUG][{accountName}] Refresh API response:",
    debugAttendanceResponse         : "[DEBUG][{accountName}] Attendance API response:",
    debugSignParams                 : "[DEBUG][{accountName}] Sign params — path: {path}, timestamp: {timestamp}, sign: {sign}",

    // General
    notYourButton                   : "❌ This interaction is not for you.",
    unknownCommand                  : "❌ Unknown command.",
    errorOccurred                   : "❌ An error occurred: {error}",
};
