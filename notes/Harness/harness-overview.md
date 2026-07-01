# Harness Overview — Самодиагностика агентной системы

> **Дата:** 2026-07-01
> **Агент:** OpenCode (deepseek-v4-flash-free)
> **Проект:** ItoCook
> **Цель:** Полная картина того, как устроена обвязка (harness) вокруг LLM, какие инструменты и навыки доступны, как принимаются решения и что защищает от ошибок.

---

## 1. Концепция Harness

**Harness (обвязка)** — это многослойная инфраструктура между разработчиком и сырой LLM. Она превращает модель, которая умеет только генерировать текст, в инженерного агента, который может читать файлы, писать код, ходить в базу данных, дебажить в браузере и документировать результаты.

В проекте ItoCook реализована **9-слойная структура**:

```
1. INSTRUCTION  — AGENTS.md, правила, запреты
2. CONTEXT      — progress.md, roadmap.md, design.md (что видит модель)
3. TOOLS        — MCP серверы (filesystem, git, Directus, Chrome DevTools, Playwright)
4. LOOP         — Think → Do → Verify (дисциплина выполнения)
5. MEMORY       — progress.md, architecture.md, docs/specs/, git log
6. SUBAGENTS    — context7, sequential-thinking, task (дочерние агенты)
7. VERIFICATION — TypeScript, DevTools, код-ревью
8. SANDBOX      — что можно и что нельзя без подтверждения
9. SKILLS       — 52 навыков, загружаемых по требованию
```

Схема слоев визуализирована в `notes/Harness/harness-diagram.html`.

---

## 2. AGENTS.md — Мозг системы

У агента **два уровня инструкций**:

### 2.1 Глобальный AGENTS.md (`~/.config/opencode/AGENTS.md`)

Определяет:
- **Поведение:** план перед большими изменениями, подтверждение перед коммитом, никогда не пушить без спроса
- **Запреты без разрешения:** `.env`, `nuxt.config.ts`, `docker-compose.yml`, миграции БД
- **English-Only Policy:** русский запрещен в коде, комментариях, документации (кроме `notes/`)
- **CSS/Layout:** Tailwind, flexbox/grid, никаких inline-стилей, px для мобильных
- **Skills Auto-Loading Rules:** 52 навыка, загружаемые по триггерам (security → auth/nginx, debugging → баги, UI → frontend и т.д.)
- **Working in External / Client Projects:** режим пониженной активности — без комментариев, документации, рефакторинга, новых зависимостей
- **Design System (Global Default):** читать `docs/design.md` перед UI-кодом, цветовые токены, Phosphor icons, `<script setup lang="ts">`

### 2.2 Проектный AGENTS.md (`/Users/DSAITO/Documents/BackEnd/itocook/AGENTS.md`)

Определяет:
- **9-шаговый Session Start:** (1) загрузить `using-agent-skills`, (2) загрузить 4 скилла стека, (3) git log, (4) progress.md, (5) sync check, (6) roadmap.md, (7) task-specific контекст, (8) task-specific скиллы, (9) отчёт о начале сессии
- **Definition of Done:** чеклист перед "готово" — progress.md обновлён, JSDoc добавлен, roadmap.md проверен, safety check пройден
- **Documentation Session:** автоматическая проверка отставания docs от HEAD (более 5 коммитов или >1 недели) → предложение обновить docs
- **Nuxt 4 структура:** все папки внутри `app/`
- **MCP серверы:** 8 серверов: filesystem, git, context7, directus, chrome-devtools, fetch, sequential-thinking, playwright
- **Directus permissions checklist:** проверять права перед новыми коллекциями
- **Vue 3 / Nuxt Gotchas:** `useDirectus` на верхнем уровне, `reactive()` для plain-object composables, DELETE 204 crash, `generateSW` стратегия
- **Операционные заметки:** Directus Flows не в git, CRON требует restart, `docs/specs/` для проектных спецификаций

### Что требует человеческого подтверждения

