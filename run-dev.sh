#!/usr/bin/env bash
# One-line helper to start backend and frontend for local development.
# Usage: ./run-dev.sh    (or set SKIP_INSTALL=1 to skip npm install)
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

SKIP_INSTALL=${SKIP_INSTALL:-0}

echo "ElectroCart — starting development servers"
cd "$ROOT_DIR"

if [ "$SKIP_INSTALL" != "1" ]; then
  echo "Installing backend deps (skip with SKIP_INSTALL=1)..."
  (cd "$ROOT_DIR/backend" && npm install)
  echo "Installing frontend deps (skip with SKIP_INSTALL=1)..."
  (cd "$ROOT_DIR/frontend" && npm install)
fi

# Start backend in background and log to /tmp
echo "Starting backend... (logs: /tmp/electrocart-backend.log)"
npm --prefix "$ROOT_DIR/backend" start &> /tmp/electrocart-backend.log &
BACKEND_PID=$!
sleep 1

echo "Starting frontend... (logs: /tmp/electrocart-frontend.log)"
npm --prefix "$ROOT_DIR/frontend" run dev &> /tmp/electrocart-frontend.log &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Tailing frontend logs (press Ctrl-C to stop tailing and leave processes running)."
echo "Frontend log: /tmp/electrocart-frontend.log"
tail -f /tmp/electrocart-frontend.log
