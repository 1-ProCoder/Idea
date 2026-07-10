#!/usr/bin/env bash
set -u
echo "=== A. psql installed? ==="
which psql 2>&1 || echo "[no psql]"
psql --version 2>&1 || true

echo ""
echo "=== B. existing .env files (truncated) ==="
if [ -f /c/Users/Princ/OneDrive/Desktop/Idea/apps/api/.env ]; then
  echo "  apps/api/.env ->"
  cat /c/Users/Princ/OneDrive/Desktop/Idea/apps/api/.env | sed 's/^/    /' | head -20
else
  echo "[no apps/api/.env]"
fi
if [ -f /c/Users/Princ/OneDrive/Desktop/Idea/apps/web/.env ]; then
  echo "  apps/web/.env ->"
  cat /c/Users/Princ/OneDrive/Desktop/Idea/apps/web/.env | sed 's/^/    /' | head -20
else
  echo "[no apps/web/.env]"
fi

echo ""
echo "=== C. is there a postgres running on 5432? ==="
(echo > /dev/tcp/localhost/5432) 2>&1 && echo "[5432 reachable]" || echo "[5432 NOT reachable]"

echo ""
echo "=== D. docker available? ==="
which docker 2>&1 || echo "[no docker]"

echo ""
echo "=== E. existing prisma migrations dir ==="
ls -la /c/Users/Princ/OneDrive/Desktop/Idea/apps/api/prisma/migrations 2>&1 || echo "[no migrations dir]"

echo ""
echo "=== F. Prisma client generated? ==="
ls /c/Users/Princ/OneDrive/Desktop/Idea/apps/api/node_modules/.prisma/client 2>&1 | head -10 || echo "[prisma NOT generated]"

echo ""
echo "=== G. currently running node processes ==="
tasklist 2>/dev/null | grep -i node | head -10 || echo "[tasklist unavailable]"

echo ""
echo "=== H. existing src/routes and src/lib ==="
echo "  routes/"
ls /c/Users/Princ/OneDrive/Desktop/Idea/apps/api/src/routes 2>&1 | sed 's/^/    /' || true
echo "  lib/"
ls /c/Users/Princ/OneDrive/Desktop/Idea/apps/api/src/lib 2>&1 | sed 's/^/    /' || true

echo ""
echo "=== I. live probe: http GET /api/health on port 4000 ==="
curl -sS --max-time 3 http://localhost:4000/api/health 2>&1 || echo "[api unreachable]"

echo ""
echo "=== J. is anything listening on 4000? ==="
(echo > /dev/tcp/localhost/4000) 2>&1 && echo "[4000 reachable]" || echo "[4000 NOT reachable]"
