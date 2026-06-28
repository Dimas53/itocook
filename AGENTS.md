# ItoCook — Project Rules

## Key Rules & Workflow
- **No UI code** without reading `docs/design.md` first.
- Use only color tokens from `docs/design.md` Section 3.
- Icons: `@phosphor-icons/vue` with `Ph` prefix (e.g., `PhHouse`, `PhSparkle`).
- No absolute positioning except hero images and floating badges.
- TypeScript required: all `.vue` files must have `<script setup lang="ts">`.

## Skills

> ⚠️ Read `SKILL.md` via the filesystem path shown (e.g. `Read ~/.config/opencode/skills/foo/SKILL.md`).
> Do NOT use the `skill` MCP tool — it only sees ~31 of 41 installed skills.

### Always read on project start (every session)
- `~/.config/opencode/skills/using-agent-skills/SKILL.md`
- `~/.config/opencode/skills/nuxt/SKILL.md`
- `~/.config/opencode/skills/nuxt-ui/SKILL.md`
- `~/.config/opencode/skills/nuxt-vue/SKILL.md`
- `~/.config/opencode/skills/vue/SKILL.md`
- `~/.config/opencode/skills/tailwind-design-system/SKILL.md`
- `~/.config/opencode/skills/tailwind-nuxtui/SKILL.md`
- `~/.config/opencode/skills/directus/SKILL.md`
### Load when needed — rules in ~/.config/opencode/AGENTS.md


---

## Nuxt 4 Structure (MANDATORY)

- This project uses **Nuxt 4**. All application code MUST follow the official Nuxt 4 directory structure.
- All app-level folders (`pages/`, `components/`, `composables/`, `layouts/`, `middleware/`, `assets/`, `plugins/`, `utils/`) and files (`app.vue`, `error.vue`, `app.config.ts`) MUST reside inside the `app/` directory.
- Before any Nuxt-related implementation, fetch current docs via context7: resolve `nuxt` library and read the relevant section.
- Do NOT use Nuxt 3 flat structure. If you are unsure — check context7 first, not your training data.

---

## Project Structure & Context
- **Pages:** `frontend/pages/`
- **Layouts:** `frontend/layouts/`
- **Components:** `frontend/components/`
- **Global styles:** `frontend/assets/css/main.css`
- **Design refs:** `docs/design/`
- **Progress log:** `docs/progress.md`
- **UI Roadmap:** `docs/roadmap.md`
- **Master Plan:** `docs/plan-main.md`
- **Global skills:** `~/.config/opencode/skills/`

---

## Session Workflow

### At the start of every session
1. Run `git log --oneline -5` — see what was actually done last.
2. Read `docs/progress.md` — understand current state and next steps.
3. Check if git log and progress.md are in sync — if not, update progress.md first before doing anything else.
4. Read `docs/roadmap.md` — to understand the high-level UI Phase context.
5. If working on backend/data: use Directus MCP `schema` tool to read current
      collections before creating anything new.
6. Read `docs/plan-main.md` — if working on architecture or new features.
7. Read `docs/design.md` — before any UI/frontend work.
8. If working on a specific feature, read the relevant doc before writing any code:
    - Cook panel, queue, states → `docs/architecture/cook-queue.md`
    - Recipe create/edit/fork/likes → `docs/architecture/recipe-system.md`
    - Balance, deduction, transactions → `docs/architecture/finance.md`
    - Duty calendar → `docs/architecture/duty.md`
    - Shopping list → `docs/architecture/shopping-list.md`
    - Login, signup, middleware → `docs/architecture/auth-flow.md`
    - File structure, schema → `docs/project-state.md`
    - Overall architecture → `docs/ARCHITECTURE.md`

### After EVERY response that changed a file or ran a command
Immediately update `docs/progress.md`:
- Move completed checklist items to **Current status**
- Add new items to **Known issues** if discovered
- Update **Next session** plan to reflect what's left
- **Roadmap Check:** If a high-level Phase goal in `docs/roadmap.md` is fully complete (all checkboxes checked), mark it with ✅ and add the current date (e.g., `## Phase 1: UI-скелет ✅ 2026-06-02`).

### After every git commit
Add to `docs/progress.md` under a `## Git log` section:
- backtick hash backtick — commit message