| Действие | Почему |
|----------|--------|
| Модификация `docker-compose.yml` | Может сломать всю инфраструктуру |
| Изменение `.env` | Содержит секреты, пароли, токены |
| Удаление Directus коллекций | Безвозвратная потеря данных |
| `git push` | Неявный деплой |
| Удаление файлов из `docs/` или `notes/` | Потеря документации |
| Изменение Directus permissions | Риск горизонтального эскалации |

---

## 3. Skills — Знания по требованию

Всего установлено **52 навыка** в `~/.config/opencode/skills/`. Все директории содержат актуальные `SKILL.md`. Пустые папки удалены. Агент загружает их перед каждой задачей.

### 3.1 Кастомные навыки (созданы специально для ItoCook)

| Навык | Назначение |
|-------|-----------|
| `security/` (5 файлов) | Безопасность: auth, API, frontend, стек, release checklist |
| `session-start/` | Boot-последовательность: прочитать docs, выдать сводку |
| `code-reviewer/` | Чеклист перед "готово": TS, Vue, Directus, Design |
| `code-review-and-quality/` | 5-осевое код-ревью с quality gates |

> **Security audit 2026-06-28** проведён через `security/` skill. Найдено: 3 CRITICAL (включая unrestricted `directus_users` read), 2 HIGH, 2 MEDIUM. Все исправлены. Полный отчёт: `docs/audits/security-audit.md`.

### 3.2 Superpowers навыки (через `npx superpowers`)

| Навык | Когда используется | Проблема, которую решает |
|-------|-------------------|-------------------------|
| `brainstorming/` | Перед новой фичей | Уточняет требования до кода |
| `spec-driven-development/` | Новая фича без спеки | Формализует требования |
| `planning-and-task-breakdown/` | Большая задача | Разбивает на шаги |
| `incremental-implementation/` | Любая реализация | Маленькие шаги, каждый проверяем |
| `debugging-and-error-recovery/` | Баги | Воспроизведи → локализуй → почини |
| `diagnose/` | Баги | Цикл: reproduce → minimise → hypothesis → fix |
| `codebase-health-check/` | Аудит архитектуры | Оценка кодовой базы, поиск углублений |
| `code-review-and-quality/` | Код-ревью | 5 осей проверки |
| `test-driven-development/` | Тесты | Red → Green → Refactor |
| `git-workflow-and-versioning/` | Коммиты/ветки | Чистая история |
| `documentation-and-adrs/` | Документация | ADR, glossary, JSDoc |
| `handoff/` | Длинная сессия | Упаковка контекста |
| `interview-me/` | Нечеткие требования | Вытягивает что нужно на самом деле |
| `grill-me/` | Стресс-тест плана | Допрос до кристальной ясности |
| `grill-with-docs/` | Стресс-тест с обновлением docs | Допрос + обновление CONTEXT.md |
| `zoom-out/` | Незнакомый код | Объяснение в контексте системы |
| `improve-codebase-architecture/` | Рефакторинг | Поиск углублений в архитектуре |
| `idea-refine/` | Сырая идея | Дивергентное + конвергентное мышление |
| `source-driven-development/` | Код с фреймворком | Проверка по официальной документации |
| `doubt-driven-development/` | Незнакомый/важный код | Adversarial review каждого решения |
| `context-engineering/` | Оптимизация контекста | Правильный контекст в нужное время |
| `finishing-a-development-branch/` | Завершение ветки | Чистый merge/PR |
| `executing-plans/` | Есть план | Выполнение с контрольными точками |
| `triage/` | Приоритизация багов | Упорядочивание issue по весу |
| `prototype/` | Быстрый прототип | Throwaway прототип для проверки идеи |
| `teach/` | Обучение | Пошаговое объяснение концепции |
| `write-a-skill/` | Создание навыка | Структура SKILL.md с bundled resources |
| `writing-skills/` | Создание навыка (superpowers) | Создание, редактирование, верификация |
| `receiving-code-review/` | Получение ревью | Техническая верификация feedback |
| `requesting-code-review/` | Запрос ревью | Проверка перед мержем |
| `using-superpowers/` | Мета-скилл | (загружен в начале сессии) |
| `using-git-worktrees/` | Изоляция | Работа через git worktree |
| `subagent-driven-development/` | Подзадачи | Исполнение через дочерних агентов |
| `setup-matt-pocock-skills/` | Начальная настройка | Конфигурация репозитория |
| `caveman/` | Экономия токенов | Ультра-краткий режим общения |

