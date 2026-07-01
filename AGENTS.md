# ItoCook — Project Rules

> Global rules live in `~/.config/opencode/AGENTS.md` and apply to all projects.
> This file contains ItoCook-specific rules only. In case of conflict — this file wins.

---

## Stack Skills (load on every session start)

After loading `using-agent-skills`, immediately load these stack skills:
```
~/.config/opencode/skills/nuxt/SKILL.md
~/.config/opencode/skills/nuxt-ui/SKILL.md
~/.config/opencode/skills/vue/SKILL.md
~/.config/opencode/skills/tailwind-design-system/SKILL.md
```

---

## Nuxt 4 Structure (MANDATORY)

- This project uses **Nuxt 4**
- All app-level folders (`pages/`, `components/`, `composables/`, `layouts/`,
  `middleware/`, `assets/`, `plugins/`, `utils/`) and files (`app.vue`, `error.vue`,
  `app.config.ts`) MUST reside inside the `app/` directory
- Do NOT use Nuxt 3 flat structure
- If unsure — check context7 first, not training data

---

## Project File Map

| What | Path |
|------|------|
| Pages | `frontend/app/pages/` |
| Layouts | `frontend/app/layouts/` |
| Components | `frontend/app/components/` |
| Composables | `frontend/app/composables/` |
| Global styles | `frontend/app/assets/css/main.css` |
| Design reference | `docs/design.md` |
| Progress log | `docs/progress.md` |
| Roadmap | `docs/roadmap.md` |
| Architecture overview | `docs/ARCHITECTURE.md` |
| Domain glossary | `docs/CONTEXT.md` |
| Design system | `docs/design.md` |
| Skills reference | `docs/skills-cheatsheet.md` |
| Global skills | `~/.config/opencode/skills/` |

---

## Session Start — MANDATORY SEQUENCE

Execute these steps in order at the start of EVERY session. Do not skip any step.

**Step 1 — Load global skill**
```
Read ~/.config/opencode/skills/using-agent-skills/SKILL.md
```

**Step 2 — Load stack skills**
Load all 7 stack skills listed in the "Stack Skills" section above.

**Step 3 — Read git log**
```bash
git log --oneline -5
```
Understand what was actually done last.

**Step 4 — Read progress.md**
```
Read docs/progress.md
```
Understand current state, known issues, and next steps.

**Step 5 — Sync check**
Compare git log with progress.md. If they are out of sync — update progress.md FIRST before doing anything else.

**Step 6 — Read roadmap**
```
Read docs/roadmap.md
```
Understand which Phase is currently active.

**Step 7 — Load task-specific context**
Based on what you are about to work on:

| Task area | Read before starting |
|-----------|---------------------|
| Any UI / frontend work | `docs/design.md` |
| Cook panel, queue, states | `docs/architecture/cook-queue.md` |
| Recipe create/edit/fork/likes | `docs/architecture/recipe-system.md` |
| Balance, deduction, transactions | `docs/architecture/finance.md` |
| Duty calendar | `docs/architecture/duty.md` |
| Shopping list | `docs/architecture/shopping-list.md` |
| Login, signup, middleware | `docs/architecture/auth-flow.md` |
| Push notifications, Flows | `docs/architecture/notifications.md` |
| Deployment, PWA, Docker | `docs/architecture/deployment-pwa.md` |
| Overall architecture or new feature | `docs/ARCHITECTURE.md` |
| Backend / Directus schema | Run Directus MCP `schema` tool before creating anything |

**Step 8 — Load task-specific skills**
Check `docs/skills-cheatsheet.md` and load relevant skills per global AGENTS.md triggers.

**Step 9 — Report session start**
Before writing any code, output:
```
✓ Session initialized.
Current phase: [phase name from roadmap]
Last commit: [hash — message]
Progress status: [one line from progress.md current status]
Working on: [what user asked for]
Skills loaded: [list]
```

---

## Git Workflow

### When to commit
- After completing a full Milestone or major feature (new page, new component, new Flow)
- Never commit broken or half-done code
- Small fixes (warnings, typos, minor CSS) — make changes, wait for explicit commit instruction

### Commit message format
```
<type>(<scope>): <what was done>
```
Types: `feat`, `fix`, `docs`, `chore`, `refactor`

