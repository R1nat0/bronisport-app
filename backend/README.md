# BroniSport Backend

Node.js + Express + Prisma + PostgreSQL.

## Быстрый старт — весь стек

Из корня репозитория:

```bash
./start-dev.sh              # Postgres + миграции + seed + backend + frontend
# Ctrl+C — остановит фронт и бэк (Postgres остаётся)
```

Флаги:
- `--no-docker` — не трогать Docker (если Postgres уже запущен)
- `--no-seed`   — пропустить seed
- `--fresh`     — обнулить БД (`docker compose down -v`) перед запуском

## Только backend

```bash
cp .env.example .env
docker compose up -d            # поднять Postgres
npm install
npm run prisma:migrate          # применить миграции
npm run dev                     # http://localhost:4000
curl http://localhost:4000/health
```

## Скрипты

- `npm run dev` — dev-сервер с auto-reload
- `npm run start` — продакшн
- `npm run prisma:migrate` — применить миграции
- `npm run prisma:studio` — GUI для БД
- `npm run db:seed` — сид тестовых данных *(этап 3)*
- `npm run moderate:list|approve|reject` — ручная модерация площадок *(этап 6.5)*

## Структура

```
backend/
├── prisma/schema.prisma      # модель данных
├── src/
│   ├── index.js              # entry
│   ├── app.js                # Express app factory
│   ├── prisma.js             # PrismaClient singleton
│   ├── routes/               # роутеры
│   ├── controllers/
│   ├── services/             # бизнес-логика
│   ├── middleware/
│   ├── utils/
│   └── scripts/              # seed, moderate
└── docker-compose.yml        # postgres
```
