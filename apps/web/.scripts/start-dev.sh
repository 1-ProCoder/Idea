#!/usr/bin/env bash
# Start the FlowFix AI dev workflow in the background:
#   1. Sweep any prior wrappers + dev processes (kills leaked bash wrappers
#      that started `npm run dev` from previous restarts).
#   2. Boot the embedded Postgres on :5432 (apps/api/scripts/start-dev-db.ts).
#      First-run: ~3-5s download + bootstrap. Subsequent: <1s reuse.
#   3. Push the Prisma schema into the fresh DB (`prisma db push` is
#      non-interactive and also regenerates @prisma/client on the way,
#      which fixes the "no .prisma/client dir" thing we've been hitting).
#   4. Boot web (:5173) + api (:4000) under concurrently.
#   5. Poll readiness up to 35s, dump a status block + the live process
#      tree, then exit cleanly — the dev processes keep running detached.
#
# Run from project root (`bash apps/web/.scripts/start-dev.sh`) or from
# anywhere — the script `cd`s into the project root itself.
set -u

# Derive the project root from this script's own location so the workflow
# is portable across machines (the previous version had a hardcoded path
# pointing at a single developer's home directory). The script lives at
# apps/web/.scripts/start-dev.sh, so we need to walk three `..` to reach
# the monorepo root: .scripts → web → apps → <project>.
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/../../.." && pwd )"
LOG_DIR="/tmp/flowfix"
mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR" || exit 1

echo "[start-dev] (0/3) ensuring embedded-postgres devDep is installed…"
# Idempotent. If the dep is already there, npm is a quick no-op (a few
# hundred ms). If it's not, this pulls it in before db:dev is invoked.
npm install -w @flowfix/api --no-audit --no-fund 2>&1 | tail -n 4
echo ""

echo "[start-dev] sweeping any prior dev processes…"
# Kill any embedded-postgres child processes (Windows process tree)
powershell -NoProfile -Command 'Get-CimInstance Win32_Process -Filter "Name='"'"'node.exe'"'"'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "embedded-postgres|start-dev-db|prisma" } | ForEach-Object { Write-Host "  killing PID $($_.ProcessId)"; Stop-Process -Id $_.ProcessId -Force }' 2>/dev/null || true
# Bash-side sweep for vite / tsx / co currently-running processes
pkill -f "vite" >/dev/null 2>&1 || true
pkill -f "tsx watch" >/dev/null 2>&1 || true
pkill -f "embedded-postgres" >/dev/null 2>&1 || true
pkill -f "scripts.start-dev-db" >/dev/null 2>&1 || true
pkill -f "npm run build" >/dev/null 2>&1 || true
# Kill leftover bash wrappers that ran "npm run dev" from previous runs —
# these are the orphan wrappers showing up in `ps` as `bash /c/nvm4w/nodejs/npm run dev`.
for pat in "npm run dev" "bash.*npm.*run.*dev"; do
  pkill -f "$pat" >/dev/null 2>&1 || true
done
sleep 1

: > "$LOG_DIR/db.log"
: > "$LOG_DIR/dev.log"

echo ""
echo "[start-dev] (1/3) booting embedded Postgres on :5432…"
nohup npm -w @flowfix/api run db:dev > "$LOG_DIR/db.log" 2>&1 &
DB_PID=$!
echo "  db_pid=$DB_PID"

# Poll DB readiness up to 35s (binary download + initial bootstrap on first run)
READY_DB=""
for i in $(seq 1 35); do
  sleep 1
  if powershell -NoProfile -Command '(New-Object System.Net.Sockets.TcpClient).Connect("localhost",5432)' >/dev/null 2>&1; then
    READY_DB="${i}s"
    break
  fi
  printf "."
done
echo ""
if [ -z "$READY_DB" ]; then
  echo ""
  echo "[start-dev] ❌ Postgres never opened :5432 within 35s."
  echo "[start-dev] dumping $LOG_DIR/db.log:"
  cat "$LOG_DIR/db.log"
  exit 1
fi
echo "  ✅ Postgres ready after $READY_DB on :5432"

echo ""
echo "[start-dev] (2/3) pushing Prisma schema into the DB (also regenerates @prisma/client)…"
npm -w @flowfix/api run prisma:push 2>&1 | tail -n 12
echo ""

echo "[start-dev] (3/3) booting web (:5173) + api (:4000) under concurrently…"
nohup npm run dev > "$LOG_DIR/dev.log" 2>&1 &
DEV_PID=$!
echo "  dev_pid=$DEV_PID"

# Poll web + api readiness up to 35s
READY=""
for i in $(seq 1 35); do
  sleep 1
  W=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:5173/ 2>/dev/null || echo "000")
  A=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:4000/api/health 2>/dev/null || echo "000")
  printf "  poll %02ds  web=%s  api(health)=%s\n" "$i" "$W" "$A"
  if [ "$W" = "200" ] && [ "$A" = "200" ]; then
    READY="${i}s"
    break
  fi
done

echo ""
echo "==============================================="
echo "READY_AFTER=${READY:-(timeout)}"
echo "==============================================="
echo ""
echo "=== dev.log (last 40 lines) ==="
tail -n 40 "$LOG_DIR/dev.log"
echo ""
echo "=== db.log (last 20 lines) ==="
tail -n 20 "$LOG_DIR/db.log"
echo ""
echo "=== processes still alive on :5173, :4000, :5432 ==="
powershell -NoProfile -Command 'Get-NetTCPConnection -LocalPort 5173,4000,5432 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $p = Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)"; $cmd = if ($p) { $p.CommandLine } else { \"?\" }; "port=$($_.LocalPort) pid=$($_.OwningProcess) cmd=\" + ($cmd.Substring(0, [Math]::Min(120, $cmd.Length))) }' 2>/dev/null || ps -ef | grep -E "vite|tsx|postgres" | grep -v grep
echo ""
