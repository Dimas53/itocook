# Spec: Phase 5 — Remaining Feature Screens

> Status: 🟡 In progress

## Objective

Complete all tab screens. AI Recipe chat + render, Common screen with announcements and pool collections.

## What's Built

- Share shopping list — from Recipe Detail (native share sheet)
- Profile balance + transaction history
- Recipe Detail cooking steps display

## What Remains

| Feature | Route | Key Challenge |
|---------|-------|--------------|
| AI Recipe chat | `/ai-recipe` | Streaming response, JSON recipe render, portion recalculation, ingredient substitution |
| Common screen | `/common` | Announcements CRUD, pool collections with progress bars |

## Proposed Implementation

### AI Recipe
- Chat UI: message list, input bar, loading state
- Backend: send prompt to AI API, render structured JSON response
- Buttons: "Add to recipes" (create draft), "Share shopping list"
- Portion recalculation: re-request AI with `servings` param
- Substitution: re-request AI with `replace: ingredientName`

### Common Screen
- Announcements: text + date, Admin creates, all read
- Pool collections: name, goal amount, collected so far, participants
- Progress bar per collection
- "Participate" button + contribution amount
- History of closed collections

## Boundaries

- **Ask first:** Choosing AI provider, collection data model, payment integration
- **Never:** Store AI API keys in client code

## Open Questions

- AI Recipe: use Directus extension or external API?
- Pool collections: real money or virtual tracking?
