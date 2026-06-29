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

## пересобрать контейнеры например api

```bash
docker compose build api && docker compose up -d api
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




Сервер
ssh root@178.104.110.253
# или
ssh root@itocook.duckdns.org
Файлы на сервере
/opt/itocook/.env          # основной .env
/opt/itocook/app/.env      # копия для docker compose
/opt/itocook/app/          # папка проекта (git repo)
Основные команды на сервере
bash# Посмотреть запущенные контейнеры
docker ps

# Перезапустить frontend (после изменений .env)
docker rm -f itocook-frontend && docker run -d \
--name itocook-frontend \
--network app_default \
-p 127.0.0.1:3000:3000 \
--env-file /opt/itocook/app/.env \
-e NUXT_DIRECTUS_URL=http://directus:8055 \
-e NUXT_DIRECTUS_ADMIN_EMAIL=admin@itocook.com \
-e NUXT_DIRECTUS_ADMIN_PASSWORD=admin \
app-frontend

# Логи frontend
docker logs itocook-frontend --tail 50

# Пересобрать и задеплоить после git push
cd /opt/itocook/app && git pull && docker build -f Dockerfile.prod -t app-frontend . && docker rm -f itocook-frontend && docker run -d ...
Directus админка
https://itocook.duckdns.org/cms/admin
admin@itocook.com / admin


пеернос директуса на сервер!

# 1. скачай snapshot с локального localhost:8055 через UI
# 2. закинь файл на VPS (например через scp)
scp snapshot.json user@your-vps:/home/user/

# 3. на VPS — скопируй в контейнер и примени
docker cp snapshot.json directus:/tmp/snapshot.json
docker exec directus npx directus schema apply /tmp/snapshot.json