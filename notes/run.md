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


## chrome-debug

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  http://localhost:3000
```



MCP user directus
dkIHulcJZ18e3ZuENS943XlY8K_S3nMZ

## Сайт документации (VitePress)

В `docs-site/` живёт VitePress-сайт, собранный из файлов `docs/`.

```bash
cd docs-site
npm run docs:dev      # dev-сервер → http://localhost:5173
npm run docs:build    # статическая сборка → .vitepress/dist/
npm run docs:preview  # превью собранного сайта
```

**Разделы:** Overview, Architecture, Features, Screens, Design System, Roadmap.

Обновлять его надо **вручную**. VitePress — это статический генератор: он просто компилирует markdown из `docs-site/` в HTML. Когда ты добавляешь фичи в код, нужно:
1. Обновить соответствующие markdown-файлы в `docs-site/`
2. Пересобрать: `npm run docs:build`

Скриншоты экранов клади в `docs-site/public/screenshots/` — ссылки на них уже расставлены в разделе Screens.