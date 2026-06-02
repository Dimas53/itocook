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
5. Read `docs/plan-main.md` — if working on architecture or new features.
6. Read `docs/design.md` — before any UI/frontend work.

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