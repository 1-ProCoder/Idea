#!/usr/bin/env bash
# Run the full FlowFix AI monorepo typecheck. Wrapped in a file because
# previous basher calls were truncating multi-segment commands.
set -u
echo "[typecheck] starting in $(pwd)"

cd /c/Users/Princ/OneDrive/Desktop/Idea

echo "[typecheck] running npm run typecheck..."
npm run typecheck 2>&1
RC=$?
echo "[typecheck] rc=$RC"
exit $RC