### 3.3 Скиллы стека (Nuxt / Vue / Tailwind / Directus)

| Навык | Когда используется |
|-------|-------------------|
| `nuxt/` | Любая Nuxt-работа |
| `nuxt-ui/` | Использование Nuxt UI компонентов |
| `vue/` | Vue 3, Composition API, composables |
| `tailwind-design-system/` | Tailwind токены, дизайн-система |
| `docker-expert/` | Docker, docker-compose проблемы |
| `frontend-ui-engineering/` | Продакшн-UI верстка |
| `api-and-interface-design/` | Дизайн API |
| `make-interfaces-feel-better/` | Полировка UI (тени, анимации, типографика) |
| `performance-optimization/` | Оптимизация производительности |
| `ci-cd-and-automation/` | CI/CD пайплайны |
| `shipping-and-launch/` | Прод-деплой чеклист |
| `deprecation-and-migration/` | Удаление старых систем |
| `browser-testing-with-devtools/` | DevTools MCP тесты |
| `dispatching-parallel-agents/` | Параллельные независимые задачи |
| `code-simplification/` | Упрощение кода без изменения поведения |
| `to-prd/` | Конвертация разговора в PRD |
| `to-issues/` | Разбивка PRD на задачи |
| `find-skills/` | Поиск нужного навыка |
| `verification-before-completion/` | Проверка перед "готово" |
| `customize-opencode/` | Настройка самого OpenCode |
| `writing-plans/` | Создание плана по шагам |
| `security-and-hardening/` | Харденинг кода от уязвимостей |
| `tdd/` | Test-driven development (красный-зеленый-рефакторинг) |

**Итого: 52 установленных навыка.**

---

## 4. MCP Серверы — Что агент может делать

### 4.1 Файловая система (filesystem MCP)

- Чтение/запись любых файлов проекта
- Поиск по шаблонам (glob) и содержимому (grep)
- **Пример:** `filesystem_read_file("app/pages/cook.vue")` — прочитать исходник

### 4.2 Git (git MCP)

- Статус, коммиты, логи, диффы
- **Пример:** `git_git_log({"repo_path": project, "max_count": 5})` — последние коммиты
- **Пример:** `git_git_commit({"repo_path": project, "message": "fix(auth): ..."})`

### 4.3 Web Fetch (fetch MCP + websearch)

- Скачивание страниц по URL
- **Пример:** `fetch_fetch({"url": "https://nuxt.com/docs/..."})` — актуальная документация
- **Пример:** `websearch({"query": "nuxt 4 middleware ..."})` — гугл-поиск

### 4.4 Directus MCP (`http://localhost:8055/mcp`)

- Полный CRUD коллекций, полей, отношений
- Создание Flows и Operations
- Чтение схемы перед работой
- **Пример:** `directus_collections({"action": "read"})` — список всех коллекций
- **Пример:** `directus_flows({"action": "create", "data": {...}})` — автоматизация

### 4.5 context7 (документация фреймворков)

- Живая документация Nuxt, Directus, Vue, Tailwind
- Всегда актуальные API, не из training data
- **Пример:** `context7_query-docs({"libraryId": "/nuxt/nuxt", "query": "server routes"})`

### 4.6 Chrome DevTools (отладка в браузере)

