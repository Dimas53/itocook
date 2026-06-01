# ItoCook — Project Rules

## Key Rules & Workflow
- **No UI code** without reading `docs/design.md` first.
- Use only color tokens from `docs/design.md` Section 3.
- Icons: `@phosphor-icons/vue` with `Ph` prefix (e.g., `PhHouse`, `PhSparkle`).
- No absolute positioning except hero images and floating badges.

## Skills
- Global skills: ~/.config/opencode/skills/

---

## Session Workflow

### At the start of every session
1. Read `docs/progress.md` — to understand the current state and planned next steps.
2. Read `docs/plan-main.md` — if working on architecture or new functionality.
3. Read `docs/design.md` — before starting any UI/frontend work.

### At the end of every session (or after completing a major task)
Mandatory: Update `docs/progress.md` using the following strict structure:

### Current status
- list what is done and working

### Known issues
- list what is broken or incomplete

### Next session — plan
- list concrete next steps (this replaces memory between sessions)

---

## Project Structure & Context
- **Pages:** `frontend/pages/`
- **Layouts:** `frontend/layouts/`
- **Components:** `frontend/components/`
- **Global styles:** `frontend/assets/css/main.css`
- **Design refs:** `docs/design/`
- **Progress log:** `docs/progress.md`
- **Global skills:** `~/.config/opencode/skills/`