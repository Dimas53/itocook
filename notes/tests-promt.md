# ItoCook — Test Prompts

Порядок: сначала юнит тесты (Vitest), потом API тесты, потом Playwright E2E, потом CI/CD.
Каждый промпт запускать отдельной сессией. Не смешивать.

---

## Юнит тесты (Vitest)

Vitest встроен в Nuxt — дополнительная установка не нужна.
Файлы кладём в `frontend/tests/unit/`.

---

### Промпт 1 — dedupRecipes()

Самая важная утилита проекта — дедупликация рецептов по dish_name.
Логика нетривиальная: показываем только последний форк или оригинал.
Идеальна для юнит теста — чистая функция, нет зависимостей.

```
Read AGENTS.md.

Set up Vitest for the Nuxt project and write unit tests for dedupRecipes utility.

Step 1: Check if vitest is already configured in frontend/nuxt.config.ts.
If not, add vitest config block. Check package.json for existing test script.

Step 2: Create frontend/tests/unit/dedupRecipes.test.ts

Test cases:
1. Empty array returns empty array
2. Single recipe returns that recipe
3. Two recipes with different dish_name — both returned
4. Two recipes with same dish_name, no forked_from — return only the one with later date_created
5. Original + fork with same dish_name — return only the fork (forked_from is set)
6. Two forks of the same original — return only the latest fork by date_created
7. Mix of unique and duplicate dish names — dedup only duplicates, keep all unique

Use vi.fn() mocks where needed. Do NOT install any new packages.
Run: cd frontend && npx vitest run tests/unit/dedupRecipes.test.ts to verify.

Update docs/progress.md after done.
```

---

### Промпт 2 — useBalanceCheck

Логика баланс-гейта — блокирует join и become-cook если баланс ниже -30 €.
Если сломается, пользователи не смогут записаться или готовить без внятной ошибки.
Чистая логика с threshold и safe fallback — идеально для юнит теста.

```
Read AGENTS.md.

Write unit tests for useBalanceCheck composable.

Create frontend/tests/unit/useBalanceCheck.test.ts

Read the actual file frontend/app/composables/useBalanceCheck.ts first
to understand the exact function signatures and MIN_BALANCE constant.

Test cases:
1. Balance above threshold (e.g. 10.00) — check() returns { allowed: true }
2. Balance exactly at 0 — returns { allowed: true }
3. Balance at exactly -30 — returns { allowed: false } (at threshold, blocked)
4. Balance below threshold (e.g. -50) — returns { allowed: false }
5. Balance just above threshold (e.g. -29.99) — returns { allowed: true }
6. API call fails (mock fetch to throw) — returns { allowed: true, balance: 0 } (safe fallback)
7. User has no balance record (empty array from API) — treated as 0, returns { allowed: true }

Mock useDirectus and the request function with vi.fn().
Do NOT install any new packages.
Run: cd frontend && npx vitest run tests/unit/useBalanceCheck.test.ts to verify.

Update docs/progress.md after done.
```

---

### Промпт 3 — Deduction split calculation

Расчёт суммы на участника — финансовая логика, ошибка здесь = неправильные списания.
Тестируем: базовый сплит, паста-пакеты, округление, крайние случаи (1 участник, 0 пакетов).

```
Read AGENTS.md.

Write unit tests for meal cost calculation logic.

Create frontend/tests/unit/deduction.test.ts

Read these files first to understand actual signatures:
- frontend/app/composables/useMealCost.ts (computePastaCost function)
- frontend/app/composables/useDeduction.ts (per-person share calculation)

Test computePastaCost():
1. 2 pasta packages × 1.00 € price = 2.00 €
2. 0 packages — returns 0.00 €
3. 3 packages × 1.50 € = 4.50 €
4. Fractional price (1.25 €) × 4 packages = 5.00 € (no float drift)

Test per-person share calculation (extract or test via the composable):
1. Receipt 30 € ÷ 3 participants = 10.00 € each
2. Receipt 10 € + pasta 2 € ÷ 4 participants = 3.00 € each
3. Total 10 € ÷ 1 participant (cook alone) = 10.00 €
4. Uneven split: 10 € ÷ 3 = 3.33 € (check rounding to 2 decimal places)
5. Zero receipt amount + pasta cost — only pasta is split

Mock pastaPackagePrice ref where needed. Do NOT install any new packages.
Run: cd frontend && npx vitest run tests/unit/deduction.test.ts to verify.

Update docs/progress.md after done.
```

