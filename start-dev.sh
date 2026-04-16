#!/usr/bin/env bash
# BroniSport — запускает Postgres (Docker), бэк и фронт в dev-режиме одной командой.
# Остановить всё: Ctrl+C.
#
# Флаги:
#   --no-docker    не трогать docker compose (Postgres уже запущен)
#   --no-seed      пропустить db seed
#   --fresh        предварительно wipe БД (docker compose down -v + миграции + seed)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_PORT=3000
BACKEND_PORT=4000

SKIP_DOCKER=0
SKIP_SEED=0
FRESH=0

for arg in "$@"; do
  case "$arg" in
    --no-docker) SKIP_DOCKER=1 ;;
    --no-seed)   SKIP_SEED=1 ;;
    --fresh)     FRESH=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

log()  { printf "${BLUE}[dev]${RESET} %s\n" "$*"; }
ok()   { printf "${GREEN}[ok]${RESET}  %s\n" "$*"; }
warn() { printf "${YELLOW}[warn]${RESET} %s\n" "$*"; }
err()  { printf "${RED}[err]${RESET} %s\n" "$*" >&2; }

# ---------- docker binary discovery ----------
if command -v docker >/dev/null 2>&1; then
  DOCKER="docker"
elif [ -x "/Applications/Docker.app/Contents/Resources/bin/docker" ]; then
  DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
else
  DOCKER=""
fi

# ---------- preflight ----------
if [ ! -d "$BACKEND_DIR" ]; then
  err "backend/ not found next to this script"
  exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
  warn "backend/.env not found — копирую из .env.example"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

if [ ! -f "$ROOT_DIR/.env" ]; then
  warn "frontend .env not found — копирую из .env.example"
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

# ---------- docker up ----------
if [ $SKIP_DOCKER -eq 0 ]; then
  if [ -z "$DOCKER" ]; then
    err "docker не найден. Запусти Docker Desktop и попробуй снова (или используй --no-docker)."
    exit 1
  fi

  if ! "$DOCKER" info >/dev/null 2>&1; then
    log "Docker daemon не отвечает, запускаю Docker Desktop..."
    open -a Docker 2>/dev/null || true
    for i in {1..30}; do
      if "$DOCKER" info >/dev/null 2>&1; then break; fi
      sleep 2
    done
    if ! "$DOCKER" info >/dev/null 2>&1; then
      err "Docker Desktop не поднялся за 60 секунд"
      exit 1
    fi
  fi

  if [ $FRESH -eq 1 ]; then
    warn "--fresh: удаляю БД (docker compose down -v)"
    (cd "$BACKEND_DIR" && "$DOCKER" compose down -v) >/dev/null
  fi

  log "Поднимаю Postgres через docker compose..."
  (cd "$BACKEND_DIR" && "$DOCKER" compose up -d) >/dev/null

  log "Жду готовности Postgres..."
  for i in {1..30}; do
    if (cd "$BACKEND_DIR" && "$DOCKER" compose exec -T postgres pg_isready -U bronisport >/dev/null 2>&1); then
      ok "Postgres готов"
      break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
      err "Postgres не стал готов за 30 секунд"
      exit 1
    fi
  done
else
  log "--no-docker: пропускаю docker compose"
fi

# ---------- dependencies ----------
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  log "backend: npm install..."
  (cd "$BACKEND_DIR" && npm install --no-audit --no-fund)
fi

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  log "frontend: npm install..."
  (cd "$ROOT_DIR" && npm install --no-audit --no-fund)
fi

# ---------- prisma ----------
log "backend: prisma migrate deploy..."
(cd "$BACKEND_DIR" && npx prisma migrate deploy) >/dev/null 2>&1 || {
  warn "migrate deploy fail — пробую migrate dev"
  (cd "$BACKEND_DIR" && npx prisma migrate dev --name auto --skip-seed)
}

if [ $SKIP_SEED -eq 0 ]; then
  log "backend: seed..."
  (cd "$BACKEND_DIR" && npm run db:seed) || warn "seed завершился с ошибкой (возможно, данные уже есть)"