Examples:
- `feat(cook-queue): add fork-on-cook pattern`
- `fix(auth): correct middleware redirect`
- `docs: update CONTEXT and architecture after Phase 6`

### After every commit — immediately update progress.md
```
## Git log
- `<hash>` — commit message
```

---

## MCP Servers Available

| MCP | Use for |
|-----|---------|
| `filesystem` | Read/write any project file |
| `git` | Git operations |
| `context7` | Live framework docs (Nuxt, Vue, Directus, Tailwind) — always prefer over training data |
| `directus` | Schema, collections, fields, items CRUD, Flows |
| `chrome-devtools` | Console errors, network requests, screenshots, Lighthouse |
| `fetch` | External HTTP requests |
| `sequential-thinking` | Complex multi-step reasoning |
| `playwright` | E2E tests, explore mode, auto-generated tests, screenshots |

### Chrome DevTools — important
Claude cannot launch Chrome. If browser inspection needed, ask user to run:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  http://localhost:3000
```
Then use: `list_console_messages`, `list_network_requests`, `take_snapshot`

### Directus MCP — important
- Server runs at `http://localhost:8055/mcp`
- Always check current schema via Directus MCP before creating new collections
- Always check Access Policies/Permissions before new API calls
- For sensitive collections (e.g. `directus_users`) — restrict field-level access
- Flows are NOT version controlled — after modifying locally, note that production sync is needed
- CRON schedule changes require `docker compose restart directus` to take effect

---

## Directus Permissions Checklist

Whenever creating/modifying a collection, field, or new API call:
1. Check Access Policies for the role used by frontend (Public or authenticated role)
2. If required permission is missing — add it as part of the task
3. For `directus_users` — restrict fields to minimum needed (no email, password hashes)
4. Note in progress.md which permissions were added or changed

---

## Vue 3 / Nuxt Gotchas

1. **useDirectus() must be called at composable init time, not inside async handlers.**
   `useRuntimeConfig`, `useCookie` require synchronous Nuxt context.
   Calling inside `setTimeout`, async functions, or event handlers loses context.
   Always initialize at the top level of the composable.

2. **Composables returning plain objects with refs need `reactive()` in templates.**
   If composable returns `{ show: ref(false), loading: ref(false) }` (plain object),
   Vue does NOT auto-unwrap refs in templates — `v-if="pm.loading"` checks the Ref
   object itself (always truthy), not its value.
   Fix: `const pm = reactive(useMyComposable())` in the component,
   or return `readonly(reactive({...}))` from the composable itself.

3. **DELETE 204 crash.**
   Directus DELETE returns 204 No Content → `res.json()` throws.
   Use `res.text()` + conditional `JSON.parse`.

4. **Service Worker strategy.**
   This project uses `generateSW`, NOT `injectManifest`.
   `navigateFallback: null` is critical — do not change without explicit confirmation.

---

## UI Rules

- No UI code without reading `docs/design.md` first
- Use only color tokens from `docs/design.md` Section 3
- Icons: `@phosphor-icons/vue` with `Ph` prefix (`PhHouse`, `PhSparkle`)
- No absolute positioning except hero images and floating badges
- TypeScript required: all `.vue` files must have `<script setup lang="ts">`

---

## Operational Notes

### Directus Flows — not version controlled
Flow definitions live in the database, not in git. After modifying a flow locally,
it must be manually synced to production. Always note when creating or modifying flows.

### CRON changes require restart
```bash
docker compose restart directus
```

### docs/specs/ — project feature specifications
- One file per feature: `docs/specs/feature-name.md`
- Created BEFORE implementation (or retroactively after phase completion)
- Contains: purpose, inputs/outputs, edge cases, related collections/composables
- Use skill: `~/.config/opencode/skills/spec-driven-development/SKILL.md`


---

## Docs Update Matrix — who updates what and when

| File | Updated by | Trigger |
|------|-----------|---------|
| docs/progress.md | Agent — automatic | Every commit + push |
| docs/roadmap.md | Agent — automatic | Phase completed |
| docs/architecture/*.md | Agent — automatic | Architecture changed |
| docs/CONTEXT.md | Agent — on request | Documentation Session |
| docs/specs/*.md | Agent — on request | Before new feature |
| docs/design.md | Developer manually | Design decision changed |
| docs/audits/*.md | Agent — on request | Audit session |
| docs/skills-cheatsheet.md | Agent — automatic | New skill installed |