<h1 align="center">
    Auto Signin SKport Endfield
</h1>

<p align="center">
    <img src="https://count.getloli.com/@Auto-Signin-SKport-Endfield?name=Auto-Signin-SKport-Endfield&theme=gelbooru&padding=7&offset=0&align=center&scale=1&pixelated=1&darkmode=auto" alt="moe counter" />
    <p align="center"> Visitors (Since 2025/08/06) </p>
    <br>
    <p align="center">  </p>
</p>

## Overview

This project supports two self-hosting modes:

- **Host mode**: run the bot directly on the server with `tmux` + `pm2`.
- **Docker mode**: run an Ubuntu/Node container, then start the bot inside the container with `pm2` through `docker exec`.

Runtime data is stored in the project folder:

- `configs/botConfig.json`: Discord bot token, bot ID, schedule.
- `configs/accounts.json`: registered SKport account data.
- `logs/`: daily bot logs.
- `*.lock`: runtime lock file used to prevent duplicate bot processes.

Do not commit or share `configs/botConfig.json` or `configs/accounts.json`.

## Requirements

Common:

- Linux server
- `tmux`
- Git

Host mode:

- Node.js 18+
- npm
- PM2 installed globally: `npm install -g pm2`

Docker mode:

- Docker
- sudo/root permission for Docker commands

## Discord Bot Setup

Create a Discord application and bot, then prepare:

- Bot token
- Application/client ID, used as `botId`

The bot registers these global slash commands:

- `/addaccount`
- `/deleteaccount`
- `/listaccounts`
- `/checkin`

## First-Time Config

Clone the project:

```bash
git clone <repo-url>
cd Auto-Signin-SKport-Endfield
```

Create `configs/botConfig.json` before starting the bot with PM2. This is the safest option for both host mode and Docker mode:

```bash
mkdir -p configs
nano configs/botConfig.json
```

Use this shape:

```json
{
    "token": "YOUR_DISCORD_BOT_TOKEN",
    "botId": "YOUR_DISCORD_APPLICATION_ID",
    "checkinSchedule": {
        "hour": 0,
        "minute": 5,
        "intervalHours": 6
    },
    "debug": false
}
```

Schedule values use UTC.

If you are using host mode and already have Node/npm installed, you can alternatively create the config interactively:

```bash
npm ci
node index.js
```

The interactive flow asks for:

- Discord bot token
- Bot/application ID
- Daily check-in hour in UTC
- Daily check-in minute in UTC

After the config file is created, stop the interactive process with `Ctrl+C`. Do not rely on PM2 to answer these prompts.

## Host Mode

Use this mode when Node.js and PM2 are installed directly on the server.

```bash
chmod +x _*.sh
./_run.sh
```

What happens:

1. `_run.sh` creates tmux session `autosigninskport` through `_create-tmux-session.sh`.
2. Inside tmux, it runs `_create-pm2-session.sh`.
3. `_create-pm2-session.sh` installs dependencies if needed and starts `index.js` in PM2.
4. tmux opens `pm2 monit`.

Attach to the session:

```bash
tmux attach -t autosigninskport
```

Detach from tmux without stopping the bot:

```text
Ctrl+B, then D
```

## Docker Mode

Use this mode when you want the bot isolated in a Docker container.

```bash
chmod +x _*.sh
./_run\(docker\).sh
```

What happens:

1. `_run(docker).sh` re-runs itself with `sudo` if needed.
2. `_create-docker-image.sh` creates image `autosigninskport` if it does not exist.
3. `_create-docker-container.sh` creates container `autosigninskport-container` if it does not exist.
4. The container starts with `--restart unless-stopped` and stays idle with `tail -f /dev/null`.
5. A root tmux session opens `docker exec -it autosigninskport-container bash`.
6. Inside the container, `_create-pm2-session.sh` starts the bot with PM2.
7. tmux opens `pm2 monit`.

Attach to the Docker tmux session:

```bash
sudo tmux attach -t autosigninskport
```

Important Docker note:

