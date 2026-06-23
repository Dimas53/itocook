Окей, агент молодец — хорошо проанализировал. Обновляю план с учётом реальности проекта.

---

# Обновлённый план деплоя ItoCook

## Этап 0 — Чистим сервер

```bash
ssh root@178.104.110.253

# Смотрим что крутится
docker ps
docker compose ls

# Сносим OpenWebUI
cd /opt  # или где лежит
docker compose down -v
docker system prune -af

# Чистим старый nginx и cron
crontab -e  # убираем dimasai строку
rm /etc/nginx/sites-enabled/dimasai* 2>/dev/null
rm /etc/nginx/sites-available/dimasai* 2>/dev/null
nginx -t && systemctl reload nginx
```

---

## Этап 1 — DuckDNS

```bash
# На сервере
mkdir -p /opt/duckdns
cat > /opt/duckdns/duck.sh << 'EOF'
echo url="https://www.duckdns.org/update?domains=itocook&token=ВАШ_ТОКЕН&ip=" | curl -k -o /opt/duckdns/duck.log -K -
EOF
chmod +x /opt/duckdns/duck.sh
/opt/duckdns/duck.sh  # проверяем сразу

crontab -e
# добавляем:
# */5 * * * * /opt/duckdns/duck.sh >/dev/null 2>&1
```

На duckdns.org создаёшь субдомен `itocook`, IP `178.104.110.253`.

---

## Этап 2 — Структура на сервере

```bash
mkdir -p /opt/itocook
cd /opt/itocook
# сюда положим: docker-compose.prod.yml, .env, nginx конфиг
# app/ — сюда git clone репозитория
```

---

## Этап 3 — Файлы в репозитории (делаем локально, пушим)

### 3.1 `frontend/Dockerfile` — переписываем под прод

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output ./output
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "output/server/index.mjs"]
```

### 3.2 `api/Dockerfile` — убираем `--reload`

```dockerfile
# меняем последнюю строку на:
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3.3 `docker-compose.prod.yml` — в корне репо

```yaml
services:
  postgres:
    image: postgres:15
    container_name: itocook-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  directus:
    image: directus/directus:11
    container_name: itocook-directus
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - directus_uploads:/directus/uploads
      - directus_extensions:/directus/extensions
    environment:
      KEY: ${DIRECTUS_KEY}
      SECRET: ${DIRECTUS_SECRET}
      DB_CLIENT: pg
      DB_HOST: postgres
      DB_PORT: "5432"
      DB_DATABASE: ${POSTGRES_DB}
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      ADMIN_EMAIL: ${DIRECTUS_ADMIN_EMAIL}
      ADMIN_PASSWORD: ${DIRECTUS_ADMIN_PASSWORD}
      PUBLIC_URL: https://itocook.duckdns.org/cms
      CORS_ENABLED: "true"
      CORS_ORIGIN: "https://itocook.duckdns.org"
      CORS_METHODS: "GET,POST,PATCH,DELETE,OPTIONS"
      CORS_HEADERS: "Content-Type,Authorization"
      CORS_MAX_AGE: "600"
      ACCESS_TOKEN_TTL: "24h"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: itocook-frontend
    restart: unless-stopped
    environment:
      NUXT_PUBLIC_DIRECTUS_URL: https://itocook.duckdns.org/cms
      NUXT_PUBLIC_VAPID_PUBLIC_KEY: ${NUXT_PUBLIC_VAPID_PUBLIC_KEY}
      NUXT_DIRECTUS_ADMIN_EMAIL: ${DIRECTUS_ADMIN_EMAIL}
      NUXT_DIRECTUS_ADMIN_PASSWORD: ${DIRECTUS_ADMIN_PASSWORD}
    depends_on:
      - directus

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: itocook-api
    restart: unless-stopped
    environment:
      PYTHONUNBUFFERED: "1"
      VAPID_PUBLIC_KEY: ${VAPID_PUBLIC_KEY}
      VAPID_PRIVATE_KEY: ${VAPID_PRIVATE_KEY}
      VAPID_SUBJECT: ${VAPID_SUBJECT}
      DIRECTUS_URL: http://directus:8055
      DIRECTUS_ADMIN_EMAIL: ${DIRECTUS_ADMIN_EMAIL}
      DIRECTUS_ADMIN_PASSWORD: ${DIRECTUS_ADMIN_PASSWORD}
      CORS_ORIGIN: "https://itocook.duckdns.org"
    depends_on:
      - postgres
      - directus

volumes:
  postgres_data:
  directus_uploads:
  directus_extensions:
```

Обрати внимание на отличия от dev версии:
- нет `ports` у directus/frontend/api (всё через Nginx)
- нет `volumes` с монтированием кода (`./frontend:/app`) — прод собирается из образа
- `restart: unless-stopped` везде
- uploads в named volume, не в `./directus/uploads`

### 3.4 `.github/workflows/deploy.yml`

```yaml
name: Deploy ItoCook

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Hetzner
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: root
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/itocook/app
            git pull origin main
            docker compose -f docker-compose.prod.yml build
            docker compose -f docker-compose.prod.yml up -d
```

