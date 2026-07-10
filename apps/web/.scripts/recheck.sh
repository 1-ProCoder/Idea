#!/usr/bin/env bash
# Quick re-check after dev server start: dump dev.log and poll localhost:3001 once more.
set -u
sleep 6
echo "=== dev.log (full) ==="
cat /tmp/flowfix/dev.log
echo ""
echo "=== single re-poll ==="
echo -n "web 5173 -> "; curl -sS -o /dev/null -w "%{http_code}\n" --max-time 3 http://localhost:5173/ 2>&1
echo -n "api 3001 -> "; curl -sS -o /dev/null -w "%{http_code}\n" --max-time 3 http://localhost:3001/api/me 2>&1
echo ""
echo "=== api probe /api/me body (3s) ==="
curl -sS --max-time 3 http://localhost:3001/api/me 2>&1 || echo "[curl failed]"
echo ""
echo "=== node processes ==="
tasklist 2>/dev/null | grep -i "node.exe" || ps -ef | grep -E "node|tsx|vite" | grep -v grep || echo "[none]"
