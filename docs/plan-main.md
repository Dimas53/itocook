# ItoCook — Project Plan
### Azubi-Projekt · ITO Consult GmbH · 2025–2026

---

## 1. Idea & Problem

In the office, colleagues often cook lunch in turns or order food together. Currently this is managed through messengers, Excel spreadsheets and verbal agreements: who paid, who owes, who cooks today.

**ItoCook** is an internal web application that automates the entire process: lunch coordination, expense tracking, each participant's balance, and notifications — all in one place.

💡 **Important:** ItoCook is not just a cooking app. At its core it is **Splitwise for workplace processes**: a shared pool, expense tracking and participant coordination. The platform can scale to any company need:

| Scenario | Example |
|---|---|
| 🍽️ Office lunches | primary use case |
| ✈️ Business trips | split hotel, fuel, food costs |
| 🎉 Corporate events | shared collection, track contributions |
| 🛒 Office supplies | coffee, stationery, household items |

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Nuxt 4 + Vue 3 + TypeScript | SSR, routing, reactivity |
| Styles | Tailwind CSS | Fast layout, design system |
| CMS / API | Directus | REST API out of the box, role model, admin panel |
| Database | PostgreSQL | Reliable, works great with Directus |
| Microservice | FastAPI (Python) | Calculations, business logic, notifications |
| Orchestration | Docker Compose | One file — entire backend running |
| AI Assistant | OpenRouter API | Culinary chat, pay per token only |
| Font | Jost (Google Fonts) | Clean geometric grotesque |
| Icons | Phosphor Icons (`@phosphor-icons/vue`) | Always use Ph prefix: PhHouse, PhSparkle etc. |

---

## 3. Architecture

```
Browser (Nuxt 4)
      │
      ▼
Directus (REST API + Auth + Roles)
      │                    │
      ▼                    ▼
PostgreSQL            FastAPI (Python)
(all data)            (calculations, notifications)
                           │
                    ┌──────┴──────┐
                    ▼             ▼
             Email / Push    OpenRouter API
             (notifications) (AI assistant)
                                  │
                                  ▼
                         gemini-2.0-flash-lite
```

---

## 4. Design

Visual direction — modern mobile app with clean UI, cards and minimal clutter.
Reference: **ekilu** (AI-powered recipe app) — see `docs/design/` folder.

- **Font:** Jost
- **Icons:** Phosphor Icons
- **Styles:** Tailwind CSS
- **Design system:** see `docs/design.md` — single source of truth for all UI decisions

---

## 5. User Roles

| Page / Action | 👤 Participant | 👨‍🍳 Cook (today) | 🔧 Admin | 💼 Accountant |
|---|---|---|---|---|
| Home (view) | ✅ | ✅ | ✅ | ✅ |
| "I'm having lunch" | ✅ | ✅ | ✅ | ✅ |
| "I'm cooking today" | ✅ | — | ✅ | — |
| Cook page | ❌ | ✅ | ✅ | ❌ |
| Dish history | ✅ | ✅ | ✅ | ✅ |
| Add / edit recipe | ❌ | ✅ | ✅ | ❌ |
| Own balance | ✅ own only | ✅ own only | ✅ all | ✅ all |
| Top up balance | ❌ enter amount | ❌ | ✅ | ✅ |
| Finance page | ❌ | ❌ | ✅ | ✅ |
| Cleaning calendar (view) | ✅ | ✅ | ✅ | ✅ |
| Cleaning calendar (edit) | ❌ | ❌ | ✅ | ❌ |
| Cook queue (view) | ✅ | ✅ | ✅ | ✅ |
| Cook queue (sign up) | ✅ | ✅ | ✅ | ❌ |
| Notifications (own settings) | ✅ | ✅ | ✅ | ✅ |
| Ratings & reviews | ✅ anonymous | ✅ | ✅ | ❌ |

> UX rule: if login = today's cook → automatically open cook page, otherwise → home.

---

## 6. Database (Directus Collections)

```
users                — name, email, role, balance, department
meals                — date, cook, dish, status, photo
order_items          — user_id, meal_id, amount charged
recipes              — name, ingredients, steps, photo, servings
transactions         — type, amount, user, date
cook_queue           — who cooks, date, status
cleaning_schedule    — employee, date, confirmation status
ratings              — meal_id, score, anonymous comment
notifications        — type, trigger, user, sent_at
```

