Отлично. Пишу подробный план.

---

# План: Деплой ItoCook + PWA + CI/CD

## Этап 0 — Подготовка сервера (чистим старое)

**0.1 Заходим на сервер**
```bash
ssh root@178.104.110.253
```

**0.2 Сносим OpenWebUI**
```bash
cd /opt  # или где был docker-compose для OpenWebUI
docker compose down -v  # -v удаляет volumes (данные OpenWebUI)
docker system prune -af  # чистим образы, контейнеры, кэш
```

**0.3 Удаляем старый DuckDNS крон и конфиг Nginx**
```bash
crontab -e  # убираем строку с dimasai.duckdns.org
ls /etc/nginx/sites-enabled/  # смотрим что там есть
# удаляем старые конфиги для dimasai
rm /etc/nginx/sites-enabled/dimasai*
rm /etc/nginx/sites-available/dimasai*
```

---

## Этап 1 — Новый домен DuckDNS

**1.1 Регистрируем itocook.duckdns.org**
- Идём на [duckdns.org](https://duckdns.org)
- Добавляем новый субдомен `itocook`
- Прописываем IP `178.104.110.253`

**1.2 Настраиваем авто-обновление IP на сервере**
```bash
mkdir -p /opt/duckdns
cat > /opt/duckdns/duck.sh << 'EOF'
echo url="https://www.duckdns.org/update?domains=itocook&token=ВАШ_ТОКЕН&ip=" | curl -k -o /opt/duckdns/duck.log -K -
EOF
chmod +x /opt/duckdns/duck.sh
crontab -e
# добавляем:
# */5 * * * * /opt/duckdns/duck.sh >/dev/null 2>&1
```

---

## Этап 2 — Структура проекта на сервере

**2.1 Создаём папку проекта**
```bash
mkdir -p /opt/itocook
cd /opt/itocook
```

**Структура будет такая:**
```
/opt/itocook/
├── docker-compose.yml      # Directus + PostgreSQL + Nuxt
├── .env                    # секреты (не в git!)
├── nginx/
│   └── itocook.conf        # конфиг виртуал хоста
└── app/                    # сюда CI/CD будет пулить код
```

---

## Этап 3 — Docker Compose на сервере

**3.1 Создаём `docker-compose.yml`**
```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  directus:
    image: directus/directus:latest
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      SECRET: ${DIRECTUS_SECRET}
      DB_CLIENT: pg
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      ADMIN_EMAIL: ${DIRECTUS_ADMIN_EMAIL}
      ADMIN_PASSWORD: ${DIRECTUS_ADMIN_PASSWORD}
      PUBLIC_URL: https://itocook.duckdns.org/cms
    volumes:
      - directus_uploads:/directus/uploads
      - directus_extensions:/directus/extensions

  nuxt:
    build:
      context: ./app
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      - directus
    environment:
      NUXT_PUBLIC_DIRECTUS_URL: https://itocook.duckdns.org/cms

volumes:
  postgres_data:
  directus_uploads:
  directus_extensions:
```

**3.2 Создаём `.env`** (этот файл никогда не идёт в git)
```bash
cat > /opt/itocook/.env << 'EOF'
DB_NAME=itocook
DB_USER=itocook
DB_PASSWORD=сгенерируй_сильный_пароль
DIRECTUS_SECRET=сгенерируй_случайную_строку_32символа
DIRECTUS_ADMIN_EMAIL=admin@itocook.local
DIRECTUS_ADMIN_PASSWORD=сгенерируй_пароль
EOF
chmod 600 /opt/itocook/.env
```

---

## Этап 4 — Dockerfile для Nuxt

В репозитории проекта создаёшь `Dockerfile` в корне:

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

---

## Этап 5 — Nginx + HTTPS

**5.1 Конфиг Nginx** (`/etc/nginx/sites-available/itocook`)
```nginx
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

    # Nuxt приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Directus CMS
    location /cms {
        proxy_pass http://localhost:8055;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**5.2 Включаем и получаем сертификат**
```bash
ln -s /etc/nginx/sites-available/itocook /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Сертификат через certbot
certbot --nginx -d itocook.duckdns.org
```

---

## Этап 6 — GitHub Actions CI/CD

**6.1 Структура в репозитории**
```
.github/
└── workflows/
    └── deploy.yml
```

**6.2 `deploy.yml`**
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
            docker compose -f /opt/itocook/docker-compose.yml build nuxt
            docker compose -f /opt/itocook/docker-compose.yml up -d nuxt
```

**6.3 Secrets в GitHub репозитории**

Идёшь в репо → Settings → Secrets and variables → Actions, добавляешь:
- `SERVER_HOST` = `178.104.110.253`
- `SERVER_SSH_KEY` = приватный SSH ключ (генерируем отдельный для деплоя)

**6.4 Генерируем деплой-ключ**
```bash
# На сервере
ssh-keygen -t ed25519 -f /root/.ssh/deploy_key -N ""
cat /root/.ssh/deploy_key.pub >> /root/.ssh/authorized_keys
cat /root/.ssh/deploy_key  # этот приватный ключ копируешь в GitHub Secret
```

**6.5 Клонируем репо на сервер**
```bash
cd /opt/itocook
git clone git@github.com:ТВОЙюзер/itocook.git app
```

---

## Этап 7 — PWA

После того как сайт живёт на HTTPS, добавляем PWA.

**7.1 Устанавливаем модуль**
```bash
npm install @vite-pwa/nuxt
```

**7.2 `nuxt.config.ts`**
```typescript
export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  pwa: {
    manifest: {
      name: 'ItoCook',
      short_name: 'ItoCook',
      description: 'Управление кухней офиса',
      theme_color: '#твой_цвет',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: '/',
    },
  },
})
```

**7.3 Иконки**

Нужны два файла в `public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

Можно сгенерировать на [favicon.io](https://favicon.io) или через Figma.

---

## Порядок выполнения

```
[ ] 0. Зайти на сервер, снести OpenWebUI, почистить Docker
[ ] 1. Создать itocook.duckdns.org, настроить крон
[ ] 2. Создать структуру /opt/itocook, .env
[ ] 3. Добавить Dockerfile в репо, запушить на GitHub
[ ] 4. Клонировать репо на сервер в /opt/itocook/app
[ ] 5. Поднять docker compose (postgres + directus + nuxt)
[ ] 6. Настроить Nginx + certbot HTTPS
[ ] 7. Настроить GitHub Actions + deploy ключ
[ ] 8. Проверить: пуш в main → авто-деплой
[ ] 9. Добавить @vite-pwa/nuxt, запушить → PWA готов
[ ] 10. Установить на iPhone через Safari → Поделиться → На экран Домой
```

---

Начинаем с Этапа 0 — заходи на сервер и пиши что видишь в Docker, посмотрим что там сейчас крутится.