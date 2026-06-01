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
- **Global skills:** `~/.config/opencode/skills/`

---

## Session Workflow

### At the start of every session
1. Run `git log --oneline -5` — see what was actually done last.
2. Read `docs/progress.md` — understand current state and next steps.
3. Check if git log and progress.md are in sync — if not, update progress.md first before doing anything else.
4. Read `docs/plan-main.md` — if working on architecture or new features.
5. Read `docs/design.md` — before any UI/frontend work.

### After EVERY response that changed a file or ran a command
Immediately update `docs/progress.md`:
- Move completed checklist items to **Current status**
- Add new items to **Known issues** if discovered
- Update **Next session** plan to reflect what's left

### After every git commit
Add to `docs/progress.md` under a `## Git log` section:
- backtick hash backtick — commit message

### At the end of every session
Verify `docs/progress.md` is complete enough that a different agent could continue without asking questions:
- Current status reflects reality (not just what was planned)
- Known issues lists everything broken or incomplete
- Next session plan has concrete actionable steps, not vague goals

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

## What NOT to log in progress.md
- Debug steps and experiments that didn't result in a file change
- Intermediate thoughts or explanations
- Duplicate entries for the same fix