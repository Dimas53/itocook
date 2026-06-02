# Запуск / Остановка проекта

## Запустить всё (Docker)

```bash
docker compose up -d
```

Поднимает: PostgreSQL, Directus (8055), Nuxt (3000), FastAPI (8000).

## Остановить всё

```bash
docker compose down
```

## Запустить только фронт локально (без Docker)

```bash
cd frontend && npm run dev
```

Directus и БД всё равно должны быть в Docker.

## Проверить, что запущено

```bash
docker ps
```

Ожидаемые контейнеры: `itocook-postgres`, `itocook-directus`, `itocook-frontend`, `itocook-api`.
