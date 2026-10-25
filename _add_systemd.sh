#!/bin/bash
set -e

UNIT_NAME="autosigninskport.service"
UNIT_PATH="/etc/systemd/system/$UNIT_NAME"
CONTAINER_NAME="autosigninskport-container"
SESSION_NAME="autosigninskport"

# 1. Installing a unit into /etc/systemd/system needs root.
if [ "$(id -u)" -ne 0 ]; then
    exec sudo -E "$0" "$@"
fi

# 2. Resolve the project directory from this script location.
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
START_SCRIPT="$PROJECT_DIR/_run(docker).sh"

# 3. Ensure required commands are available.
if ! command -v systemctl >/dev/null 2>&1; then
    echo "[ERROR] systemctl was not found. This system does not use systemd."
    exit 1
fi

# 4. Ensure the script that the unit starts is present and executable.
if [ ! -x "$START_SCRIPT" ]; then
    echo "[ERROR] '$START_SCRIPT' is missing or not executable."
    echo "[ERROR] Fix it with: chmod +x \"$START_SCRIPT\""
    exit 1
fi

# 5. Render the unit into a temporary file so the installed unit is never half-written.
TMP_UNIT="$(mktemp)"
trap 'rm -f "$TMP_UNIT"' EXIT

cat > "$TMP_UNIT" <<EOF
[Unit]
Description=Auto Signin SKport Endfield Docker
Wants=network-online.target
Requires=docker.service
After=network-online.target docker.service
RequiresMountsFor=$PROJECT_DIR
ConditionPathIsDirectory=$PROJECT_DIR

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
ExecStart=$START_SCRIPT
ExecStop=-/usr/bin/tmux kill-session -t $SESSION_NAME
ExecStop=-/usr/bin/docker stop $CONTAINER_NAME
TimeoutStopSec=60

[Install]
WantedBy=multi-user.target
EOF

# 6. Keep the installed unit untouched when it already matches, otherwise back it up first.
if [ -f "$UNIT_PATH" ] && cmp -s "$TMP_UNIT" "$UNIT_PATH"; then
    echo "[SYSTEMD] Unit '$UNIT_NAME' is already up to date."
else
    if [ -f "$UNIT_PATH" ]; then
        UNIT_BACKUP="$UNIT_PATH.bak-$(date +%Y%m%d-%H%M%S)"
        echo "[SYSTEMD] Unit '$UNIT_NAME' differs from this script. Backing it up to '$UNIT_BACKUP'..."
        cp -a "$UNIT_PATH" "$UNIT_BACKUP"
    fi

    echo "[SYSTEMD] Installing '$UNIT_PATH'..."
    install -m 0644 "$TMP_UNIT" "$UNIT_PATH"
fi

# 7. Reload systemd and enable the unit for the next boot.
echo "[SYSTEMD] Reloading systemd..."
systemctl daemon-reload

echo "[SYSTEMD] Enabling '$UNIT_NAME'..."
systemctl enable "$UNIT_NAME"

# 8. The unit is enabled but not started, so this script never disturbs a running instance.
echo "[DONE] '$UNIT_NAME' will start Auto-Signin-SKport-Endfield when the operating system boots."
echo "[INFO] Start it now with:  sudo systemctl start $UNIT_NAME"
echo "[INFO] Check the status:   systemctl status $UNIT_NAME"
echo "[INFO] Read the logs:      journalctl -u $UNIT_NAME -b"
echo "[INFO] Attach to tmux:     bash \"$PROJECT_DIR/_attach-tmux.sh\""