---

### Промпт 4 — Security regressions

Тесты на регрессию безопасности — фиксируют то что нашли
в аудите 2026-06-28. Если кто-то случайно расширит permissions
или уберёт whitelist — тесты это поймают.

```
Read AGENTS.md.
Write unit tests for security regressions found in docs/audits/security-audit.md.
Create frontend/tests/unit/security.test.ts

Read these files first:
- server/api/users/update-me.patch.ts (whitelist logic)
- frontend/app/composables/useBalanceCheck.ts (MIN_BALANCE constant)
- frontend/app/composables/useMealCost.ts (deduction logic)

Test 1 — update-me field whitelist strips dangerous fields:
- Extract or mock the whitelist logic from update-me.patch.ts
- Input body: { role: 'admin', email: 'hack@evil.com', department: 'Vertrieb', avatar: 'uuid-123' }
- Expect sanitized result to contain ONLY department and avatar
- Expect role and email to be absent

Test 2 — balance gate boundary values:
- Balance -30.00 → { allowed: false } (at threshold, blocked)
- Balance -29.99 → { allowed: true } (just above, allowed)
- Balance -30.01 → { allowed: false } (just below, blocked)

Test 3 — department survives save (regression 2026-06-28):
- Mock PATCH to /api/users/update-me returning success
- Call with { department: 'Vertrieb' }
- Expect composable state to reflect 'Vertrieb' after response
- (caught manually on prod — this test prevents recurrence)

Test 4 — deduction handles zero and edge cases without crash:
- 0 € receipt ÷ 5 participants = 0.00 € per person (not negative)
- 10 € receipt ÷ 0 participants = handle gracefully, return 0 (no division by zero crash)

Mock useDirectus and request with vi.fn().
Do NOT install any new packages.
Run: cd frontend && npx vitest run tests/unit/security.test.ts to verify.
Update docs/progress.md after done.
```

---

## API тесты (Vitest — server routes)

Тестируем server routes напрямую — без браузера, без Playwright.
Файлы кладём в `frontend/tests/api/`.

---

### Промпт 5 — Auth & authorization на server routes

Проверяем что каждый защищённый роут отклоняет неавторизованные
и недостаточно привилегированные запросы.

```
Read AGENTS.md.

Write API tests for server route authorization.

Create frontend/tests/api/auth-routes.test.ts

Read these files first:
- server/api/users/update-me.patch.ts
- server/api/deduction/confirm.post.ts
- server/api/settings/pasta-price.patch.ts
- server/api/users/list.get.ts

Test: unauthenticated requests return 401
- POST /api/deduction/confirm without cookie → expect 401
- PATCH /api/users/update-me without cookie → expect 401
- PATCH /api/settings/pasta-price without cookie → expect 401
- GET /api/users/list without cookie → expect 401

Test: public routes work without auth
- GET /api/push/vapid-key → expect 200
- POST /api/auth/signup with valid body → expect 200 or 409 (not 401)

Test: admin-only routes reject regular users
- GET /api/users/list with regular user token → expect 403
- PATCH /api/settings/pasta-price with regular user token → expect 403

Mock getCookie() and Directus /users/me response with vi.fn().
Do NOT install any new packages.
Run: cd frontend && npx vitest run tests/api/auth-routes.test.ts
Update docs/progress.md after done.
```

---

### Промпт 6 — Input validation на server routes

Проверяем что роуты отклоняют невалидные данные
и не падают с 500 на мусорном вводе.