### 3.5 PWA — `frontend/nuxt.config.ts`

```typescript
modules: ['@vite-pwa/nuxt'],
pwa: {
  manifest: {
    name: 'ItoCook',
    short_name: 'ItoCook',
    description: 'Управление кухней офиса',
    theme_color: '#ffffff', // подставишь свой
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  // у тебя уже есть sw.js — используем его
  strategies: 'injectManifest',
  srcDir: 'public',
  filename: 'sw.js',
},
```

Иконки — `public/icons/icon-192.png` и `icon-512.png`. Пока можно взять placeholder, потом заменишь.

---

## Этап 4 — На сервере: `.env` и запуск

```bash
# На сервере
cat > /opt/itocook/.env << 'EOF'
POSTGRES_USER=itocook
POSTGRES_PASSWORD=СГЕНЕРИРУЙ
POSTGRES_DB=itocook
DIRECTUS_KEY=СГЕНЕРИРУЙ
DIRECTUS_SECRET=СГЕНЕРИРУЙ
DIRECTUS_ADMIN_EMAIL=admin@itocook.local
DIRECTUS_ADMIN_PASSWORD=СГЕНЕРИРУЙ
NUXT_PUBLIC_VAPID_PUBLIC_KEY=ИЗ_ТВОЕГО_ЛОКАЛЬНОГО_ENV
VAPID_PUBLIC_KEY=ИЗ_ТВОЕГО_ЛОКАЛЬНОГО_ENV
VAPID_PRIVATE_KEY=ИЗ_ТВОЕГО_ЛОКАЛЬНОГО_ENV
VAPID_SUBJECT=mailto:твой@email.com
EOF
chmod 600 /opt/itocook/.env

# Генерируем значения
openssl rand -base64 32  # запускаем 3 раза для PASSWORD, KEY, SECRET

# Клонируем репо
cd /opt/itocook
git clone git@github.com:ТВОЙ_ЮЗЕР/itocook.git app

# Первый запуск
cd app
docker compose -f docker-compose.prod.yml --env-file /opt/itocook/.env up -d
```

---

## Этап 5 — Nginx + HTTPS

```bash
cat > /etc/nginx/sites-available/itocook << 'EOF'
server {
    listen 80;
    server_name itocook.duckdns.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name itocook.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/itocook.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/itocook.duckdns.org/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /cms/ {
        proxy_pass http://localhost:8055/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -s /etc/nginx/sites-available/itocook /etc/nginx/sites-enabled/
nginx -t

# Сначала certbot в http-only режиме (ssl блок закомментировать временно)
certbot --nginx -d itocook.duckdns.org
```

---

## Этап 6 — GitHub Actions ключ

```bash
# На сервере
ssh-keygen -t ed25519 -f /root/.ssh/deploy_key -N ""
cat /root/.ssh/deploy_key.pub >> /root/.ssh/authorized_keys
cat /root/.ssh/deploy_key  # копируешь в GitHub Secret
```

В репо → Settings → Secrets:
- `SERVER_HOST` = `178.104.110.253`
- `SERVER_SSH_KEY` = содержимое `deploy_key`

---

## Чеклист

```
[ ] 0. Зайти на сервер, снести OpenWebUI, docker prune
[ ] 1. Создать itocook.duckdns.org, настроить cron
[ ] 2. Переписать frontend/Dockerfile (multi-stage)
[ ] 3. Убрать --reload из api/Dockerfile
[ ] 4. Создать docker-compose.prod.yml
[ ] 5. Создать .github/workflows/deploy.yml
[ ] 6. npm install @vite-pwa/nuxt, настроить nuxt.config.ts
[ ] 7. Добавить иконки в public/icons/
[ ] 8. Запушить всё в main
[ ] 9. На сервере: mkdir, .env, git clone, docker compose up
[ ] 10. Nginx конфиг + certbot
[ ] 11. SSH deploy ключ → GitHub Secrets
[ ] 12. Проверить: пуш → автодеплой
[ ] 13. Открыть на iPhone → добавить на рабочий стол
```

---

Начинаем с **Этапа 0** — заходи на сервер и покажи `docker ps` и `docker compose ls`.


Что в плане уже идеально:
- ✅ docker-compose.prod.yml — 4 сервиса, без dev volumes, без port mapping
- ✅ injectManifest стратегия для PWA — твой ручной sw.js сохраняется
- ✅ api/Dockerfile без --reload
- ✅ Nginx с /cms/ и /api/ прокси
- ✅ Публичные URL заменены на домен
- ✅ Чеклист полный и в правильном порядке
  Что остаётся добавить/проверить перед стартом:
1. VAPID ключи — в .env плана они упомянуты, но нужно убедиться что твои локальные ключи совпадают с теми, что в frontend/.env (я их не вижу — vapidPublicKey: '' пустой в nuxt.config.ts)
2. nuxt.config.ts — сейчас нет @vite-pwa/nuxt, секция pwa: из плана добавится
3. Иконки — public/icons/icon-192.png, icon-512.png физически отсутствуют
4. npm install @vite-pwa/nuxt — нужно будет выполнить