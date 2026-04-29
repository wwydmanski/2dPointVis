#!/usr/bin/env bash
set -euo pipefail

# deploy-staging.sh
# Deploy the application in "No SSL" (staging) mode as described in README.md
# Usage: DATA_WEBSERVER_PATH=/path DATA_PATH=/path ./deploy-staging.sh

print_usage() {
  cat <<EOF
Usage: $0 [--external-port PORT] [--no-sudo]
Environment variables required:
  DATA_WEBSERVER_PATH  Path to webserver data (required)
  DATA_PATH            Path to MIP follow-up clusters (required, may be empty directory)

Optional environment variables:
  EXTERNAL_PORT        External port (defaults to 8081)
  USE_SSL              Set to 0 for no-SSL (defaults to 0)

This script will build frontend artifacts and start the docker compose stack.
EOF
}

# Defaults
: "${EXTERNAL_PORT:=8081}"
: "${USE_SSL:=0}"

# Parse args
USE_SUDO=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --external-port)
      EXTERNAL_PORT="$2"; shift 2;;
    --no-sudo)
      USE_SUDO=0; shift;;
    -h|--help)
      print_usage; exit 0;;
    *)
      echo "Unknown arg: $1" >&2; print_usage; exit 2;;
  esac
done

if [[ -z "${DATA_WEBSERVER_PATH-}" ]]; then
  echo "ERROR: DATA_WEBSERVER_PATH is not set." >&2
  print_usage
  exit 2
fi

if [[ -z "${DATA_PATH-}" ]]; then
  echo "ERROR: DATA_PATH is not set." >&2
  print_usage
  exit 2
fi

echo "Deploying in No-SSL (staging) mode"
echo "  DATA_WEBSERVER_PATH=$DATA_WEBSERVER_PATH"
echo "  DATA_PATH=$DATA_PATH"
echo "  EXTERNAL_PORT=$EXTERNAL_PORT"
echo "  USE_SSL=$USE_SSL"

# Build frontend
echo "\n==> Building frontend..."
if [[ -d frontend ]]; then
  if [[ -f frontend/yarn.lock ]]; then
    echo "Using yarn to install and build frontend"
    (cd frontend && yarn install --frozen-lockfile || yarn install)
    (cd frontend && yarn build)
  else
    echo "Using npm to install and build frontend"
    (cd frontend && npm ci)
    (cd frontend && npm run build)
  fi
else
  echo "Warning: frontend directory not found; skipping frontend build." >&2
fi

# Prepare docker compose commands
if [[ $USE_SUDO -eq 1 && $(id -u) -ne 0 ]]; then
  SUDO_CMD=(sudo --preserve-env=DATA_PATH,DATA_WEBSERVER_PATH,EXTERNAL_PORT,USE_SSL)
else
  SUDO_CMD=()
fi

echo "\n==> Stopping any existing docker compose stack (if running)"
${SUDO_CMD[@]} docker compose down || true

echo "\n==> Starting docker compose (building images)"
${SUDO_CMD[@]} docker compose up --build -d

echo "\nDeployment finished.\n"
echo "Check services with: docker compose ps"
echo "If you used sudo, use: sudo docker compose ps"
