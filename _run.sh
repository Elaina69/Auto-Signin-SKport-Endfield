#!/bin/bash
set -e

SESSION_NAME="autosigninskport"

# 1. Resolve the project directory from this script location.
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 2. If the tmux session is already running, do not send duplicate commands to pm2 monit.
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "[TMUX] Session '$SESSION_NAME' is already running in the background."
    echo "[INFO] View the session with: tmux attach -t $SESSION_NAME"
    exit 0
fi

# 3. Create the tmux session if it does not exist.
bash "$PROJECT_DIR/_create-tmux-session.sh"

# 4. Send commands to tmux to run the bot directly on the server.
tmux send-keys -t "$SESSION_NAME" "cd \"$PROJECT_DIR\"" C-m
tmux send-keys -t "$SESSION_NAME" "source ~/.bashrc 2>/dev/null || true" C-m
tmux send-keys -t "$SESSION_NAME" "bash ./_create-pm2-session.sh" C-m
tmux send-keys -t "$SESSION_NAME" "pm2 monit" C-m

echo "[DONE] Bot has been started on the server in tmux session '$SESSION_NAME'."
echo "[INFO] View the session with: tmux attach -t $SESSION_NAME"
