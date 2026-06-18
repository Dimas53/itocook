# Duty (Cleaning Schedule)

## What It Does

Manages the kitchen cleaning duty roster. Users can view today's duty assignment, confirm their own duty, browse the monthly calendar, and (for admin users) edit any assignment.

## Collections Used

- **`cleaning_schedule`** — duty roster. Fields: `date` (date), `user` (M2O → users), `department` (string), `confirmed` (boolean).

## Files Involved

- `frontend/app/pages/duty.vue` — full duty page
- `frontend/app/components/DutyWidget.vue` — home page duty snapshot
- `frontend/app/components/MonthCalendar.vue` — reusable month calendar
- `frontend/server/api/duty/confirm.post.ts` — admin-proxy for confirming duty
- `frontend/server/api/duty/upsert.post.ts` — admin-proxy for creating/updating

## Flow

```
User opens duty page
    │
    ├── "On Duty Today" card
    │     ├── Shows: department pill, user name, confirm button
    │     ├── If confirmed: green badge
    │     ├── If unconfirmed: "Confirm Duty" button
    │     └── If no entry: "No duty assigned for today"
    │
    └── Monthly calendar
          ├── Prev/next month navigation
          ├── Weekday cells (Mon–Fri)
          ├── Dot indicator for entries
          └── Tap cell → popover
                ├── Normal user: view + confirm if own
                └── Admin user: edit mode
                      ├── Department <select>
                      ├── User <select>
                      └── Save → POST/PATCH /api/duty/upsert
```

## Key Design Decisions

- **Admin-proxy for writes** — User-role tokens cannot write to `cleaning_schedule` for other users.
- **Department from user record** — Stored as a snapshot at assignment time.
- **MonthCalendar as reusable component** — Also used in recipe detail date picker.
- **DutyWidget home integration** — Shows next upcoming assignment with gradient backgrounds.

## Edge Cases & Limitations

- **Past dates** — Tapping shows entry info; admin can still edit past entries.
- **No notification on assignment** — User must discover it by visiting the app.
- **Department changes** — Existing entries show the old department if user changes it later.
