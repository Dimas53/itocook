# Cook Panel

**What this screen is for:** The cook's control panel for the entire meal lifecycle.

**Who uses it:** today's assigned cook + admin

## State Machine

The cook panel has 6 states, each showing different controls:

### `assign`
- "I'm cooking today!" button
- Shows when no cook is assigned for today
<img src="/screenshots/cook-assign.png" alt="Cook panel — assign state" class="screenshot" />
<img src="/screenshots/cook-assign_2.png" alt="Cook panel — assign state (alternate)" class="screenshot" />

### `dish`
- Enter dish name, category
- Pick recipe from history
<img src="/screenshots/cook-assign.png" alt="Cook panel — dish state" class="screenshot" />

### `scheduled`
- Dish is set, waiting to start
- Edit Recipe / Cancel buttons

### `cooking`
- Actively cooking
- "Lunch is ready" button

### `ready`
- Enter receipt amount + pasta packages
- Confirm deduction
<img src="/screenshots/cook-ready.png" alt="Cook panel — ready state" class="screenshot" />
<img src="/screenshots/cook-ready_2.png" alt="Cook panel — ready state (alternate)" class="screenshot" />

### `done`
- Meal completed, deduction confirmed

## Additional Features

- **Balance gate:** Blocked if balance < -30 EUR
- **Fork-on-cook:** When a shared recipe is picked, the system creates a copy (fork) owned by the current cook