**Relations:**
- `meals` → `users` (cook)
- `order_items` → `meals`, `users`
- `ratings` → `meals`
- `transactions` → `users`
- `cook_queue` → `users`
- `cleaning_schedule` → `users`

> Note: if the system grows — users and finance can be moved to Supabase, leaving only dishes and organization in Directus.

---

## 7. MVP — One Full Working Day

### Morning
- Employee logs in, taps **"I'm cooking today"**
- Everyone receives email: *"[Name] is cooking today, dish will be announced later"*
- Cook selects dish from history or enters name manually

### Before lunch
- Everyone sees on home screen: who's cooking, what, when
- Taps **"I'm having lunch"** → added to participant list
- Sees current balance next to the button

### After cooking
- Cook taps **"Lunch is ready"** → all participants receive notification
- Cook enters receipt amount (e.g. 47.80 €)
- App divides by number of participants → charges each one

### End of day
- Each participant sees updated balance
- Accountant sees full transaction in finance section

---

## 8. Full Feature List

### 8.1 Core Features

- **"I'm cooking today"** — self-assignment, notification to all, status update
- **"I'm having lunch"** — one-tap confirmation, cancellation up to 24h before
- **"Lunch is ready"** — cook button, notification to all participants
- **Login** — personal for employees, shared for accountant/admin
- **Cleaning calendar** — manual or auto assignment by department/employee, month/week view

### 8.2 Cook Features

- Receipt photo upload + total amount entry (required for calculation)
- Dish history — list with search by name
- Recipe management — photo, ingredients, steps, save to DB, edit
- Select dish from history for today
- Recalculate ingredient quantities when participant count changes
- Product database for shopping list
- Shopping list — from recipes / DB / manual, export as text

### 8.3 Features for Everyone

- Quick lunch sign-up from home in one tap (cancel up to 24h before)
- Balance shown next to sign-up button
- Home widgets: who's cooking, dish, lunch status, cleaning calendar
- Cook queue — open calendar for volunteers
- Weekly menu — cook slot reservation, notifications, sign-up deadline (24h before, reminder 30h before)

### 8.4 Interactive & Voting

- Anonymous ratings and reviews per dish/cook
- Weekly vote: best dish, best cook (optional)
- Recipe API integrations (optional)

### 8.5 Finance & Balance

- Cost calculation — after receipt/amount upload, split among participants
- User balances — manual entry only (cash via accounting)
- Overall balance — all accounts and total remainder (admin/accountant only)
- Period expense report — all costs + manual purchase additions (optional)

### 8.6 Notifications

- Lunch sign-up reminder to all (Push / Email / WhatsApp)
- Lunch ready notification to participants
- Morning reminder 8:00–10:00 (repeat every 30 min) if no cook assigned
- Negative balance alert (if < −10–20 €) — red color, frequent reminders
- Kitchen duty reminder — 12h before and at 9:00, confirmation button
- Notification type settings in profile (Push / Email / WhatsApp)
- Admin analytics: who is not confirming participation

---

## 9. Project File Structure

```
itocook/
├── frontend/
│   ├── assets/
│   │   └── css/
│   │       └── main.css        ← Jost font + global styles
│   ├── layouts/
│   │   └── default.vue         ← iPhone frame + Dynamic Island
│   ├── pages/
│   │   ├── index.vue           ← Home
│   │   ├── auth.vue
│   │   ├── onboarding.vue
│   │   ├── meal-plan.vue
│   │   ├── ai-recipe.vue
│   │   ├── journal.vue
│   │   ├── learning.vue
│   │   ├── profile.vue
│   │   └── recipe/
│   │       └── [id].vue
│   ├── components/
│   │   ├── BottomTabBar.vue
│   │   ├── RecipeCard.vue
│   │   ├── CategoryPill.vue
│   │   └── MacroRing.vue
│   ├── app.vue
│   └── nuxt.config.ts
├── api/                        ← FastAPI microservice
│   └── main.py
├── directus/                   ← Directus config/extensions
├── docs/
│   ├── design.md               ← UI design system (single source of truth)
│   ├── plan-main.md            ← This file
│   ├── progress.md             ← Current progress log
│   └── design/                 ← Visual references (screenshots)
├── notes/                      ← Personal dev notes
├── .env
├── .env.example
├── AGENTS.md                   ← Agent rules for this project
├── docker-compose.yml
└── README.md
```

---

## 10. Docker Compose