### At the end of every session
Verify `docs/progress.md` is complete enough that a different agent could continue without asking questions:
- Current status reflects reality (not just what was planned)
- Known issues lists everything broken or incomplete
- Next session plan has concrete actionable steps, not vague goals
- **Check `docs/roadmap.md`:** If the current Phase is done, mark it ✅ with the date. If the Phase is not done, verify the active checkbox list accurately reflects reality.

---

## docs/progress.md — Required Structure

### Current status
- [x] thing that works

### Known issues
- **Issue name:** description (waiting for Milestone X)

### Next session — plan
- concrete step 1
- concrete step 2

### Git log
- hash — commit message

---

## Git Workflow

### When to commit
- After completing every Milestone or major feature (new page, new component)
- Never commit broken or half-done code
- 
### Commit frequency
Do NOT commit after every small fix.
Commit only after a complete feature or milestone is done.
For small fixes (warnings, typos, minor CSS) — make changes but wait for explicit commit instruction.

### Commit message format
`<type>(<scope>): <what was done>`

Types: feat, fix, docs, chore, refactor
Scope: optional, e.g. auth, onboarding, layout, tailwind

Examples:
- feat(onboarding): replace absolute layout with flex, add lang=ts
- feat(layout): add BottomTabBar with 5 tabs
- fix(auth): correct input focus states

### After every commit
- Update `## Git log` in `docs/progress.md`:
  - `<hash>` — commit message

---

## What NOT to log in progress.md
- Debug steps and experiments that didn't result in a file change
- Intermediate thoughts or explanations
- Duplicate entries for the same fix

-----

## Browser Debugging (Chrome DevTools MCP)

Chrome DevTools MCP is available for inspecting the frontend in the browser.

**Important:** Claude cannot launch Chrome. If browser inspection is needed,
ask the user to run this command in terminal first:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  http://localhost:3000
```

Once Chrome is running on port 9222, use these MCP tools:
- `list_console_messages` — console errors and warnings
- `list_network_requests` — all HTTP requests and responses
- `navigate_page` — navigate to a specific URL
- `take_snapshot` — screenshot of the current state

Always use chrome-devtools MCP to check browser errors before asking the user to copy-paste them.

---

## Directus MCP

Directus MCP is available for schema and data management without using the UI.
MCP server runs at `http://localhost:8055/mcp`.

Use Directus MCP for:
- Creating/modifying collections, fields, relations
- Reading/writing data (items CRUD)
- Creating Flows and automations
- Inspecting current schema before any backend work

**Always check current schema via Directus MCP before creating new collections**
to avoid duplicates or conflicts with existing structure.

When working on Phase 3+ features, prefer Directus MCP over manual UI clicks
for all schema changes — this keeps changes reproducible and documented.

---

## Directus permissions checklist

Whenever a task involves creating/modifying a Directus collection, field,
or a new API call against an existing collection (especially aggregate/count
queries, or collections not previously queried from the frontend):

- Always check Access Policies/Permissions for the role used by the frontend
  (e.g. Public or the default authenticated role) via Directus MCP.
- If the required permission (read/create/update/aggregate) is missing, add it
  as part of the task — don't leave it for the user to discover via a 403 later.
- For sensitive collections (e.g. `directus_users`), restrict the field-level
  access to only what's needed (avoid exposing email, password hashes, etc.).
- Mention in the progress notes/summary which permissions were added or changed.

---

## Chat Language Rules

- In CLI chat, always respond in Russian by default.
- If the user explicitly writes in German, respond in German.
- If the user explicitly writes in English, respond in English.
- All code explanations, reviews, analyses, and descriptions in chat must be written in Russian unless the user requests another language.

---

# English-Only Policy

Russian language is strictly prohibited anywhere in the project.

This rule applies to:

* source code
* comments
* documentation
* commit messages
* pull requests
* TODOs
* FIXMEs
* variable names
* function names
* file names
* UI text
* logs
* tests
* configuration files
* generated code

Before starting any work in an existing repository, perform a one-time full-project scan for Cyrillic characters and Russian text. Treat any detected Russian content as technical debt and replace it with English whenever the affected files are touched.

If any Russian text is detected, it must be immediately translated and replaced with English.

Before every commit and push:

1. Scan all modified files for Cyrillic characters and Russian text.
2. Replace any detected Russian text with clear English equivalents.
3. Ensure that no new Russian content is introduced into the repository.

When reviewing existing code, automatically convert any Russian comments, descriptions, or text to English as part of the current task.

