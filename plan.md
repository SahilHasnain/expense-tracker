# Money OS MVP Implementation Plan

## 1. Product Goal

Build the fastest way to understand where money is going, with expense entry taking no more than three taps after opening the app.

Temporary product name: **Money OS**.

The MVP should be daily-use-worthy, not feature-complete. The primary user loop is:

1. Open the app.
2. Enter an amount.
3. Select a category.
4. Save.
5. Understand today's and this month's spending at a glance.

## 2. MVP Scope

### Must Have

1. **Dashboard**
   - Show today's spending.
   - Show remaining monthly budget.
   - Show current month's total spending.
   - Show the top spending category.
   - Keep the initial view simple: no charts.

2. **Quick Add Expense**
   - Make amount entry the first and most prominent action.
   - Allow category selection from the standard categories.
   - Make description optional.
   - Set date and time automatically.
   - Save an expense in a maximum of three taps after opening.
   - Provide validation for empty, invalid, or non-positive amounts.

3. **Income and Expense Timeline**
   - Display transactions chronologically by day and time.
   - Clearly distinguish income from expenses.
   - Show title, amount, category, and timestamp.
   - Support editing and deleting an entry.

4. **Smart Categories**
   - Seed Food, Transport, Shopping, Home, Work, Entertainment, Health, and Education.
   - Assign each category a consistent icon and color.
   - Keep the category model extensible for custom categories later.

5. **Monthly Budget**
   - Let the user set a monthly budget.
   - Show budget, spent, remaining amount, and a progress bar.
   - Handle over-budget state without breaking the layout.

6. **Search**
   - Search transaction titles and notes.
   - Show matching results with the same transaction actions as the timeline.
   - Provide a clear empty state.

7. **Monthly Summary**
   - List spending totals by category for the selected month.
   - Include percentages or relative progress without introducing charts.
   - Support the dashboard's top-category calculation.

8. **Cloud Backup (Post-Launch)**
   - Do not require authentication for the initial MVP.
   - Add Google authentication only after the local data flow is validated.
   - Sync authenticated users' transactions, categories, and budget.
   - Handle loading, offline, sync failure, and sign-out states explicitly.

### Explicitly Out of Scope

Do not build AI, receipt OCR, bank integration, investment tracking, credit cards, loans, cryptocurrency, split expenses, shared wallets, widgets, recurring expenses, multi-currency, or advanced reports in the MVP.

Premium-only capabilities such as CSV/PDF export, multiple accounts, goals, custom icons, recurring expenses, and advanced reports should be deferred until the core loop has usage evidence.

## 3. Proposed App Structure

The current project is a minimal Expo Router application. Evolve it into a small feature-based structure:

```text
app/
  _layout.tsx
  index.tsx                 # Dashboard / timeline home
  add.tsx                   # Quick-add flow
  search.tsx               # Transaction search
  summary.tsx              # Monthly category summary
  settings.tsx             # Budget, account, and sync settings
components/
  AmountInput.tsx
  CategoryPicker.tsx
  TransactionRow.tsx
  BudgetCard.tsx
  SummaryCard.tsx
data/
  categories.ts
  seed.ts
hooks/
  useTransactions.ts
  useBudget.ts
  useSearch.ts
lib/
  calculations.ts
  storage.ts
  sync.ts
types/
  finance.ts
```

Keep calculations and persistence independent from screens so the future roadmap can add bill reminders, subscriptions, savings goals, and net worth without rewriting the transaction model.

## 4. Data Model

Define TypeScript types for:

```ts
type TransactionType = "expense" | "income";

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  note?: string;
  categoryId?: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
};

type MonthlyBudget = {
  month: string; // YYYY-MM
  amount: number;
  updatedAt: string;
};
```

Store money as integer minor units where possible to avoid floating-point errors. Use a single MVP currency configured in settings; do not implement multi-currency yet.

## 5. Implementation Phases

