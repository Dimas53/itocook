# ItoCook — Project Rules

## Key Rules & Workflow
- **No UI code** without reading `docs/design.md` first.
- Use only color tokens from `docs/design.md` Section 3.
- Icons: `@phosphor-icons/vue` with `Ph` prefix (e.g., `PhHouse`, `PhSparkle`).
- No absolute positioning except hero images and floating badges.
- TypeScript required: all `.vue` files must have `<script setup lang="ts">`.

## Skills
- Global skills: ~/.config/opencode/skills/

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