The container is configured to restart automatically, but the bot process is created through `docker exec`. If the container is restarted, run this again to recreate the PM2 app inside the container:

```bash
./_run\(docker\).sh
```

Rebuild the Docker image after Dockerfile changes:

```bash
sudo docker rm -f autosigninskport-container
sudo docker build --no-cache -t autosigninskport .
./_run\(docker\).sh
```

## Optional Systemd

You can let the server run either mode on boot.

First, make the scripts executable:

```bash
cd /path/to/Auto-Signin-SKport-Endfield
chmod +x _*.sh
```

Then create a systemd service file:

```bash
sudo nano /etc/systemd/system/autosigninskport.service
```

Use **one** of the following service definitions.

Host mode service:

```ini
[Unit]
Description=Auto Signin SKport Endfield
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=YOUR_LINUX_USER
WorkingDirectory=/path/to/Auto-Signin-SKport-Endfield
ExecStart=/path/to/Auto-Signin-SKport-Endfield/_run.sh

[Install]
WantedBy=multi-user.target
```

Replace:

- `YOUR_LINUX_USER` with the Linux user that owns/runs the project.
- `/path/to/Auto-Signin-SKport-Endfield` with the real absolute project path.

Docker mode service:

```ini
[Unit]
Description=Auto Signin SKport Endfield Docker
Wants=network-online.target
Requires=docker.service
After=network-online.target docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/Auto-Signin-SKport-Endfield
ExecStart=/path/to/Auto-Signin-SKport-Endfield/_run(docker).sh
ExecStop=-/usr/bin/docker stop autosigninskport-container

[Install]
WantedBy=multi-user.target
```

For Docker mode:

- Replace `/path/to/Auto-Signin-SKport-Endfield` with the real absolute project path.
- Do not set `User=` unless that user can access Docker directly.
- Running this service as root is safer than allowing passwordless sudo for broad Docker access.

Reload systemd, enable the service at boot, and start it now:

```bash
sudo systemctl daemon-reload
sudo systemctl enable autosigninskport.service
sudo systemctl start autosigninskport.service
sudo systemctl status autosigninskport.service
```

View service logs:

```bash
sudo journalctl -u autosigninskport.service -f
```

Stop or disable the service:

```bash
sudo systemctl stop autosigninskport.service
sudo systemctl disable autosigninskport.service
```

After the service starts, attach to the tmux session:

```bash
# Host mode
tmux attach -t autosigninskport

# Docker mode
sudo tmux attach -t autosigninskport
```

## Bot Commands

`/addaccount`

Opens a private registration flow. The form asks for account name, `cred`, `skGameRole`, and optional Discord ID for notifications. After saving, the bot runs a check-in immediately.

`/deleteaccount <account_name>`

Deletes a saved account after confirmation.

`/listaccounts`

Lists your saved accounts.

`/checkin`

Runs manual check-in for your accounts.

## Operations

Show PM2 status in host mode:

```bash
pm2 status
pm2 logs autosigninskport
```

Show Docker container status:

```bash
sudo docker ps
sudo docker logs autosigninskport-container
```

Stop host mode:

```bash
tmux kill-session -t autosigninskport
pm2 stop autosigninskport
```

Stop Docker mode:

```bash
sudo tmux kill-session -t autosigninskport
sudo docker stop autosigninskport-container
```

Remove Docker container:

```bash
sudo docker rm -f autosigninskport-container
```

## Troubleshooting

`Bot with botId ... is already running`

A lock file detected another running bot process. Stop the old PM2 process/session first. If the process is already gone, the bot will remove stale lock files automatically on next start.

`Docker container keeps restarting with exit code 127`

The image likely does not contain `pm2` or Node correctly. Rebuild:

```bash
sudo docker rm -f autosigninskport-container
sudo docker build --no-cache -t autosigninskport .
./_run\(docker\).sh
```

Slash commands do not appear immediately

The bot registers global slash commands on startup. Global command propagation can take a little time.

Scheduled check-in time looks wrong

The schedule uses UTC, not local server time.