- Чтение console.log и ошибок
- Network requests (статусы, CORS)
- Скриншоты, Lighthouse аудит
- Performance trace
- **Пример:** `chrome-devtools_list_console_messages()` — ошибки JS
- **Пример:** `chrome-devtools_list_network_requests()` — 4xx/5xx

### 4.7 Playwright (E2E тесты)

- Полноценный браузерный тест-раннер
- Навигация, клики, заполнение форм, скриншоты
- Console message capture
- **Пример:** `playwright_browser_navigate({"url": "http://localhost:3000"})`
- **Пример:** `playwright_browser_snapshot()` — a11y-дерево страницы

### 4.8 Sequential Thinking

- Принудительное пошаговое рассуждение
- Для сложных архитектурных решений
- **Пример:** `sequential-thinking_sequentialthinking({"thought": "...", "nextThoughtNeeded": true})`

---

## 5. Система памяти

Агент не имеет долговременной памяти между сессиями. Память реализована через **trigger-based documentation**:

| Файл | Когда обновляется | Что содержит |
|------|-------------------|-------------|
| `docs/progress.md` | После каждого изменения | Статус, known issues, план на следующую сессию, git log |
| `docs/roadmap.md` | При завершении фазы | High-level roadmap, checkboxes, даты завершения |
| `docs/ARCHITECTURE.md` | Новый композабл/роут/паттерн | Структура, core-layer документация |
| `docs/architecture/*.md` | Новая фича | 8 файлов: cook-queue, recipe-system, finance, duty, shopping-list, auth-flow, notifications, deployment-pwa |
| `docs/CONTEXT.md` | Интервью с разработчиком | Глоссарий доменных терминов (40+ терминов) |
| `docs/specs/` | Новая фича без спецификации | Feature specs: purpose, inputs/outputs, edge cases |
| `docs/audits/*.md` | После аудита | Security audit, UI polish audit, refactoring plan |
| `docs/design.md` | При изменении дизайн-системы | Цвета, токены, шрифты, правила UI |
| `docs/skills-cheatsheet.md` | Новый скилл | Таблица навыков для разработчика |
| `docs-site/` | VitePress документация | 20+ страниц: архитектура, фичи, экраны, дизайн-система, roadmap |

**Принцип:** документы обновляются только при событиях (завершение фазы, новый баг, новая фича), а не по расписанию. Git log служит поисковой историей решений.

