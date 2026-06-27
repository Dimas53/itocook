# План деплоя ItoCook — актуальная версия (июнь 2026)

> Сервер: Hetzner CX23, IP `178.104.110.253`
> Домен: `itocook.duckdns.org`
> Репо: `/opt/itocook/app`
> Env: `/opt/itocook/.env` (основной) + `/opt/itocook/app/.env` (копия для compose)

---

## Этап 0 — Чистим сервер ✅ СДЕЛАНО

```bash
ssh root@178.104.110.253
docker ps
docker compose ls
cd /opt
docker compose down -v
docker system prune -af
crontab -e  # убираем старые строки
rm /etc/nginx/sites-enabled/dimasai* 2>/dev/null
nginx -t && systemctl reload nginx
```

---

## Этап 1 — DuckDNS ✅ СДЕЛАНО

```bash
mkdir -p /opt/duckdns
cat > /opt/duckdns/duck.sh << 'DUCK'
echo url="https://www.duckdns.org/update?domains=itocook&token=ВАШ_ТОКЕН&ip=" | curl -k -o /opt/duckdns/duck.log -K -
DUCK
chmod +x /opt/duckdns/duck.sh
/opt/duckdns/duck.sh
crontab -e
# добавить: */5 * * * * /opt/duckdns/duck.sh >/dev/null 2>&1
```

⚠️ DuckDNS иногда слетает — если сайт недоступен, запусти `/opt/duckdns/duck.sh` вручную и подожди 2-3 минуты.

---

## Этап 2 — Структура на сервере ✅ СДЕЛАНО

```
/opt/itocook/.env        ← основной env (не в git!)
/opt/itocook/app/        ← git clone репозитория
/opt/itocook/app/.env    ← копия основного .env для docker compose
```

При деплое копируется:
```bash
cp /opt/itocook/.env /opt/itocook/app/.env
```

---

## Этап 3 — Файлы в репозитории ✅ СДЕЛАНО

### `frontend/Dockerfile.prod`
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```
⚠️ Путь `.output` с точкой, не `output`.

### `.github/workflows/deploy.yml`
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
            docker compose -f docker-compose.prod.yml --env-file /opt/itocook/.env up -d --build
```
⚠️ `--build` обязателен — иначе Docker берёт старый кешированный образ.

---

## Этап 4 — `.env` на сервере ✅ СДЕЛАНО

```
POSTGRES_USER=itocook
POSTGRES_PASSWORD=...
POSTGRES_DB=itocook
DIRECTUS_KEY=...
DIRECTUS_SECRET=...
DIRECTUS_ADMIN_EMAIL=admin@itocook.com
DIRECTUS_ADMIN_PASSWORD=...
NUXT_PUBLIC_DIRECTUS_URL=https://itocook.duckdns.org/cms
NUXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:твой@email.com
```

---

## Этап 5 — Nginx + HTTPS ✅ СДЕЛАНО

Актуальный рабочий конфиг (после фикса 26 июня 2026):

```nginx
server {
    server_name itocook.duckdns.org;

    # ⚠️ ВАЖНО: статика Directus (JS/CSS) должна идти ДО общего правила для статики
    # Иначе Nuxt перехватывает /cms/admin/assets/*.js и отдаёт HTML → MIME error
    location ~* ^(?!/cms/).*\.(js|css|png|jpg|svg|ico|webmanifest|map)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "public, max-age=3600";
    }

    location = /api/send-push {
        rewrite ^/api(/.*)$ $1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    location /cms/ {
        rewrite ^/cms(/.*)$ $1 break;
        proxy_pass http://127.0.0.1:8055;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/itocook.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/itocook.duckdns.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name itocook.duckdns.org;
    return 301 https://$host$request_uri;
}
```

⚠️ Не добавляй отдельные `location /admin/` или `location /assets/` блоки — они конфликтуют с `/cms/` и ломают Directus.
⚠️ Не добавляй `location = /push-handler.js { root /var/www; }` — файла там нет, запрос должен идти в Nuxt через `location /`.

---

## Этап 6 — GitHub Actions SSH ключ ✅ СДЕЛАНО

