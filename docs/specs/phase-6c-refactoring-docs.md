# Spec: Phase 6c — Refactoring & Documentation

## Objective

Improve code quality: extract shared composables, add JSDoc everywhere, audit security, create VitePress docs site, document agent harness.

## Refactoring — Extracted Components/Composables

| What | Extracted From | Purpose |
|------|---------------|---------|
| `SliderList.vue` | cook.vue + finance.vue | Reusable translateY slider (~140 lines removed) |
| `useDeduction.ts` | cook.vue | confirmDeduction + loadPastaCost + cleanupShoppingList |
| `useRecipeServings.ts` | recipe/[id].vue | Servings scaling |
| `ReceiptSummary.vue` | cook.vue | Shared receipt info rows |
| `BalanceRow.vue` | finance.vue | Shared balance row |
| `TransactionRow.vue` | finance.vue | Shared transaction row |
| `utils/dates.ts` | 8+ files | 7 shared date functions |
| `useParticipants.participantsList` | cook.vue + recipe/[id].vue | Centralized participant fetch |

## JSDoc Coverage

All public APIs documented:
- 9 server API routes + 2 server utils
- All composables (useDirectus, useAuth, useDeduction, useParticipants, useBalanceCheck, useMealCost, etc.)
- 17 components + 14 pages
- All utilities, middleware, layouts
- TypeScript: zero errors after JSDoc pass

## Documentation

| Doc | Content |
|-----|---------|
| `docs/CONTEXT.md` | 30+ domain terms glossary |
| `docs/ARCHITECTURE.md` | Core-layer documentation + design rationale |
| `docs/architecture/` (7 files) | auth-flow, cook-queue, finance, recipe-system, shopping-list, duty, notifications |
| `docs/audits/security-audit.md` | 3 CRITICAL, 2 HIGH, 2 MEDIUM, 2 LOW findings |
| `docs/project-state.md` | File structure, flows, composables, security |
| `docs/skills-cheatsheet.md` | Skill reference by use case |
| `docs-site/` (VitePress) | Landing, architecture with Mermaid ERD, 6 feature pages, screens, design system, roadmap |

## Security Audit

- 4 layers audited: Nuxt routes, Directus policies, nginx, auth edge cases
- All 11 server routes verified: protected routes call `requireAuth(event)`
- Findings documented in `docs/audits/security-audit.md`

## Harness / Agent Infrastructure

- `session-start` skill — agent loads docs, outputs brief
- `code-reviewer` skill — checklist before "done"
- `skills-cheatsheet.md` — skill → task mapping
- `notes/Harness/harness-overview.md` — 9-layer self-diagnostic
- `docs/specs/` (8 files) — retroactive feature specs

## Key Gotchas

- Composable returning plain object → template needs `reactive()` wrapper (Ref not auto-unwrapped)
- `fetch()` naming collision: internal function in composable must not shadow global `fetch`
- Directus singleton: `PATCH /items/collection_name` without ID
- `useDirectus()` must be at composable top level, not inside async

## Success Criteria

1. All composables extracted and working
2. JSDoc on every public function in composables, components, pages, server routes
3. VitePress site builds (`npm run docs:build` passes)
4. Security audit: all CRITICAL and HIGH findings fixed
5. Harness self-diagnostic complete
