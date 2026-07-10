#!/usr/bin/env bash
# Start FlowFix AI dev server in background, wait for web (5173) + api (3001), exit.
set -u
LOG_DIR="/tmp/flowfix"
mkdir -p "$LOG_DIR"

cd /c/Users/Princ/OneDrive/Desktop/Idea || exit 1

# Kill any previous instance (don't fail if none)
pkill -f "vite" >/dev/null 2>&1 || true
pkill -f "tsx watch" >/dev/null 2>&1 || true
sleep 1

# Start in background with PID tracking
: > "$LOG_DIR/dev.log"
nohup npm run dev > "$LOG_DIR/dev.log" 2>&1 &
DEVPID=$!
echo "dev_pid=$DEVPID"

# Poll for readiness up to 25s
READY=""
for i in $(seq 1 25); do
  sleep 1
  W=$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null || echo "000")
  A=$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:3001/api/me 2>/dev/null || echo "000")
  echo "poll ${i}s web=$W api=$A"
  if [ "$W" = "200" ] && [ "$A" != "000" ]; then
    READY="${i}s"
    break
  fi
done

echo ""
echo "READY_AFTER=${READY:-(timeout)}"
echo ""
echo "=== dev.log (last 60 lines) ==="
tail -n 60 "$LOG_DIR/dev.log"
echo ""
echo "=== processes still alive? ==="
ps -ef 2>/dev/null | grep -E "vite|tsx watch" | grep -v grep || tasklist 2>/dev/null | grep -E "node.exe" || echo "[ps/tasklist unavailable]"