### Phase 1: Foundation and Visual Shell

1. Replace the starter screen with the Money OS home screen.
2. Establish a compact visual system for colors, typography, spacing, cards, status colors, and category colors.
3. Configure Expo Router screens and navigation.
4. Add reusable transaction, budget, category, and empty-state components.
5. Ensure layouts work on narrow mobile screens and larger devices.

### Phase 2: Local Transaction Loop

1. Implement the transaction and category types.
2. Seed default categories and local sample data for development.
3. Implement local persistence suitable for the Expo app.
4. Build the quick-add screen with amount-first focus.
5. Add automatic timestamps and default category behavior.
6. Render the timeline and connect edit/delete actions.
7. Add haptic or visual feedback on successful save where supported.

### Phase 3: Dashboard and Budget

1. Add today's total, monthly total, remaining budget, and top category calculations.
2. Implement monthly budget creation and editing.
3. Add progress states for normal, nearly exhausted, and over-budget conditions.
4. Add income entries so the timeline supports both money in and money out.

### Phase 4: Search and Summary

1. Add transaction search with debounced or responsive filtering as appropriate.
2. Add monthly summary by category.
3. Add month navigation only if it does not slow down the primary current-month experience.
4. Test empty, large-result, and no-match states.

### Phase 5: Optional Authentication and Cloud Backup

This phase is not required for the first launch. Start it only after the core experience shows regular usage and users need cross-device access.

1. Choose and configure the backend/auth provider before adding sync code.
2. Add Google sign-in and account state handling.
3. Define a stable remote schema for transactions, categories, budgets, and user ownership.
4. Sync local data after authentication.
5. Resolve conflicts deterministically using `updatedAt` and document the behavior.
6. Add retry, offline, sign-out, and data-loss prevention states.

### Phase 6: Quality and Release Readiness

1. Add unit tests for totals, date boundaries, category aggregation, search, and budget calculations.
2. Add interaction tests for quick add, edit, delete, and budget updates.
3. Verify the three-tap expense flow on a physical device.
4. Verify persistence after app restart and recovery from failed sync.
5. Run linting and TypeScript checks.
6. Test on Android, iOS, and web where the chosen storage/auth approach supports them.

## 6. UX Acceptance Criteria

- The dashboard answers "where did my money go?" without requiring a chart.
- A returning user can record a basic expense in three taps or fewer after opening.
- Amount entry is the first focus in the add flow.
- Description, location, and other optional details never block saving.
- Date and time are automatic by default.
- The timeline feels like a financial event stream, not a dense report.
- Income and expenses are visually distinct and totals remain understandable.
- Delete actions require an undo or confirmation path to prevent accidental data loss.
- Every screen has loading, empty, and error states where data can be unavailable.
- The app remains usable with long transaction lists and small screens.

## 7. Non-Functional Requirements

- Use TypeScript throughout the feature code.
- Keep business calculations in testable pure functions.
- Avoid storing secrets in the repository.
- Make local persistence resilient to malformed or missing data.
- Keep the data model account-scoped so cloud sync and future financial modules can be added safely.
- Prefer the existing Expo, React Native, Expo Router, and NativeWind stack before adding dependencies.

## 8. Success Metrics

Measure the MVP against behavior rather than feature count:

- Median time from app open to saved expense.
- Percentage of expenses saved within three taps.
- Daily and weekly active users.
- Number of expenses recorded per active user.
- Search usage and summary usage.
- Sync success rate and recovery rate after offline use.
- Retention after the first week.

## 9. Post-MVP Roadmap

Only after the core six capabilities are used regularly, consider adding:

1. Export and advanced reports.
2. Recurring expenses and bill reminders.
3. Subscription tracking.
4. Savings goals.
5. Net worth and investment views.
6. Financial calendar.
7. AI assistance.

The MVP should remain an expense tracker first. Future architecture should be extensible, but future features should not slow down the first successful expense entry.
