import fs from 'fs';
import path from 'path';
import { format } from './formatLang.js';

class LockfileManager {
    constructor() {
        this.lockFilePath = null;
    }

    /**
     * Check if a process with the given PID is still running.
     * @param {number} pid - Process ID to check.
     * @returns {boolean}
     */
    isProcessRunning(pid) {
        try {
            process.kill(pid, 0);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Sets up a lock file for the bot process.
     * @param {string} botId - The ID of the bot.
     * @param {string} dir - The directory to store the lock file.
     * @param {object} lang - The language pack.
     */
    setup(botId, dir, lang) {
        this.lockFilePath = path.join(dir, `${botId}.lock`);

        if (fs.existsSync(this.lockFilePath)) {
            const oldPid = parseInt(fs.readFileSync(this.lockFilePath, "utf-8"), 10);

            if (isNaN(oldPid) || !this.isProcessRunning(oldPid)) {
                console.warn(format(lang.duplicatedLockFile, { oldPid }));
                fs.unlinkSync(this.lockFilePath);
            } else {
                console.error(format(lang.lockFileInUse, { botId, oldPid }));
                process.exit(1);
            }
        }

        fs.writeFileSync(this.lockFilePath, String(process.pid));

        process.on("exit", () => {
            if (this.lockFilePath && fs.existsSync(this.lockFilePath)) {
                fs.unlinkSync(this.lockFilePath);
            }
        });
        process.on("SIGINT", () => process.exit());
        process.on("SIGTERM", () => process.exit());
    }
}

export const lockfileManager = new LockfileManager();