```yaml
version: '3.8'

services:
  database:
    image: postgres:15
    volumes:
      - ./database:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: itouser
      POSTGRES_PASSWORD: itopassword
      POSTGRES_DB: itocook_db

  directus:
    image: directus/directus:latest
    ports:
      - "8055:8055"
    depends_on:
      - database
    volumes:
      - ./uploads:/directus/uploads
      - ./extensions:/directus/extensions
    environment:
      KEY: "itocook-secret-key"
      SECRET: "itocook-secret-value"
      DB_CLIENT: "pg"
      DB_HOST: "database"
      DB_PORT: "5432"
      DB_DATABASE: "itocook_db"
      DB_USER: itouser
      DB_PASSWORD: itopassword
      ADMIN_EMAIL: "admin@itocook.com"
      ADMIN_PASSWORD: "admin"

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - directus
    environment:
      DIRECTUS_URL: "http://directus:8055"
```

---

## 11. Development Roadmap

### Step 1 — Foundation (Git) ✅
- [x] Create `itocook` repository on GitHub
- [x] Clone to local machine
- [x] Create `/frontend`, `/api`, `/directus` folders
- [x] README.md in root
- [x] First git commit and push

### Step 2 — Orchestration (Docker) ✅
- [x] Write `docker-compose.yml`
- [x] Create `.env` (DB passwords and Directus keys)
- [x] Run: `docker-compose up -d`
- [x] Verify: open `localhost:8055` → Directus login screen

### Step 3 — Directus Setup ✅
- [x] Log in as admin
- [x] Create collections: users (+ balance field), meals, order_items, recipes, transactions, cook_queue, cleaning_schedule, ratings
- [x] Configure Permissions for roles

### Step 4 — Nuxt 4 Frontend Init ✅
- [x] Initialize Nuxt 4 in `/frontend`
- [x] Install Tailwind CSS
- [x] Install Directus SDK: `npm install @directus/sdk`
- [x] Configure `.env` with `DIRECTUS_URL=http://localhost:8055`
- [x] Install Phosphor Icons: `npm install @phosphor-icons/vue`

### Step 5 — Design System ✅
- [x] Configure `tailwind.config.ts` with custom color tokens
- [x] Create `assets/css/main.css` with Jost font import
- [x] Create `docs/design.md` — full UI specification
- [x] iPhone frame layout in `layouts/default.vue`
- [x] Dynamic Island

### Step 6 — UI Screens (in progress)
- [x] Onboarding screen
- [ ] Auth screen (Log In / Sign Up) — in progress
- [ ] Home screen
- [ ] Recipe detail screen
- [ ] Meal Plan screen
- [ ] AI Recipe screen
- [ ] Journal screen
- [ ] Learning screen
- [ ] Profile screen
- [ ] Bottom tab navigation component

### Step 7 — First Live Page (Dashboard)
- [ ] Implement home screen: header, hero card, widget grid
- [ ] Write `useFetch` / SDK request to Directus
- [ ] Display real user balance and current lunch status

### Step 8 — Core Logic & Pages
- [ ] Cook page: "I'm cooking", dish selection, receipt upload, notifications
- [ ] Dish history: list, search, select for today
- [ ] Cleaning calendar: view for all, edit for admin
- [ ] Finance page: all balances, expense history (admin/accountant only)

### Step 9 — Notifications & FastAPI
- [ ] First FastAPI endpoint (split calculation)
- [ ] Connect to Nuxt
- [ ] Implement notification triggers (email, push)

### Step 10 — Interactive Features
- [ ] Anonymous reviews and ratings
- [ ] Weekly vote: best dish / best cook (optional)

### Step 11 — Extensions (optional)
- [ ] OCR for receipts — auto-read amount from photo
- [ ] Add products from receipt to purchase DB
- [ ] Recipe API integration
- [ ] Shopping list export

### Step 12 — MVP Launch
- [ ] Test week with ~10 users
- [ ] Collect feedback
- [ ] UX adjustments
- [ ] User mini-guide
- [ ] Full admin access setup for accounting

---

## 12. AI Assistant

### Concept

Built-in chat inside ItoCook, specialized **only for culinary topics**. Works via OpenRouter API. User never leaves the app.

### Key Principles

- Answers only culinary questions (recipes, ingredients, portions, techniques)
- Politely declines off-topic questions
- Restriction implemented via system prompt
- Nothing saved automatically — user decides what to keep

### Technical Specs

| Parameter | Value |
|---|---|
| API | OpenRouter (`/api/v1/chat/completions`) |
| Model | `google/gemini-2.0-flash-lite` |
| Response format | JSON |
| Chat history | Session only |
| Auto-save | No — explicit action only |

