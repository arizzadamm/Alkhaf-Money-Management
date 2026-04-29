# Plan: Auto-generate Monthly Income Transaction

## Context
Currently `baseTotalIncome` (Income Bulanan in Settings) is only used as a budget pool reference. It does NOT actually add money to account balances each month. Total Balance only changes when user manually adds Income transactions.

## Goal
When user navigates to a month, automatically generate an Income transaction for that month if:
1. `baseTotalIncome > 0`
2. No auto-generated income exists for that budget_month yet
3. User has at least one account configured

The income is distributed to the first account by default (user can edit/delete it).

## Implementation

### Backend: user-finance Edge Function
Add action `auto_generate_income`:
- Input: `budgetMonth` (e.g. "2026-05")
- Logic:
  1. Get user settings (total_income, accounts)
  2. If total_income <= 0 or no accounts, return { data: null } (skip)
  3. Check if an auto-generated income already exists for this budget_month:
     - Query expenses where user_id, budget_month, category='Income', name LIKE 'Gaji Bulanan%'
  4. If exists, return { data: null } (already generated)
  5. If not, insert a new Income transaction:
     - name: "Gaji Bulanan"
     - amount: total_income
     - account: first account name
     - category: "Income"
     - is_paid: true
     - date: 1st of that month
     - budget_month: the requested month
  6. Return the created transaction

### Frontend: useFinance hook
After fetchTransactions completes for a month, call auto_generate_income.
If it returns a new transaction, re-fetch transactions to show it.

### Frontend: App.jsx
Add the auto-generate call in the data fetching useEffect, after the Promise.all.
