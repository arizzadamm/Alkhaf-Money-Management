# Plan: Essential Features Implementation for AlkaFlow

## Context
AlkaFlow is a personal finance management app built with React + Vite + Supabase. The app currently has basic CRUD for transactions, accounts, categories, goals, admin user management, and Telegram integration. All code lives in a single `App.jsx` (~2129 lines) with `App.css` (~968 lines). Backend uses Supabase Edge Functions.

## Critical Security Issue
Currently, the app stores the user's **password hash** in localStorage/sessionStorage as `SESSION_PROOF_KEY` and sends it to Edge Functions for session verification. All Edge Functions verify sessions by matching `password` column. This must be replaced with random session tokens.

## Features to Implement (9 total)

### Phase 1: Foundation Layer

#### 1. Toast/Snackbar System
**Goal:** Replace all `alert()` and `window.confirm()` calls with an in-app toast notification system.
**Files to modify:** `src/App.jsx`, `src/App.css`
**Implementation:**
- Add a `toasts` state array: `[{ id, message, type, action?, actionLabel?, duration? }]`
- Types: `success`, `error`, `warning`, `info`, `undo`
- Create `addToast(message, type, options?)` and `removeToast(id)` functions
- Render a fixed toast container at bottom-right (desktop) / bottom-center (mobile, above nav)
- Each toast auto-dismisses after 4s (configurable), has close button
- `undo` type toasts have an action button and longer duration (8s)
- CSS: slide-in animation, proper z-index above modals (z-index: 200)
- Replace ALL `alert()` calls with `addToast()`
- Replace `window.confirm()` in `unlinkTelegramConnection` and `deleteAdminUser` with inline confirmation or keep confirm for destructive admin actions

#### 2. Session Token System
**Goal:** Replace password-hash-based session proof with random session tokens stored in a database table.
**Database migration** (`supabase/migrations/20260425_add_session_tokens.sql`):
```sql
create table if not exists public.session_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  user_agent text,
  is_revoked boolean not null default false
);
create index if not exists session_tokens_user_id_idx on public.session_tokens(user_id);
create index if not exists session_tokens_token_idx on public.session_tokens(token);
```

**New Edge Function** (`supabase/functions/auth-session/index.ts`):
- Action `login`: Verify username + password hash, create session token (random UUID), return `{ user, sessionToken }`. Token expires in 30 days for "remember me", 24 hours otherwise.
- Action `logout`: Revoke the session token (set `is_revoked = true`).
- Action `verify`: Check if token is valid and not expired/revoked, return user data. Update `last_used_at`.
- Action `change_password`: Verify current password hash, update to new password hash, revoke all other sessions.

**Frontend changes in `src/App.jsx`:**
- `handleLogin`: Call `auth-session` with action `login` instead of direct Supabase query. Store returned `sessionToken` (not password hash) in storage.
- `SESSION_PROOF_KEY` now stores the session token string.
- `handleLogout`: Call `auth-session` with action `logout` to revoke token server-side, then clear local storage.
- Remove `hashPassword` from login flow (move hashing to happen before calling the edge function, same as now).
- `getStoredSessionProof()` / `storeSessionProof()` remain the same mechanically, but now store a token instead of a hash.

**Update ALL Edge Functions** that call `verifySession`:
- `user-finance/index.ts`: Change `verifySession` to look up `session_tokens` table instead of matching `password` column.
- `telegram-link/index.ts`: Same change.
- `admin-user-management/index.ts`: Same change for `verifyAdminSession`.

The new `verifySession` pattern across all edge functions:
```typescript
const verifySession = async (requesterId: string, sessionProof: string) => {
  const { data, error } = await supabaseAdmin
    .from('session_tokens')
    .select('id, user_id, expires_at, is_revoked')
    .eq('token', sessionProof)
    .eq('user_id', requesterId)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return { ok: false, message: 'Sesi tidak valid.' };

  // Update last_used_at
  await supabaseAdmin.from('session_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);

  // Get user data
  const { data: user } = await supabaseAdmin
    .from('app_users')
    .select('id, username, role')
    .eq('id', data.user_id)
    .single();

  if (!user) return { ok: false, message: 'User tidak ditemukan.' };
  return { ok: true, user };
};
```

### Phase 2: Core Features

#### 3. Change Password
**Goal:** Allow users to change their own password from the Profile page.
**Edge Function:** Already handled by `auth-session` action `change_password`.
**Frontend (`src/App.jsx`):**
- Add state: `isChangePasswordOpen` (boolean)
- Add a "Change Password" button on the Profile page (both desktop and mobile)
- Modal with form: current password, new password, confirm new password
- Client-side validation: new password min 6 chars, confirm must match
- On submit: hash both passwords, call `auth-session` with `action: 'change_password'`
- On success: show success toast, close modal
- On error: show error toast

#### 4. Edit Transaction
**Goal:** Allow editing existing transactions (name, amount, account, category, budget_month).
**Edge Function** (`user-finance/index.ts`):
- Add action `update_transaction`:
  - Required: `transactionId`, `updates` object
  - Allowed update fields: `name`, `amount`, `account`, `category`, `budget_month`, `is_paid`, `date`
  - Verify transaction belongs to user
  - Return updated transaction

**Frontend (`src/App.jsx`):**
- Add state: `editingTransaction` (null or transaction object)
- Add state: `isEditOpen` (boolean)
- When user clicks a transaction row (or an edit icon), set `editingTransaction` and open modal
- Reuse the "Add Expense" modal layout but pre-fill with existing values
- Form fields: name, amount, account, category, budget_month
- On submit: call `invokeFinanceAction('update_transaction', { transactionId, updates })`
- On success: toast "Transaksi berhasil diperbarui", refresh transactions
- Add edit button (Pencil icon) to:
  - Desktop: transaction table rows (new column or alongside delete)
  - Mobile: transaction cards (new button alongside delete)