```bash
ssh-keygen -t ed25519 -f /root/.ssh/deploy_key -N ""
cat /root/.ssh/deploy_key.pub >> /root/.ssh/authorized_keys
cat /root/.ssh/deploy_key  # копировать в GitHub Secret
```

GitHub → Settings → Secrets:
- `SERVER_HOST` = `178.104.110.253`
- `SERVER_SSH_KEY` = содержимое `deploy_key`

---

## Управление на сервере

```bash
# Статус контейнеров
docker ps

# Ручной перебилд (если автодеплой взял кеш)
cd /opt/itocook/app
git pull
docker compose -f docker-compose.prod.yml --env-file /opt/itocook/.env build --no-cache frontend
docker compose -f docker-compose.prod.yml --env-file /opt/itocook/.env up -d frontend

# Проверка что манифест подключён
curl -s https://itocook.duckdns.org | grep -i manifest

# Проверка SW
curl -I https://itocook.duckdns.org/sw.js

# Проверка Directus JS (должен быть X-Powered-By: Directus, не Nuxt)
curl -I "https://itocook.duckdns.org/cms/admin/assets/vue-router-DVuWcUA5.js"

# DuckDNS вручную если сайт недоступен
/opt/duckdns/duck.sh && cat /opt/duckdns/duck.log

# Логи
docker logs itocook-frontend --tail 50
docker logs itocook-directus --tail 50
docker logs itocook-api --tail 50
```

---

## Известные проблемы и решения

| Проблема | Причина | Решение |
|----------|---------|---------|
| Dockerfile копировал в `output/` | Неверный путь | Исправлен на `.output/` |
| Admin login 400 Invalid email | `.local` домен невалиден в Directus 11 | Использовать `admin@itocook.com` |
| `NUXT_PUBLIC_DIRECTUS_URL` не set | Переменная отсутствовала в `.env` | Добавлена |
| Directus админка: JS MIME type error | nginx блок `~* \.(js\|css...)` перехватывал `/cms/admin/assets/*.js` и отдавал через Nuxt → HTML | Фикс 26.06.2026: regex `^(?!/cms/).*` исключает /cms/ из этого правила |
| Открываются лишние окна DevTools | Vue.js DevTools расширение Chrome | Удалить расширение |
| Сайт недоступен (ERR_NAME_NOT_RESOLVED) | DuckDNS не обновился | Запустить `/opt/duckdns/duck.sh` вручную |
| Docker берёт кеш при автодеплое | `up -d` без `--build` | Добавлен `--build` флаг в deploy.yml |

---

## Phase 6 — Текущее состояние уведомлений

### In-app уведомления ✅ ПОЛНОСТЬЮ РАБОТАЮТ

- Коллекция `notifications` в Directus — permissions настроены
- 6 Directus Flows: Cook Assigned, Lunch Ready, Balance Low, Morning Reminder, Duty Reminder, Duty Assigned
- Utility Flow `[Util] Create Notification`
- `useNotifications` composable — fetch, markAsRead, markAllAsRead, poll 20s
- `NotificationBell` на всех страницах
- `/notifications` страница — список, иконки, timeAgo, markAllAsRead

### PWA ✅ РАБОТАЕТ (iPhone)

- Иконка на экране «Домой» — работает
- Открывается в standalone режиме (без адресной строки) — работает
- `@vite-pwa/nuxt` установлен, `generateSW` стратегия
- Иконки: `frontend/public/icons/icon-192.png` и `icon-512.png`

### Push-уведомления ⚠️ ЧАСТИЧНО

| Компонент | Статус |
|-----------|--------|
| VAPID ключи в `.env` | ✅ |
| `push_subscriptions` коллекция в Directus | ✅ |
| FastAPI `/send-push` endpoint | ✅ |
| `push-handler.js` в `frontend/app/public/` | ✅ |
| `usePushNotifications.ts` | ✅ |
| Firefox desktop | ✅ работает |
| Chrome desktop | ❌ `push service error` |
| iPhone Safari / PWA | ❌ не проверялось после починки |
| Directus Flows → `/api/send-push` | ✅ все 6 флоу отправляют |

