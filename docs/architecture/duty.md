# Duty (Cleaning Schedule)

## What It Does

Manages the kitchen cleaning duty roster. Users can view today's duty assignment, confirm their own duty, browse the monthly calendar, and (for admin users) edit any assignment. Provides at-a-glance awareness of who is responsible for cleaning each day.

## Collections Used

- **`cleaning_schedule`** — duty roster. Fields: `date` (date), `user` (M2O → directus_users), `department` (string, nullable — copied from user's department at assignment time), `confirmed` (boolean, default false).

## Files Involved

- `frontend/app/pages/duty.vue` — full duty page with today's card + monthly calendar
- `frontend/app/components/DutyWidget.vue` — home page duty snapshot (next assignment)
- `frontend/app/components/MonthCalendar.vue` — reusable month calendar component
- `frontend/server/api/duty/confirm.post.ts` — admin-proxy for confirming duty
- `frontend/server/api/duty/upsert.post.ts` — admin-proxy for creating/updating assignments
- `frontend/server/api/users/list.ts` — fetches all users (for admin edit user picker)

## Flow

```
User opens duty page
    │
    ├── "On Duty Today" card
    │     ├── Shows: department pill, user name, confirm button
    │     ├── If confirmed: green-pastel badge, no action
    │     ├── If unconfirmed: "Confirm Duty" button
    │     │     └── PATCH /api/duty/confirm → proxies to Directus PATCH
    │     └── If no entry: "No duty assigned for today" empty state
    │
    └── Monthly calendar
          ├── Prev/next month navigation
          ├── Weekday cells (Mon–Fri)
          ├── Cell states: today, has entry, current user, confirmed, past
          ├── Dot indicator for entries
          └── Tap cell → popover
                ├── Normal user: view entry details + confirm if own
                └── Admin user (role UUID check): edit mode
                      ├── Department <select> (8 options)
                      ├── User <select> (filtered by department)
                      └── Save → POST or PATCH /api/duty/upsert
```

## Key Design Decisions

**Admin-proxy for writes** — Both confirm and upsert go through Nuxt server routes with admin Directus tokens. User-role tokens cannot write to `cleaning_schedule` for other users. The upsert route handles both create (POST) and update (PATCH) based on whether an entry exists for the given date.

**Department from user record** — The `department` field is stored on `cleaning_schedule` as a snapshot, copied from the user's `directus_users.department` at assignment time. This allows the schedule to display the department even if the user later changes it in their profile. The admin edit form also filters the user picker by department.

**MonthCalendar as reusable component** — Extracted from `duty.vue` into a shared component. Also reused in `recipe/[id].vue` for the date picker bottom-sheet. Accepts entries array, highlighted date, display mode, and emits cell clicks.

**DutyWidget home integration** — Shows the next upcoming assignment on the home page. Uses gradient backgrounds and a decorative SVG in the top-left corner. "You're next" indicator (larger, bold text) when the current user is scheduled for the next duty day.

**Admin role check by UUID** — The frontend checks if the user's role UUID matches the admin/finance role to enable edit mode. This is the same check used for finance page access (`isFinanceRole`). The UUID is hardcoded in the component.

## Edge Cases & Limitations

- **Admin edit bypasses user-permission checks** — Admin can assign any user to any date. The UI shows all departments and users without restriction.
- **Past dates** — Tap on past dates shows the entry (if any) but confirmation is informational only for normal users. Admin can still edit past entries.
- **No notification on assignment** — When an admin assigns a user to a duty, no notification is sent. The user must discover it by visiting the app.
- **Null recipe vs duty** — Unlike the cook system, duty has no recipe or status workflow. It's a simple "who cleans when" registry with a single confirmed/unconfirmed toggle.
- **Department changes after assignment** — The department stored on the cleaning_schedule entry is a snapshot. If the user changes their department in their profile, existing duty entries still show the old department.