```
Read AGENTS.md.

Write API tests for server route input validation.

Create frontend/tests/api/validation.test.ts

Read these files first:
- server/api/deduction/confirm.post.ts
- server/api/users/update-me.patch.ts
- server/api/finance/ (all routes)

Test deduction/confirm.post.ts:
- Missing cookQueueId → expect 400
- amount as string instead of number → expect 400
- Negative amount → expect 400
- participants count = 0 → expect 400 or graceful 0.00 per person

Test update-me.patch.ts field whitelist:
- Body { role: 'admin', email: 'x@y.com', department: 'IT' }
- Expect only department to reach Directus PATCH
- Expect role and email to be stripped before forwarding

Test finance top-up (if route exists):
- amount = -100 → expect 400
- userId = 'nonexistent' → expect 404 or 400
- Missing userId → expect 400

Mock Directus responses with vi.fn().
Do NOT install any new packages.
Run: cd frontend && npx vitest run tests/api/validation.test.ts
Update docs/progress.md after done.
```

---

### Промпт 7 — Permission boundary tests (Directus)

Проверяем что Directus permissions не дают юзеру
читать чужие данные или писать куда не следует.

> ⚠️ Требует запущенного Docker: `docker-compose up -d`

```
Read AGENTS.md.

Write permission boundary tests against local Directus instance.
These tests require Docker running: docker-compose up -d

Create frontend/tests/api/permissions.test.ts

Use real HTTP requests to http://localhost:8055 with test user tokens.
Login as u1@dev.com / 123456 to get a real user token before each test.

Test: user cannot read other users' balances
- GET /items/balances (no filter) → expect only own balance record
- GET /items/balances?filter[user][_eq]=OTHER_USER_ID → expect 0 results or 403

Test: user cannot read other users' transactions
- GET /items/transactions (no filter) → expect only own transactions
- GET /items/transactions?filter[user][_eq]=OTHER_USER_ID → expect 0 results or 403

Test: user cannot read sensitive fields from directus_users
- GET /users/OTHER_USER_ID → expect 403 or only allowed fields
- Response must NOT contain: password, token, tfa_secret, auth_data

Test: user cannot create transactions directly
- POST /items/transactions with { amount: 100, user: OWN_ID } → expect 403

Test: user cannot update other users' cook_queue entries
- Find a cook_queue entry not owned by u1
- PATCH /items/cook_queue/OTHER_ENTRY_ID → expect 403

Run: cd frontend && npx vitest run tests/api/permissions.test.ts
Update docs/progress.md after done.
```

---

## Playwright E2E тесты

Playwright тестирует реальный браузер против работающего приложения.
Перед запуском убедись что Docker запущен: `docker-compose up -d`
Файлы кладём в `frontend/tests/e2e/`.

---

### Промпт 8 — Установка Playwright + login тест

Самый базовый тест — без логина ничего не работает.
Установка Playwright делается один раз, остальные тесты используют её же.

```
Read AGENTS.md.

Set up Playwright and write the login E2E test.

Step 1: Install Playwright in frontend/:
  cd frontend && npm init playwright@latest -- --quiet --browser=chromium --no-examples

Step 2: Create frontend/tests/e2e/auth.spec.ts

Test: Login with valid credentials
- Navigate to http://localhost:3001 (dev server port)
- Expect redirect to /auth
- Fill email field with 'u1@dev.com'
- Fill password field with '123456'
- Click login button
- Wait for navigation
- Expect URL to be / or /cook (not /auth)
- Expect page to not contain error message

Test: Login with invalid credentials
- Navigate to /auth
- Fill email 'wrong@email.com', password 'wrongpass'
- Click login button
- Expect error message to be visible
- Expect URL to still be /auth

Use page.getByPlaceholder() or page.locator() to find elements.
Check actual input placeholders in auth.vue before writing selectors.

Do NOT run the tests yet — just set up and write them.
Update docs/progress.md after done.
```

---

### Промпт 9 — Become Cook flow

Ключевой бизнес-сценарий: пользователь назначает себя поваром.
Если этот флоу сломается — вся система не работает.

```
Read AGENTS.md.

Write Playwright E2E test for the "Become Cook" flow.

Create frontend/tests/e2e/cook-flow.spec.ts

Setup: create a helper function loginAs(page, email, password) that logs in
and waits for redirect to complete. Reuse across tests.

Test: Become cook for today
- Login as 'u2@dev.com' / '123456'
- Navigate to /kitchen
- If HeroBlock shows "No cook assigned" — click "I'm cooking today" button
- Expect redirect to /cook
- Expect page title or heading to contain cook-related text
- Expect URL to be /cook

Test: Cook panel shows dish input after assignment
- Login as 'u3@dev.com' / '123456'
- Navigate to /cook?action=become
- Expect "I'm cooking today!" button to be visible
- Click it
- Expect dish name input to appear (state transitions to 'dish')

Note: use different test users (u2, u3) to avoid conflicts between tests.
Use page.waitForURL() and page.waitForSelector() for async transitions.

Do NOT run the tests yet — just write them.
Update docs/progress.md after done.
```

