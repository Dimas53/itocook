# ItoCook — Agent Harness Upgrade Plan

## Оглавление

1. [Что такое Harness и схема 9 слоёв](#1-harness)
2. [Что уже есть vs чего не хватает](#2-gap-analysis)
3. [Шаг 1 — Safety Rules в AGENTS.md](#шаг-1--safety-rules)
4. [Шаг 2 — Superpowers Framework](#шаг-2--superpowers-framework)
5. [Шаг 3 — Скилл session-start](#шаг-3--скилл-session-start)
6. [Шаг 4 — Скилл code-reviewer](#шаг-4--скилл-code-reviewer)
7. [Шаг 5 — Структура .planning/](#шаг-5--структура-planning)
8. [Опционально — Hermes Agent](#опционально--hermes-agent)

---

## 1. Harness

**Harness** — это вся инфраструктура вокруг LLM-модели.
Модель — это мозг. Harness — всё остальное что даёт мозгу инструменты, память и ограничения.

```
┌─────────────────────────────────────────────────┐
│                   HARNESS                        │
│                                                  │
│  1. ИНСТРУКЦИЯ     ← AGENTS.md                  │
│  2. КОНТЕКСТ       ← docs/, CONTEXT.md           │
│  3. ИНСТРУМЕНТЫ    ← MCP серверы                 │
│  4. ЦИКЛ           ← OpenCode loop               │
│  5. ПАМЯТЬ         ← progress.md (частично)      │
│  6. ПОМОЩНИКИ      ← ❌ нет                      │
│  7. ПРОВЕРКА       ← ❌ нет                      │
│  8. ПЕСОЧНИЦА      ← ❌ нет (нет запретов)       │
│  9. НАВЫКИ         ← базовые skills              │
│                                                  │
│              [ LLM ]                             │
└─────────────────────────────────────────────────┘
```

---

## 2. Gap Analysis

| Слой | Что есть | Что нужно добавить |
|---|---|---|
| Инструкция | ✅ AGENTS.md (глобальный + проектный) | + раздел ЗАПРЕЩЕНО |
| Контекст | ✅ docs/, CONTEXT.md, architecture/ | + .planning/ для фаз |
| Инструменты | ✅ filesystem, Directus, context7, git, fetch | — |
| Цикл | ✅ OpenCode | — |
| Память | 🟡 progress.md (плоский лог) | session-start скилл |
| Помощники | ❌ нет | code-reviewer скилл |
| Проверка | ❌ нет | code-reviewer скилл |
| Песочница | ❌ нет | Safety Rules в AGENTS.md |
| Навыки | 🟡 базовые | Superpowers framework |

**Приоритет:** Шаги 1-4 — высокий, делай сразу. Шаг 5 — опциональный на будущее.

---

## Шаг 1 — Safety Rules

**Что делаем:** добавляем раздел в `itocook/AGENTS.md` — явные запреты.

**Открой** `itocook/AGENTS.md` и добавь в конец:

```markdown
## SAFETY — Запрещено без явного подтверждения

Перед любым из этих действий СТОП — спроси пользователя:

- Изменять `docker-compose.yml`
- Изменять `.env` файлы
- Удалять миграции или коллекции Directus
- Делать `git push` или `git push --force`
- Удалять файлы из `docs/` и `notes/`
- Менять Directus permissions для ролей

## БЕЗОПАСНО делать автономно

- Создавать и редактировать Vue/TS компоненты
- Создавать Nuxt server routes
- Добавлять новые файлы в docs/
- Обновлять progress.md и roadmap.md
- Читать любые файлы проекта
```

---

## Шаг 2 — Superpowers Framework

**Что это:** готовый набор скиллов для OpenCode — brainstorming, планирование,
TDD, code review. Устанавливается одной командой прямо в OpenCode.

**Установка — вставь в OpenCode чат:**

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

**Что активируется после установки:**

- `brainstorming` — агент сначала задаёт вопросы, потом кодит
- `writing-plans` — разбивает задачу на шаги по 2-5 минут с точными путями файлов
- `requesting-code-review` — сам ревьюит перед словами "готово"
- `systematic-debugging` — структурированный разбор когда что-то сломалось
- `test-driven-development` — RED → GREEN → REFACTOR цикл

**Проверка что установилось:**

```bash
ls ~/.config/opencode/skills/
# должны появиться папки superpowers скиллов
```

---

## Шаг 3 — Скилл session-start

**Что делаем:** создаём скилл который агент читает в начале каждой сессии.
Агент сам читает прогресс и выдаёт тебе сводку — не надо каждый раз объяснять где остановились.

**Создай файл** `~/.config/opencode/skills/session-start/SKILL.md`:

```markdown
# Session Start

Use this skill at the beginning of every new session.

## Trigger

Activate when the user says: "начнём", "start session", "что у нас",
"где остановились", "продолжаем", or when starting fresh work on ItoCook.

## Steps

1. Read `docs/progress.md` — last 20 lines
2. Read `docs/roadmap.md` — find current phase (look for unchecked items)
3. Read `docs/project-state.md` if exists
4. Output a session brief:

---
**Сессия начата**

Последнее сделано: [из progress.md]
Текущая фаза: [из roadmap.md]
Следующий шаг: [первый unchecked item]
Блокеры: [если есть]

Готов. Что делаем?
---

## Rules

- Do NOT start coding before outputting the brief
- Keep the brief under 10 lines
- Ask ONE clarifying question if next step is unclear
```

---

## Шаг 4 — Скилл code-reviewer

**Что делаем:** агент проверяет свою работу перед тем как сказать "готово".
Это слой 7 (Проверка) из харнес-схемы.

**Создай файл** `~/.config/opencode/skills/code-reviewer/SKILL.md`:

```markdown
# Code Reviewer

Activate after completing any code changes before reporting "done".

## Trigger

After finishing implementation, before saying "готово", "сделано", "done".

## Checklist

Run through this checklist mentally:

**TypeScript**
- [ ] No TypeScript errors (check imports, types, props)
- [ ] No `any` types added without comment
- [ ] Composables initialized at component level, not inside async handlers

**Vue / Nuxt**
- [ ] No `console.log` left in production code
- [ ] useDirectus() called at composable level (not inside onMounted)
- [ ] New pages have `definePageMeta({ layout: 'app' })`
- [ ] Phosphor icons use Ph prefix: PhHouse not House

**Directus**
- [ ] New collections have permissions added for User policy
- [ ] New fields are accessible via API (check field permissions)

**Design**
- [ ] Colors from design.md tokens only (no hardcoded hex)
- [ ] Font sizes from design.md scale
- [ ] Mobile safe areas respected (pt-[60px], pb-[100px])

## Output format

If all clear:
> ✅ Code review passed. [brief summary of what was done]

If issues found:
> ⚠️ Found [N] issues before marking done: [list]. Fixing now.

Then fix issues before reporting to user.
```

---

## Шаг 5 — Структура .planning/

**Что это:** дополнительный уровень над `docs/` — трекинг по фазам.
Агент знает в какой фазе находится, пишет план до начала и саммари после.

**Это на будущее** — для следующего проекта с нуля, или когда будешь делать
ItoCook v2. Для текущего этапа достаточно шагов 1-4.

Структура для референса:

```
.planning/
├── milestones/
│   ├── v1.0-REQUIREMENTS.md    ← что должно быть в релизе
│   └── v1.0-ROADMAP.md         ← когда
└── phases/
    └── 06-notifications/
        ├── PLAN.md              ← план фазы (пишет агент до начала)
        └── SUMMARY.md          ← итог фазы (пишет агент после)
```

**Промпт для агента чтобы он сам создал структуру под ItoCook:**

```
Look at docs/roadmap.md and docs/progress.md.
Create a .planning/ directory structure for the remaining phases of ItoCook.
For each uncompleted phase in roadmap.md, create a folder under .planning/phases/
with a PLAN.md file describing what needs to be done.
Follow this naming convention: NN-phase-name/ (e.g. 06-notifications/).
Do not modify any existing files.
```

---

## Опционально — Hermes Agent

**Что это:** персональный ассистент который живёт на сервере постоянно.
Не для кодинга — для личного использования. Общаешься через Telegram.

**Отличия от OpenCode:**
- Помнит все разговоры между сессиями
- Работает пока ты спишь (cron задачи)
- Доступен с телефона в Telegram
- Подключается к тем же моделям через OpenRouter

**Установка (отдельно от ItoCook, на свой Mac или VPS):**

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
hermes setup    # настроит всё интерактивно, подключишь OpenRouter
hermes gateway  # запустит Telegram бота
```

**Когда ставить:** когда закончишь ItoCook и захочешь поэкспериментировать
с персональным агентом. Сейчас не приоритет.

---

## Итоговый порядок действий

```
[ ] Шаг 1 — Safety Rules в AGENTS.md          (~5 мин, вручную)
[ ] Шаг 2 — Superpowers установка             (~5 мин, одна команда в OpenCode)
[ ] Шаг 3 — Создать session-start скилл       (~10 мин, создать файл)
[ ] Шаг 4 — Создать code-reviewer скилл       (~10 мин, создать файл)
[ ] Шаг 5 — .planning/ структура              (опционально, для будущих проектов)
[ ] Hermes Agent                               (опционально, после ItoCook)
```

После шагов 1-4 твой харнес закрывает все 9 слоёв из диаграммы.


## Как пользоваться после установки

### Superpowers

Просто работай как обычно — скиллы активируются автоматически по контексту.
Но можно явно запустить:
Plan this task before starting: [описание задачи]
Агент сначала напишет план по шагам, покажет тебе, и только потом пойдёт кодить.
Review your changes before marking done
Явный запрос ревью если хочешь убедиться.

### session-start

В начале каждой новой сессии OpenCode просто пиши:
начнём
или
где остановились?
Агент сам прочитает progress.md и roadmap.md и выдаст сводку.

### code-reviewer

Ничего писать не надо — работает автоматически после каждого изменения.
Если хочешь явно запустить:
Review what you just did

### Safety Rules

Ничего писать не надо — агент сам остановится перед опасными действиями
и спросит подтверждение. Ты увидишь сообщение типа:

> ⚠️ Собираюсь изменить docker-compose.yml. Подтвердить?