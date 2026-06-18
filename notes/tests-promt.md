# ItoCook — Test Prompts

Порядок: сначала юнит тесты (Vitest), потом Playwright E2E.
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

## Playwright E2E тесты

Playwright тестирует реальный браузер против работающего приложения.
Перед запуском убедись что Docker запущен: `docker-compose up -d`
Файлы кладём в `frontend/tests/e2e/`.

---

### Промпт 4 — установка Playwright + login тест

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

### Промпт 5 — Become Cook flow

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

### Промпт 6 — Join meal flow

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

## Запуск всех тестов

После того как все промпты выполнены, запусти одним промптом:

```
Read AGENTS.md.

Run all tests and report results.

Step 1: Run unit tests:
  cd frontend && npx vitest run tests/unit/

Step 2: Make sure Docker is running, then run E2E tests:
  cd frontend && npx playwright test tests/e2e/

Report:
- Which tests passed
- Which tests failed and why
- Fix any obvious selector mismatches (wrong placeholder text, wrong button text)
  by checking the actual .vue files
- Do NOT rewrite test logic, only fix selectors if needed

Update docs/progress.md with test results summary.
```
