#!/bin/bash
set -e

SESSION_NAME="autosigninskport"

# 1. Ensure this script is running from the project directory.
if [ ! -f "index.js" ] || [ ! -f "package.json" ]; then
    echo "[ERROR] Run this script from the project directory."
    exit 1
fi

# 2. Ensure required commands are available.
if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] npm was not found."
    exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
    echo "[ERROR] pm2 was not found."
    exit 1
fi

# 3. Install dependencies if node_modules is not ready.
if [ ! -d "node_modules/discord.js" ]; then
    echo "[NPM] Installing dependencies with npm ci..."
    npm ci
fi

# 4. Skip creation if the PM2 app already exists.
if pm2 describe "$SESSION_NAME" >/dev/null 2>&1; then
    echo "[PM2] App '$SESSION_NAME' already exists."
    exit 0
fi

# 5. Create a new PM2 app for the bot.
echo "[PM2] Creating app '$SESSION_NAME'..."
pm2 start index.js --name "$SESSION_NAME"

echo "[PM2] App '$SESSION_NAME' has been created."