> OpenRouter allows switching to any other model without code changes.

### System Prompt

```
You are a culinary assistant for the ItoCook app.
Answer only questions about recipes, ingredients, portions,
cooking time and preparation techniques.
For off-topic questions politely explain you can only help with cooking.
Always return your answer in JSON format (see schema below).
```

### Response Format (JSON)

```json
{
  "title": "Chicken Soup",
  "servings": 12,
  "time_minutes": 90,
  "ingredients": [
    { "name": "Chicken", "amount": 2.4, "unit": "kg" },
    { "name": "Potatoes", "amount": 3.0, "unit": "kg" },
    { "name": "Carrots", "amount": 3, "unit": "pcs" },
    { "name": "Onion", "amount": 2, "unit": "pcs" },
    { "name": "Salt", "amount": 2, "unit": "tsp" }
  ],
  "steps": [
    "Cover chicken with cold water, bring to boil, skim foam.",
    "Simmer broth for 40 minutes on medium heat.",
    "Add roughly chopped potatoes, carrots and onion.",
    "Cook another 25 minutes until vegetables are tender.",
    "Season with salt, serve hot."
  ],
  "message": "Recipe scaled for 12 servings. Cooking time may vary slightly depending on piece size."
}
```

### Usage Scenarios

**Scenario 1 — New recipe via chat**
1. User writes: *"Create a chicken soup for 12 people"*
2. Assistant returns JSON with recipe
3. Frontend renders card with ingredients and steps
4. Buttons:
  - **"Add to recipes"** → recipe draft, user can edit and save
  - **"Add ingredients to shopping list"** → goes to purchases for today/week

**Scenario 2 — Recalculate existing recipe**
1. User opens a recipe (e.g. for 5 people)
2. Taps **"Recalculate"**, enters new count (e.g. 15)
3. Recipe + new count passed to assistant as context
4. Assistant returns recalculated JSON
5. Button **"Save as new recipe"**

**Scenario 3 — Ingredient substitution**
1. User: *"What can I substitute for sour cream in this recipe?"*
2. Button **"Replace in recipe"** → substitutes ingredient, offers to save

### Context Passed to Assistant

- Current recipe (name, ingredients, steps, serving count)
- Requested serving count
- Weekly menu list (optional)

### Open Questions

- [ ] Where to store chat history — session only or DB?
- [ ] Where in navigation will the assistant tab be?
- [ ] One shared chat or chat tied to a specific recipe?
- [ ] Add rate limiting to prevent request spam

---

## 13. Icon Reference

```ts
// Icon constants
export const APP_ICONS = {
  home: 'ph:house',
  menu: 'ph:fork-knife',
  balance: 'ph:wallet',
  calendar: 'ph:calendar-blank',
  profile: 'ph:user-circle',
  cook: 'ph:cooking-pot',
  delivery: 'ph:moped',
  addBalance: 'ph:plus-circle',
  receipt: 'ph:receipt',
  bell: 'ph:bell',
  confirm: 'ph:check-circle',
  decline: 'ph:x-circle',
  cart: 'ph:shopping-cart',
  history: 'ph:clock-counter-clockwise',
  ai: 'ph:sparkle',
  learning: 'ph:books',
  journal: 'ph:notebook',
}
```

| Category | Icon | Purpose |
|---|---|---|
| Navigation | PhHouse | Home / Dashboard |
| Navigation | PhForkKnife | Kitchen / Today's menu |
| Navigation | PhWallet | Balance |
| Navigation | PhCalendarBlank | Cleaning schedule |
| Navigation | PhUserCircle | Profile |
| Food | PhCookingPot | Cooking |
| Food | PhMoped | Delivery |
| Food | PhLeaf | Vegan / Salads |
| Actions | PhPlusCircle | Top up balance |
| Actions | PhReceipt | Receipt / transaction |
| Actions | PhBell | Notifications |
| Actions | PhCheckCircle | "I'm in" |
| Actions | PhXCircle | "I'm out" |
| Actions | PhShoppingCart | Shopping list |
| History | PhClockCounterClockwise | Order history |
| AI | PhSparkle | AI assistant |
| Learning | PhBooks | Learning section |
| Journal | PhNotebook | Journal section |

---

## 14. Design References

- Primary reference: https://www.behance.net/gallery/233707639/ekilu-AI-Powered-Food-Recipe-App-UI-UX-Design
- Visual screenshots: `docs/design/` folder