Never generate, insert, copy, preserve, or leave Russian text in project files under any circumstances.

do not look at the mape /notes. in this mape /notes kann be written in russian.

---

## Rules to add under a new section "Vue 3 / Nuxt Gotchas"

1. **useDirectus() must be called at composable init time, not inside async handlers.**
   Nuxt composables (useRuntimeConfig, useCookie) require synchronous Nuxt context.
   Calling them inside setTimeout, async functions, or event handlers loses that context.
   Always initialize at the top level of the composable.

2. **Composables returning plain objects with refs need `reactive()` in templates.**
   If a composable returns `{ show: ref(false), loading: ref(false) }` (plain object),
   Vue does NOT auto-unwrap refs in templates — `v-if="pm.loading"` checks the Ref
   object itself (always truthy), not its value.
   Fix: `const pm = reactive(useMyComposable())` in the component,
   or return `readonly(reactive({...}))` from the composable itself.


---

## Communication Language

During documentation and refactoring sessions, communicate with the user in Russian:
- Explain what you are doing and why — in Russian
- Ask clarifying questions — in Russian
- Write summaries and proposals — in Russian
- Session types where this applies:
    - Refactoring analysis and implementation
    - Security audit
    - CONTEXT.md creation (grill-with-docs session)
    - Code comments (zoom-out sessions)
    - ARCHITECTURE.md creation
    - Design review feedback

Code, comments inside source files, file names, git commit messages — always in English.


---
## Documentation — Update Triggers

### Automatic prompt after completing a phase

After completing any of the following, the agent MUST ask the user:
> "Documentation update needed? I can update CONTEXT.md, architecture files, and JSDoc comments to reflect what was just built. Takes one focused session."

Triggers (any of the following):
- A Phase or major block is completed (Phase 6, Phase 6b, Block 1, etc.)
- A new Directus collection was created
- A new composable or server route was added
- A new Directus Flow was created
- Architecture changed (new pattern, new dependency, new external service)
- More than 5 commits have passed since the last docs commit:
  check with `git log --oneline -- docs/ | head -1` vs `git log --oneline | head -1`

### How to check when docs were last updated

```bash
git log --oneline -- docs/ | head -3
```

If the last docs commit is more than 1 week old OR more than 5 commits behind HEAD — suggest a documentation update session.

### What to update and in what order

1. **CONTEXT.md** — new terms from recent features (composables, flows, patterns)
2. **docs/architecture/** — new or updated architecture files
3. **JSDoc** — only files created or significantly changed since last docs session
4. **docs/progress.md** — add a line noting that docs were updated
5. **Commit:** `docs: update CONTEXT, architecture, JSDoc after [phase name]`

### What NOT to do during a docs update

- Do NOT change any logic — only comments and .md files
- Do NOT re-document files that haven't changed since last docs session
- Do NOT mix a docs update and a feature in the same session — separate commits
- Do NOT delete existing sections in CONTEXT.md or ARCHITECTURE.md — only append

### Full prompt for a docs session

For the full step-by-step documentation prompt, read `docs/docs-update-prompt.md`.
It contains detailed instructions reflecting the current project state.
Update that file after each major docs session to keep it current.


## Autonomous Skill Selection

Before every task (coding, debugging, planning, refactoring, documentation):
1. Read `docs/skills-cheatsheet.md` — which skills apply to this task?
2. If a skill fits — load it BEFORE starting work, without waiting to be asked
3. If multiple skills apply — load all of them
4. Never skip this step even for small tasks

## Skill Discovery

When a new skill is installed or discovered in `~/.config/opencode/skills/`:
1. Read the skill's SKILL.md to understand what it does
2. Add it to `docs/skills-cheatsheet.md` in the same format as existing entries
3. Do this automatically — no need to ask the user

---

## SAFETY — Do not do without explicit confirmation

Before any of these actions STOP — ask the user first:

- Modifying `docker-compose.yml` or `docker-compose.prod.yml`
- Modifying any `.env` files
- Deleting Directus collections or migrations
- Running `git push` or `git push --force`
- Deleting files from `docs/` or `notes/`
- Changing Directus permissions for any role

## Safe to do autonomously

- Creating and editing Vue/TS components and composables
- Creating Nuxt server routes
- Adding new files to `docs/`
- Updating `docs/progress.md` and `docs/roadmap.md`
- Reading any project files
- Creating new Directus collections or fields (but not deleting)