**.planning/** — удалён. Заменён на `docs/specs/` для хранения проектных спецификаций фич.

---

## 6. Рабочий цикл

Процесс — это **треугольник** из трех участников:

```
┌─────────┐     пишет промпты      ┌──────────┐     выполняет      ┌──────────┐
│ Claude  │ ────────────────────→ │ Dmitrii  │ ────────────────→ │ OpenCode │
│ (стратег│ ←──────────────────── │ (PO/QA)  │ ←──────────────── │ (исполнит)│
│ + диагн)│   результаты+скрины   │           │   отчет+код       │           │
└─────────┘                       └──────────┘                   └──────────┘
```

1. **Claude** (внешний, в браузере) — стратег и диагност. Пишет промпты на английском, анализирует результаты, придумывает решения.
2. **Dmitrii** (человек) — владелец продукта. Запускает промпты в терминале через OpenCode. Утверждает изменения. Делает визуальное QA.
3. **OpenCode** (агент, текущий) — исполнитель. Читает файлы, пишет код, ходит в Directus, дебажит в браузере, обновляет docs.

**Почему промпты на английском?** Потому что код, документация, комментарии — всё на английском (English-Only Policy). Claude пишет промпты на том же языке, что и код, чтобы избежать смешивания языков.

**"One change at a time"** — правило, добавленное после того, как множественные одновременные изменения инфраструктуры привели к дневному откату.

---

## 7. Safety Gates & Sandbox

### Жесткие gates (без подтверждения — ни шагу)

| Gate | Причина |
|------|---------|
| **nginx конфиги** | Был баг в конфиге → полный day-long outage |
| **Service Worker стратегия** | `injectManifest` → `generateSW` переключение сломало PWA сборку; `navigateFallback: null` критичен |
| **Docker Compose** | Может снести всю прод-инфраструктуру |
| **.env файлы** | Пароли, токены, VAPID ключи |
| **Directus permissions** | Риск горизонтального escalation (было: CRITICAL finding — `directus_users` unrestricted read) |
| **git push** | Деплой на прод без confirm |
| **Удаление коллекций/документов** | Безвозвратная потеря |

### Автономные действия (без спроса)

- Создание/редактирование Vue/TS компонентов
- Nuxt server routes
- Новые файлы в `docs/`
- Обновление `progress.md` и `roadmap.md`
- Новые Directus коллекции (без удаления существующих)
- Чтение любых файлов проекта

---

## 8. Извлеченные уроки

Правила, добавленные после того, как что-то пошло не так:

| Проблема | Что случилось | Правило, которое добавили |
|----------|---------------|--------------------------|
| **Multiple infra changes** | Одновременное изменение nginx + Directus + Docker привело к дневному откату | "One change at a time" |
| **Composable plain object refs** | `useParticipantsModal()` возвращал plain object → `v-if="pm.loading"` всегда true (Ref object truthy) | Оберни `reactive()` или верни `readonly(reactive({}))` |
| **useDirectus() in async** | Composables с useRuntimeConfig внутри setTimeout теряли Nuxt context | Зови useDirectus на верхнем уровне, не внутри async |
| **Horizontal escalation** | User policy имел create/update на `balances` и `transactions` без `$CURRENT_USER` фильтра | Admin-proxy паттерн + security audit |
| **Directus users exposed** | `directus_users` read permission возвращал все поля (включая email, токены) | Field-level restriction + audit |
| **DELETE 204 crash** | DELETE от Directus возвращает 204 No Content → `res.json()` падает | `res.text()` + conditional `JSON.parse` |
| **Calendar today highlight** | Выбранный день и сегодня конфликтовали визуально | `bg-purple-100 text-purple-700` для today отдельно |
| **PWA swSrc/swDest conflict** | `injectManifest` падал в Nuxt 4 из-за same-file conflict в `app/public/` | Переключение на `generateSW` |
| **Fork pattern needed** | Shared `recipes.cook` PATCH нарушал авторские права | Fork-on-cook: копия с `forked_from`, owned by cook |
| **Naming collision in composable** | `fetch()` внутри useTotalUsers вызывала сама себя | Внутренняя функция переименована в `fetchCount` |
| **CRON changes require restart** | Изменение CRON в UI не применялось до перезапуска | `docker compose restart directus` после CRON-правок |
| **Directus Flows not in git** | Flows в базе, не в git; production sync терялся | Заметка: Flows не version-controlled, нужен manual sync |

---

## 9. Tests

Полный план тестирования — `notes/tests-promt.md` (10 промптов, порядок: юниты → API → E2E → CI/CD).

### Unit Tests (Vitest)

| # | File | Что тестирует |
|---|------|-------------|
| 1 | `dedupRecipes.test.ts` | Дедупликация рецептов по `dish_name` — чистая функция, 7 кейсов |
| 2 | `useBalanceCheck.test.ts` | Баланс-гейт (−30€ threshold) — 7 кейсов, включая safe fallback |
| 3 | `deduction.test.ts` | Сплит затрат — `computePastaCost` + per-person share, 10 кейсов |
| 4 | `security.test.ts` | Регрессия безопасности — update-me whitelist, границы баланса, department field |

### API Tests (Vitest — server routes)

| # | File | Что тестирует |
|---|------|-------------|
| 5 | `auth-routes.test.ts` | Авторизация на server routes — 401 без токена, 403 для regular user |
| 6 | `validation.test.ts` | Валидация ввода — 400 на мусорных данных, whitelist полей |
| 7 | `permissions.test.ts` | Directus permission boundaries — чужие balances/transactions/users недоступны |

### E2E Tests (Playwright)

| # | File | Что тестирует |
|---|------|-------------|
| 8 | `auth.spec.ts` | Login/logout — валидные реквизиты редиректят, невалидные показывают ошибку |
| 9 | `cook-flow.spec.ts` | Become Cook + cook panel dish input |
| 10 | `join-flow.spec.ts` | Join meal, счётчик участников, BalanceWidget |

### CI/CD

| # | File | Что тестирует |
|---|------|-------------|
| 11 | `.github/workflows/test.yml` | GitHub Actions — автозапуск всех тестов при push/PR |

### Запуск

- Unit: `cd frontend && npx vitest run tests/unit/`
- API: `cd frontend && npx vitest run tests/api/`
- E2E: `cd frontend && npx playwright test tests/e2e/`

---

## Резюме

Этот harness превращает сырую LLM в инженерного агента, способного работать над продакшн-проектом без постоянного присмотра. 9 слоев (от инструкций до sandbox), 52 навыков для разных задач, 8 MCP-инструментов для файлов, git, БД, браузера, E2E-тестов и документации, trigger-based система памяти и safety gates, защищающие от катастрофических ошибок.

Без этой обвязки модель могла бы только генерировать текст. С ней она читает и пишет код, управляет схемой Directus, дебажит в Chrome DevTools и Playwright, использует живую документацию фреймворков, создает Flows и автоматизации, и запускает E2E-тесты в реальном браузере.

**Harness — это разница между "AI болталкой" и "AI инженером".**

---

## Заметка: Масштабирование Harness для проектов большего размера

Текущий харнес оптимизирован для проекта с 1-2 разработчиками и одним VPS.
Для команды 10+ человек и микросервисной архитектуры потребуются следующие улучшения:

1. **AGENTS.md монолитный** — сейчас ~900 строк. Нужна модульная система:
   один файл-роутинг → отдельные файлы на каждую доменную зону.

2. **Память не масштабируется** — progress.md линейный, через год будет 2000+ строк.
   Нужна БД или ротация по неделям/версиям.

3. **Тесты не встроены в харнес жёстко** — тесты есть, но нет правила
   "перед коммитом они обязаны пройти". AGENTS.md говорит "verify", но не принуждает.

4. **Code review только мой** — я проверяю сам себя. Для команды нужен
   второй человек (или агент) в цикле.

5. **Нет deployment staging** — push → сразу продакшн. Нужны staging +
   preview environments для команды.

6. **Secrets management** — `.env` руками на сервере. Нужен Vault
   или encrypted `.env` в репозитории.

7. **Monitoring не подключён** — харнес узнаёт об ошибках только когда разработчик
   скажет. Нужны алерты: упавшие тесты → авто-issue, 500-ки → срабатывание.

**Вывод:** База (9 слоёв, safety gates, trigger-based docs, skills) останется той же.
Эволюция потребуется в модульности, автоматизации проверок и инфраструктуре.


По тестам — да, следующая сессия, там всё уже готово.
По остальным пунктам честно:
Можем закрыть сейчас (или скоро):

"Тесты перед коммитом" — одна строка в Definition of Done: [ ] tests pass: npm run test. Добавить в глобальный файл.
"AGENTS.md монолитный" — это как раз харнес-репо которое мы обсуждали. Там файлы разделятся естественно.

Это уже не харнес, это инфраструктура проекта:

Staging/preview environments — CI/CD задача
Secrets management — Vault, отдельная тема
Monitoring — отдельная тема

Code review — у тебя пока один разработчик, не актуально.
Memory/progress.md — это реально станет проблемой через полгода. Но решение простое: раз в фазу агент архивирует старые записи в docs/archive/progress-phase-N.md и оставляет только текущее. Одна строка в AGENTS.md.
Из всего этого стоит добавить сейчас только две вещи:

Тесты в Definition of Done
Архивация progress.md по фазам

Остальное — когда будет реальная необходимость. Добавить эти два пункта?