---

## Phase 6b — Что нужно доделать по push уведомлениям

### Проблема 1: SW отсутствует на сервере
При откате к `db5aa18` SW был удалён с сервера. Нужно вернуть.

**Что нужно сделать:**
1. В `app.vue` добавить в `app.head`:
   ```js
   { rel: 'manifest', href: '/manifest.webmanifest' }
   ```
2. SW сейчас генерируется через `generateSW` — нужно убедиться что `push-handler.js` подключается через `workbox.importScripts`
3. Убрать `location = /push-handler.js { root /var/www; }` из nginx если он там есть

### Проблема 2: Chrome push service error
Chrome использует FCM. Проверки:
```bash
# FCM доступен с сервера (уже проверено — да, доступен)
curl -v https://fcm.googleapis.com 2>&1 | tail -5

# VAPID key формат (должно быть 87 символов)
curl -s https://itocook.duckdns.org/api/push/vapid-key

# Логи FastAPI при отправке
docker logs itocook-api --tail 50
```

### Проблема 3: iPhone push не тестировался
После того как SW заработает — протестировать на iPhone через PWA (иконка на экране).

### Урок из сессии 26.06.2026
⚠️ НЕ ИСПОЛЬЗУЙ `navigateFallback` в Workbox конфиге — это перехватывает все навигационные запросы включая Directus и ломает всё.
⚠️ НЕ МЕНЯЙ стратегию SW (injectManifest/generateSW) без понимания — каждая смена оставляет мусор в кеше браузера.
⚠️ SW с scope `/` перехватывает ВСЕ запросы — тестируй на чистом профиле браузера.

---

## Чеклист

```
[x] 0. Зайти на сервер, снести OpenWebUI, docker prune
[x] 1. DuckDNS itocook.duckdns.org + cron каждые 5 минут
[x] 2. frontend/Dockerfile.prod — multi-stage, путь .output
[x] 3. api/Dockerfile — без --reload
[x] 4. docker-compose.prod.yml — 4 сервиса, VAPID env vars
[x] 5. .github/workflows/deploy.yml — auto-deploy + --build флаг
[x] 6. .env на сервере — все секреты включая VAPID
[x] 7. Nginx конфиг — фикс MIME type для Directus JS
[x] 8. Let's Encrypt HTTPS через certbot
[x] 9. SSH deploy key → GitHub Secrets
[x] 10. Автодеплой работает: push → build → up ✅
[x] 11. Сайт открывается, логин работает ✅
[x] 12. Directus админка работает ✅
[x] 13. PWA — установка на iPhone ✅
[x] 14. In-app уведомления ✅
[ ] 15. Push уведомления на iPhone — не завершено
[ ] 16. Chrome push — не работает (низкий приоритет)
```

---

## Push Notifications — Browser Support (27.06.2026)

- **iPhone Safari / PWA**: ✅ работает
- **Firefox desktop**: ✅ работает
- **Chrome desktop**: ❌ `push service error` (низкий приоритет, FCM)

### Уроки сессии 27.06.2026

- `user` field must be passed explicitly when creating `push_subscriptions` — одного `$CURRENT_USER` preset в Directus permissions недостаточно для корректной фильтрации подписок по ID пользователя в FastAPI `/send-push`
- `navigateFallback: null` в workbox обязателен — без него SW перехватывает все навигационные запросы

### Что сделано (27.06.2026)

- [x] Добавлен `<link rel="manifest">` в `app.head` в `nuxt.config.ts`
- [x] Исправлен `usePushNotifications.ts` — передаётся `user: user.value?.id` при сохранении подписки
- [x] Добавлено Read permission для `push_subscriptions` в Directus User policy
- [x] Добавлен `navigateFallback: null` в workbox конфиг
- [x] Закоммичено и запущено: fix(pwa): disable navigateFallback in workbox
- [x] iPhone push — протестировано и работает
- [x] Cook Cancelled Flow — уведомляет всех пользователей при отмене готовки
- [x] Nightly Notification Cleanup Flow — удаляет уведомления старше 7 дней в 3:00