fi

# ---------- port cleanup ----------
for port in $BACKEND_PORT $FRONTEND_PORT; do
  if lsof -nP -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1; then
    warn "порт $port занят, убиваю процесс"
    lsof -nP -iTCP:$port -sTCP:LISTEN -t | xargs -r kill -9 2>/dev/null || true
    sleep 1
  fi
done

# ---------- tmp logs ----------
LOG_DIR="$ROOT_DIR/.dev-logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
: > "$BACKEND_LOG"
: > "$FRONTEND_LOG"

# ---------- start processes (in own process groups) ----------
log "Запускаю backend (log: $BACKEND_LOG)..."
(cd "$BACKEND_DIR" && exec npm run dev >"$BACKEND_LOG" 2>&1) &
BACKEND_PID=$!

log "Запускаю frontend (log: $FRONTEND_LOG)..."
(cd "$ROOT_DIR" && exec npm run dev >"$FRONTEND_LOG" 2>&1) &
FRONTEND_PID=$!

# ---------- graceful shutdown ----------
kill_tree() {
  local pid=$1
  # collect descendants via pgrep -P recursively
  local children
  children=$(pgrep -P "$pid" 2>/dev/null || true)
  for c in $children; do
    kill_tree "$c"
  done
  kill "$pid" 2>/dev/null || true
}

cleanup() {
  trap - INT TERM EXIT
  printf "\n"
  log "Останавливаю dev-сервера..."
  [ -n "${TAIL_PID:-}" ] && kill "$TAIL_PID" 2>/dev/null || true
  kill_tree "$BACKEND_PID" 2>/dev/null || true
  kill_tree "$FRONTEND_PID" 2>/dev/null || true
  sleep 0.3
  pkill -f "node .*src/index.js" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
  ok "Готово. Postgres остался запущенным (cd backend && docker compose down остановит его)."
  exit 0
}
trap cleanup INT TERM

# ---------- wait for backend health ----------
log "Жду готовности backend на :$BACKEND_PORT..."
for i in {1..30}; do
  if curl -sf "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
    ok "Backend готов"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    warn "Backend не ответил на /health за 30 секунд. Смотри $BACKEND_LOG"
    break
  fi
done

# ---------- wait for frontend ----------
log "Жду готовности frontend на :$FRONTEND_PORT..."
for i in {1..30}; do
  if curl -sf "http://localhost:$FRONTEND_PORT/" >/dev/null 2>&1; then
    ok "Frontend готов"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    warn "Frontend не ответил за 30 секунд. Смотри $FRONTEND_LOG"
    break
  fi
done

printf "\n"
printf "${BOLD}${GREEN}BroniSport запущен${RESET}\n"
printf "  ${BOLD}Frontend:${RESET} http://localhost:$FRONTEND_PORT\n"
printf "  ${BOLD}Backend: ${RESET} http://localhost:$BACKEND_PORT\n"
printf "  ${BOLD}Health:  ${RESET} http://localhost:$BACKEND_PORT/health\n"
printf "  ${DIM}Логи: $LOG_DIR/{backend,frontend}.log${RESET}\n"
printf "\n"
printf "${BOLD}Демо-аккаунты:${RESET}\n"
printf "  ${DIM}athlete@example.com   / password123${RESET}\n"
printf "  ${DIM}organizer@example.com / password123${RESET}\n"
printf "\n"
printf "${DIM}Ctrl+C чтобы остановить${RESET}\n\n"

# tail оба лога в фон, чтобы bash trap не блокировался на foreground-команде.
# На macOS bash 3.2 нет `wait -n`, поэтому делаем простой poll-цикл:
# sleep прерывается сигналом, trap срабатывает между итерациями.
tail -f "$BACKEND_LOG" "$FRONTEND_LOG" &
TAIL_PID=$!

while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

# если кто-то из dev-серверов сам умер — чистим остальное
cleanup
