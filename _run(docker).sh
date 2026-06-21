#!/bin/bash
set -e

# Systemd usually does not load the same PATH/TERM values as an interactive login shell.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
export TERM="${TERM:-xterm-256color}"

SESSION_NAME="autosigninskport"
CONTAINER_NAME="autosigninskport-container"
CONTAINER_WORKDIR="/Auto-Signin-SKport-Endfield"

# 1. Docker mode needs root so tmux does not prompt for sudo passwords.
if [ "$(id -u)" -ne 0 ]; then
    exec sudo "$0" "$@"
fi

# 2. Resolve the project directory from this script location.
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 3. Ensure required commands are available.
if ! command -v docker >/dev/null 2>&1; then
    echo "[ERROR] docker was not found. Install Docker first."
    exit 1
fi

if ! command -v tmux >/dev/null 2>&1; then
    echo "[ERROR] tmux was not found. Install tmux first."
    exit 1
fi

# 4. Create the Docker image if it does not exist.
bash "$PROJECT_DIR/_create-docker-image.sh"

# 5. Create the Docker container if it does not exist.
bash "$PROJECT_DIR/_create-docker-container.sh"

# 6. Start the Docker container before creating the tmux workflow.
echo "[DOCKER] Starting container '$CONTAINER_NAME'..."
docker start "$CONTAINER_NAME" >/dev/null

# 7. Check whether the PM2 app already exists inside the container.
PM2_EXISTS="false"
if docker exec "$CONTAINER_NAME" bash -lc "pm2 describe '$SESSION_NAME' >/dev/null 2>&1"; then
    PM2_EXISTS="true"
fi

# 8. If root tmux is already running and PM2 exists, do not send duplicate commands.
if tmux has-session -t "$SESSION_NAME" 2>/dev/null && [ "$PM2_EXISTS" = "true" ]; then
    echo "[TMUX] Session '$SESSION_NAME' is already running in the background."
    echo "[INFO] View the session with: sudo tmux attach -t $SESSION_NAME"
    exit 0
fi

# 9. If root tmux exists but PM2 was lost after a container restart, recreate the workflow.
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "[TMUX] Removing old session '$SESSION_NAME' so the Docker workflow can be recreated..."
    tmux kill-session -t "$SESSION_NAME"
fi

# 10. Create the root tmux session if it does not exist.
bash "$PROJECT_DIR/_create-tmux-session.sh"

# 11. Send commands to tmux to enter the container, create the PM2 app, and open pm2 monit.
tmux send-keys -t "$SESSION_NAME" "docker exec -it \"$CONTAINER_NAME\" bash" C-m
tmux send-keys -t "$SESSION_NAME" "cd \"$CONTAINER_WORKDIR\"" C-m
tmux send-keys -t "$SESSION_NAME" "bash ./_create-pm2-session.sh" C-m
tmux send-keys -t "$SESSION_NAME" "pm2 monit" C-m

echo "[DONE] Bot has been started in Docker/tmux session '$SESSION_NAME'."
echo "[INFO] View the session with: sudo tmux attach -t $SESSION_NAME"