---

### Промпт 10 — Join meal flow

Второй ключевой сценарий: участник подтверждает участие в обеде.
Тестируем что счётчик меняется и кнопка переключается в состояние "Joined".

```
Read AGENTS.md.

Write Playwright E2E test for the "Join meal" flow.

Add to frontend/tests/e2e/cook-flow.spec.ts or create join-flow.spec.ts

Precondition note: This test requires an active cook_queue entry for today.
Add a skip condition: if HeroBlock shows no cook assigned, skip the test with
test.skip() and a message "No cook assigned for today — run become-cook test first".

Test: Join today's lunch
- Login as 'u4@dev.com' / '123456'
- Navigate to / (home)
- Check if "I'm having lunch" button is visible in HeroBlock
- If visible: click it
- Expect button text to change to "Joined ✓" or similar
- Expect participant count to increase by 1

Test: Balance widget is visible on home page
- Login as 'u5@dev.com' / '123456'
- Navigate to /
- Expect BalanceWidget to be visible
- Expect it to contain '€' symbol

Use page.locator() with text matchers. Check actual button text in HeroBlock.vue
before writing assertions.

Do NOT run the tests yet — just write them.
Update docs/progress.md after done.
```

---

## CI/CD — Автозапуск тестов

После того как все тесты написаны и проходят локально —
настроить автозапуск при каждом пуше.

---

### Промпт 11 — GitHub Actions pipeline

```
Read AGENTS.md.
Read ~/.config/opencode/skills/ci-cd-and-automation/SKILL.md

Set up GitHub Actions for automatic test runs on every push.

Create .github/workflows/test.yml

Pipeline steps:
1. Trigger: on push to main and on pull_request
2. Setup: node 20, npm ci in frontend/
3. Step 1 — Unit tests:
   cd frontend && npx vitest run tests/unit/
4. Step 2 — API unit tests (no Docker needed):
   cd frontend && npx vitest run tests/api/auth-routes.test.ts
   cd frontend && npx vitest run tests/api/validation.test.ts
5. Step 3 — E2E tests (needs Docker):
   Run docker-compose up -d
   Wait for services healthy
   cd frontend && npx playwright test tests/e2e/
   docker-compose down

On failure: post summary of which tests failed.
Fail the pipeline if ANY test fails (exit code != 0).

Do NOT run locally — just create the workflow file.
Update docs/progress.md after done.
Commit: "ci: add GitHub Actions test pipeline"
```

---

## Запуск всех тестов

После того как все промпты выполнены:

```
Read AGENTS.md.

Run all tests and report results.

Step 1 — Unit tests (no Docker needed):
  cd frontend && npx vitest run tests/unit/

Step 2 — API unit tests (no Docker needed):
  cd frontend && npx vitest run tests/api/auth-routes.test.ts
  cd frontend && npx vitest run tests/api/validation.test.ts

Step 3 — Make sure Docker is running, then E2E + permission tests:
  docker-compose up -d
  cd frontend && npx playwright test tests/e2e/
  cd frontend && npx vitest run tests/api/permissions.test.ts

Report:
- Which tests passed ✅
- Which tests failed ❌ and why
- Fix any obvious selector mismatches (wrong placeholder text, wrong button text)
  by checking the actual .vue files
- Do NOT rewrite test logic, only fix selectors if needed

Update docs/progress.md with full test results summary.
```

---

## Порядок всех промптов

```
Юниты:    1 dedupRecipes → 2 useBalanceCheck → 3 deduction → 4 security
API:      5 auth routes  → 6 validation      → 7 permissions (Docker)
E2E:      8 Playwright setup → 9 cook flow   → 10 join flow
CI/CD:    11 GitHub Actions
Финал:    Запуск всех
```