#### 5. Undo Delete
**Goal:** When deleting a transaction, show an "Undo" toast instead of immediately deleting.
**Implementation in `src/App.jsx`:**
- Modify `removeTransaction(id)`:
  1. Store the deleted transaction data in a ref/state
  2. Optimistically remove from UI
  3. Show undo toast with 8-second timer: "Transaksi dihapus" + [Undo] button
  4. If undo clicked: restore transaction to state, cancel the delete
  5. If toast expires: actually call `invokeFinanceAction('delete_transaction', ...)`
- Use `useRef` for pending delete timeout to handle cleanup
- Same pattern for admin user delete (optional, can keep confirm for admin)

### Phase 3: Enhancement Features

#### 6. Budget Over-limit Alert
**Goal:** Show visual warnings when spending approaches or exceeds budget category limits.
**Frontend (`src/App.jsx`):**
- In the Budget Categories widget (both home desktop and mobile):
  - When spending >= 80% of category target: yellow/amber warning bar color
  - When spending >= 100%: red bar color + "Over budget!" badge
- Add a `budgetAlerts` computed value (useMemo):
  ```js
  const budgetAlerts = useMemo(() => {
    return categories.map(cat => {
      const spent = totals.categoryTotals[cat.name] || 0;
      const target = (cat.targetPercentage / 100) * effectiveTotalIncome;
      const percent = target > 0 ? (spent / target) * 100 : 0;
      return { name: cat.name, spent, target, percent, status: percent >= 100 ? 'over' : percent >= 80 ? 'warning' : 'ok' };
    });
  }, [categories, totals, effectiveTotalIncome]);
  ```
- On page load (useEffect), if any category is "over" or "warning", show a toast notification:
  - "Pengeluaran {category} sudah {percent}% dari budget!"
- Add this to the Notification System bell icon panel too

#### 7. Filter & Sort Lanjutan
**Goal:** Add comprehensive filtering and sorting to the Transactions view.
**Frontend (`src/App.jsx`):**
- Add states:
  - `filterCategory` (string, '' = all)
  - `filterAccount` (string, '' = all)
  - `filterType` (string: '' | 'income' | 'expense' | 'transfer')
  - `filterStatus` (string: '' | 'paid' | 'unpaid')
  - `sortBy` (string: 'date' | 'amount' | 'name')
  - `sortOrder` (string: 'desc' | 'asc')
  - `isFilterOpen` (boolean) for mobile filter sheet
- Update `filteredTransactions` useMemo to apply all filters
- Desktop: Add filter dropdowns row above the transaction list in the transactions toolbar
- Mobile: Add a "Filter" button that opens a bottom sheet with filter options
- Sort toggle buttons alongside the period toggle
- Add "Clear Filters" button when any filter is active
- Show active filter count badge

#### 8. Formatted Number Input
**Goal:** Add thousand separator formatting to all number inputs.
**Implementation:**
- Create a `FormattedNumberInput` component:
  ```jsx
  const FormattedNumberInput = ({ value, onChange, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');
    
    useEffect(() => {
      setDisplayValue(value ? Number(value).toLocaleString('id-ID') : '');
    }, [value]);
    
    const handleChange = (e) => {
      const raw = e.target.value.replace(/\D/g, '');
      const num = Number(raw) || 0;
      setDisplayValue(num.toLocaleString('id-ID'));
      onChange(num);
    };
    
    return <input type="text" inputMode="numeric" value={displayValue} onChange={handleChange} {...props} />;
  };
  ```
- Replace all `<input type="number">` for monetary amounts with `FormattedNumberInput`:
  - Add Expense modal: amount field
  - Top Up modal: amount field
  - Transfer modal: amount field
  - Edit Transaction modal: amount field
  - Settings: income, account balance fields
  - Goals: currentAmount, targetAmount fields

#### 9. Notification System (Bell Icon)
**Goal:** Make the bell icon functional with a notification panel.
**Frontend (`src/App.jsx`):**
- Add state: `isNotificationOpen` (boolean), `notifications` (array)
- Generate notifications from computed data (useMemo):
  - Budget alerts (from budgetAlerts)
  - Unpaid transactions count
  - Goals progress milestones (50%, 75%, 100%)
- Notification panel:
  - Desktop: dropdown panel below bell icon (absolute positioned)
  - Mobile: bottom sheet
- Each notification: icon, title, description, timestamp, read/unread state
- Show notification count badge on bell icon (red dot already exists, make it show count)
- Mark as read on click
- "Mark all as read" button
- CSS: notification panel with proper z-index, slide-in animation

## File Change Summary

### New Files
1. `supabase/migrations/20260425_add_session_tokens.sql` - Session tokens table
2. `supabase/functions/auth-session/index.ts` - Login/logout/verify/change-password

### Modified Files
1. `src/App.jsx` - ALL frontend features (toast, session token, change password, edit transaction, undo delete, budget alerts, filters, formatted input, notifications)
2. `src/App.css` - Styles for toast, notification panel, filter UI, formatted input, budget alert badges, edit modal
3. `supabase/functions/user-finance/index.ts` - New verifySession using tokens, add `update_transaction` action
4. `supabase/functions/admin-user-management/index.ts` - New verifyAdminSession using tokens
5. `supabase/functions/telegram-link/index.ts` - New verifySession using tokens

## Execution Order
1. Database migration (session_tokens table)
2. New auth-session Edge Function
3. Update existing Edge Functions (verifySession pattern + update_transaction)
4. Frontend: Toast system first (used by everything else)
5. Frontend: Session token integration
6. Frontend: All remaining features (can be done in parallel since they're mostly independent UI additions)
