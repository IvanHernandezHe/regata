#!/usr/bin/env bash
set -euo pipefail

# Rebuilds Roue project end-to-end: clean, build frontend, build backend, compose up
# Usage: ./scripts/rebuild.sh [--no-docker] [--no-frontend]

NO_DOCKER=false
NO_FRONT=false
for arg in "$@"; do
  case "$arg" in
    --no-docker) NO_DOCKER=true ;;
    --no-frontend) NO_FRONT=true ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/5] Cleaning bin/obj and API wwwroot..."
find src tests -type d \( -name bin -o -name obj \) -prune -exec rm -rf {} + || true
rm -rf src/Roue.API/wwwroot/* || true

if [ "$NO_FRONT" = false ]; then
  echo "[2/5] Rebuilding frontend (Angular) and copying to API/wwwroot..."
  if command -v npm >/dev/null 2>&1; then
    pushd roue-web >/dev/null
      # Prefer a clean install for deterministic builds
      if [ -d node_modules ]; then echo "- removing node_modules"; rm -rf node_modules; fi
      npm ci
      npm run build:api
    popd >/dev/null
  else
    echo "npm not found. Skipping frontend build."
  fi
else
  echo "[2/5] Skipping frontend build per flag."
fi

echo "[3/5] Restoring and building backend (.NET) Release..."
if command -v dotnet >/dev/null 2>&1; then
dotnet restore Roue.sln
dotnet build Roue.sln -c Release --no-restore
else
  echo "dotnet SDK not found. Skipping backend compile."
fi

if [ "$NO_DOCKER" = false ]; then
  echo "[4/5] Rebuilding Docker images without cache..."
  docker compose -f docker-compose.cosmos.yml down -v || true
  docker compose -f docker-compose.cosmos.yml build --no-cache

  echo "[5/5] Starting services..."
  docker compose -f docker-compose.cosmos.yml up -d
  echo "Done. Services running. Use: docker compose -f docker-compose.cosmos.yml ps"
else
  echo "[4/5] Skipping Docker per flag."
fi

echo "Rebuild finished."
