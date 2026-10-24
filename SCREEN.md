# Screen Specification — Mosque Finance Web App

**Source of truth:** [PRD.md](PRD.md)  
**Status:** Draft screen plan based on the PRD and screenshots in `references/`  
**Primary users:** Mosque administrator and treasurer  
**UI language:** Indonesian; amounts shown as Indonesian rupiah (`Rp`)

This document defines what each screen must show and what users can do there. The screenshots are visual references, not proof of complete behavior. **TBD** means the PRD requires a product decision before that detail is final. Route paths below are proposed app routes, not existing routes in this repository.

## 1. Navigation and Screen Map

| ID  | Screen / navigation label             | Proposed route          | Access                           | Release                                      | PRD story | Reference                                                                                                    |
| --- | ------------------------------------- | ----------------------- | -------------------------------- | -------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| S00 | Sign in (`Masuk`)                     | `/login`                | Signed-out user                  | MVP                                          | US-06     | No screenshot                                                                                                |
| S01 | Dashboard                             | `/app`                  | Admin, treasurer                 | MVP; richer charts v2.0                      | US-01     | [Dashboard](<references/Screenshot 2026-10-07 152306.png>)                                                   |
| S02 | Income (`Uang Masuk`)                 | `/app/transaksi/masuk`  | Admin, treasurer                 | MVP; files/exports v1.1                      | US-02     | [List](<references/Screenshot 2026-10-07 152336.png>), [form](<references/Screenshot 2026-10-07 152354.png>) |
| S03 | Expenses (`Uang Keluar`)              | `/app/transaksi/keluar` | Admin, treasurer                 | MVP; files/exports v1.1                      | US-03     | [List](<references/Screenshot 2026-10-07 152344.png>), [form](<references/Screenshot 2026-10-07 152403.png>) |
| S04 | Income types (`Tipe Pemasukan`)       | `/app/tipe-pemasukan`   | Admin                            | MVP                                          | US-04     | [Categories](<references/Screenshot 2026-10-07 152409.png>)                                                  |
| S05 | Expense types (`Tipe Pengeluaran`)    | `/app/tipe-pengeluaran` | Admin                            | MVP                                          | US-04     | [Categories](<references/Screenshot 2026-10-07 152417.png>)                                                  |
| S06 | Cash report (`Laporan Kas`)           | `/app/laporan`          | Admin, treasurer; viewer **TBD** | MVP; exports/print v1.1                      | US-05     | [Report](<references/Screenshot 2026-10-07 152423.png>)                                                      |
| S07 | Users (`Pengguna`)                    | `/app/pengguna`         | Admin                            | MVP basic creation; fuller lifecycle v1.1    | US-06     | [List](<references/Screenshot 2026-10-07 152434.png>), [form](<references/Screenshot 2026-10-07 152444.png>) |
| S08 | Change log                            | `/app/change-log`       | Admin, treasurer; viewer **TBD** | MVP basic history; filters v1.1              | US-07     | [Log](<references/Screenshot 2026-10-07 152450.png>)                                                         |
| S09 | Mosque settings (`Pengaturan Masjid`) | `/app/pengaturan`       | Admin                            | MVP basic profile; branding/publication v2.0 | US-08     | [Settings](<references/Screenshot 2026-10-07 152457.png>)                                                    |
| S10 | Public financial report               | Route **TBD**           | Public only when enabled         | v2.0                                         | US-08     | No screenshot                                                                                                |

The screenshot sidebar also contains support, tutorial, about, and donation links. They are outside the core release scope in the PRD. Navigation must not present an action before its release phase or to a user without access.

## 2. Shared App Layout and Behavior

### Authenticated shell

- A persistent left navigation groups **Dashboard**, **Transaksi**, **Master Data**, **Laporan**, and **Pengaturan**, following the references. The active destination is visibly highlighted.
- The top bar shows the selected mosque and signed-in user. The mosque selector lists only mosques the user may access. If there is only one mosque, automatic selection is **TBD**.
- Switching mosques clears or resets page filters and loads that mosque's data. A stale URL or form cannot reveal or write to the previously selected mosque.
- Each page has one clear heading, short purpose text, and its primary action near the heading. Page content must remain usable on narrow screens; sidebar, filters, cards, and tables may reflow or scroll as appropriate.
- Dates use one consistent local display format in forms and tables; report exports identify the date range unambiguously. Exact stored timezone policy is **TBD**.
- Amounts use `Rp` formatting and integer rupiah. Income uses green, expenses red, and balances blue in the references; text and icons must also convey meaning without relying on color.

### Shared interaction states

| State                 | Required behavior                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Loading               | Show a page or section loading state; do not briefly show zero as if it were real data.                                               |
| Empty                 | Show zero totals where meaningful and a specific empty message. Keep the relevant add action available to admin/treasurer.            |
| Validation error      | Identify the field and rule in text, keep valid input, and move focus to the first error.                                             |
| Save in progress      | Disable duplicate submission and show progress on the initiating control.                                                             |
| Save success          | Confirm the action, close/reset the form as appropriate, and refresh every affected list, summary, and report.                        |
| Data or network error | Show a retry action; never imply that an unsaved transaction succeeded.                                                               |
| Unauthorized          | Hide forbidden navigation/actions and deny direct route/API access with a clear access message.                                       |
| Destructive action    | Require confirmation identifying the record; after confirmation, apply the PRD's deletion policy (**TBD**) and record an audit entry. |

All dialogs have a visible title, labeled controls, keyboard focus management, Escape/Cancel behavior, and a way to leave without saving. Tables use headings, readable empty states, and pagination controls with the current page/count.

## 3. Screen Details

### S00 — Sign in

**Purpose:** Let an existing admin or treasurer enter the app. This screen is required by the PRD but is not shown in the references.

- **Content:** Product/mosque identity, credential fields and submit action determined by the existing Better Auth configuration. Specific sign-in method is **TBD**.
- **Success:** Redirect to S01 with an authorized mosque selected, or to a mosque-selection step if the final membership flow requires it.
- **Failure:** Explain invalid credentials without exposing which account exists. A signed-in user sent here is redirected to the app.
- **Later option:** Show the mosque-specific login background configured in S09 when branding ships in v2.0.

### S01 — Dashboard

**Purpose:** Give admin and treasurer an immediate view of the selected mosque's cash position and a path to daily tasks.

- **Inputs:** Selected mosque and start/end dates. Invalid date order blocks refresh and shows an inline error.
- **Summary cards:** Income and expenses for the selected period, cash balance, and transaction count. Define the balance label precisely in UI: period net versus closing cash balance must not be confused; the PRD's ledger calculation is authoritative.
- **MVP content:** Summary cards, recent transactions, and quick actions to add income, add expense, and open the cash report. The selected period and empty state remain visible.
- **v2.0 content:** Current-versus-previous-month comparison, top income categories, and income/expense trend chart shown in the reference.
- **Actions:** Quick actions open S02 or S03 with the add form ready, S06, or the relevant category page if authorized. Admin-only category actions are not offered to treasurers.
- **Empty state:** No activity in the range shows zero period totals, a clear message, and permitted quick actions. It must not imply that the mosque has no older opening balance.

### S02 — Income list and income form

**Purpose:** Record and find money received by the selected mosque.

- **Page content:** All-time income total as labeled in the reference; search field; paginated table with date, income type, amount, payment method, description, and attachment indicator. A list count and current page are visible.
- **Primary action:** `Tambah Pemasukan` opens a dialog. Row actions include view/download proof when present, edit, and delete. Both admin and treasurer may use transaction write actions.
- **Form fields:** Date (required), active income type (required), positive IDR amount (required), payment method (optional), description (optional), and one optional proof file (JPG/PNG/PDF, maximum 5 MB; v1.1).
- **Edit:** Opens the same form prefilled for that record. Saving updates the row, dashboard, reports, and audit log. Deleting asks for confirmation and updates the same views.
- **Export (v1.1):** Excel/CSV action exports the selected mosque's income with filters reflected in the file. Exact list export filters beyond search are **TBD**.
- **Empty state:** State that no income records match the search or exist yet, distinguishing those cases.

### S03 — Expense list and expense form

**Purpose:** Record and find money spent by the selected mosque.

- **Page content:** All-time expense total; search field; paginated table with date, expense type, amount, recipient, description, and attachment indicator.
- **Primary action:** `Tambah Pengeluaran` opens a dialog. Admin and treasurer can add, edit, and delete records.
- **Form fields:** Date (required), active expense type (required), positive IDR amount (required), recipient (optional), description (optional), and one optional proof file (JPG/PNG/PDF, maximum 5 MB; v1.1).
- **Save behavior:** A saved expense decreases the relevant balance; edits/deletions recalculate affected date ranges and create audit entries.
- **Export (v1.1):** Excel/CSV with the same mosque scope and applicable visible filters as the list. Search and empty states follow S02.

### S04 and S05 — Income and expense types

**Purpose:** Let an admin maintain the categories offered in S02 and S03. The two screens use the same layout but keep category kinds separate.

- **Page content:** Page title, examples/help text, category count, name input with `Tambah`, and category cards or rows with edit and delete/retire actions.
- **Validation:** Name is required and unique within the selected mosque and same category kind after case/whitespace normalization. An invalid value leaves the input available for correction.
- **Edit:** A renamed category updates future form choices and remains readable on historical transactions.
- **Delete/retire:** Confirm the action. A type referenced by transactions must remain represented in history; archive versus deletion behavior is **TBD**.
- **Empty state:** Explain that at least one category is needed before recording that kind of transaction, and offer the add input.
- **Access:** Admin only. Treasurer sees existing active types in transaction forms but cannot change the master list.

### S06 — Cash report

**Purpose:** Let users reconcile a date range and share a consistent cash ledger.

- **Filters:** Inclusive start date, end date, and transaction kind (`Semua`, income, expense). Invalid date order is rejected.
- **Summary:** Period income, period expenses, and balance. Labels must distinguish opening balance, period net, and closing balance.
- **Ledger:** Opening balance before the range, dated transaction rows, running balance, period totals, and closing balance. Rows show description/category and incoming or outgoing amount; order is deterministic for same-day records.
- **Calculation:** `closing balance = opening balance + period income − period expenses`. The displayed report and all outputs use the same dataset, order, and arithmetic.
- **Output (v1.1):** Excel, PDF, and print actions. Each identifies mosque and date range and matches the on-screen rows and totals.
- **Empty state:** Show opening and closing balances even when there are no transactions in the range. Explain that there are no matching transactions.
- **Open question:** How an initial opening balance is entered or adjusted remains **TBD** in the PRD; no hidden setup control should be invented for this screen.

### S07 — Users

**Purpose:** Allow an admin to create and manage access for the selected mosque.

- **Page content:** User list with name, email, and role; `Tambah Pengguna`; link to related change history. The reference shows an Admin user and a role picker with `viewer`.
- **Create dialog:** Name, unique email, password, and role are required. Password is masked and never shown again after saving.
- **Permissions:** Admin and treasurer may create, edit, and delete transactions; only admin manages users and mosque settings. Viewer role scope is **TBD**.
- **MVP:** Admin can create a treasurer account and see the membership list. How an initial admin account is bootstrapped is **TBD**.
- **v1.1:** Account edit, role changes, deactivation, invitation, and password reset only after those lifecycle rules are specified in the PRD.
- **Errors:** Duplicate email, invalid role, or failed save produces a field or form error without exposing sensitive data.

### S08 — Change log

**Purpose:** Help admin and treasurer investigate how financial and configuration records changed.

- **Page content:** Entries newest first with time, actor, action, entity/table, record identifier, and safe change summary. No password, token, or file content is displayed.
- **MVP:** Basic chronological history for transaction, category, user, and settings changes; readable empty state.
- **v1.1:** Filters for entity/table, action, and date range, as shown in the reference, plus pagination if needed.
- **Access:** Admin and treasurer can read history for their mosque. No app user can edit or delete it. Viewer access is **TBD**.
- **Empty/error states:** Distinguish no audit history from no entries matching filters; a loading failure offers retry.

### S09 — Mosque settings

**Purpose:** Maintain mosque identity and control optional public visibility.

- **MVP profile:** Mosque name (required), address, and phone with `Simpan Pengaturan`. Successful updates appear in the selector and reports and create an audit entry.
- **v2.0 login background:** Optional JPG/PNG/WebP upload, maximum 5 MB; reference recommendation 1920×1080 pixels. Show current image/preview and upload error state.
- **v2.0 public transparency:** Administrator-only toggle, off for a new mosque. Explain which information would become public before enabling it. Enabling and disabling create audit entries.
- **Related action:** Link to change history for settings. A failed save leaves the current published values unchanged and keeps edits available for retry.

### S10 — Public financial report

**Purpose:** Show approved financial information to a visitor only when the mosque administrator enables public transparency.

- **No reference screen exists.** Layout, URL, published fields, period, and publication timing are **TBD** and require approval before implementation.
- **Minimum behavior:** Display the mosque identity and only an explicit allowlist of report values. Do not expose users, audit logs, attachments, internal notes, or private transaction metadata.
- **Unavailable state:** If publication is off or the mosque cannot be found, return a neutral unavailable state without private data.
- **Consistency:** Published figures must be computed from the same ledger rules as S06 for the published period.

## 4. Access Matrix

| Action                                             | Admin | Treasurer | Viewer  | Public |
| -------------------------------------------------- | ----- | --------- | ------- | ------ |
| View dashboard, transaction lists, and cash report | Yes   | Yes       | **TBD** | No     |
| Add, edit, delete income or expenses               | Yes   | Yes       | No      | No     |
| View/download private proof attachments            | Yes   | Yes       | **TBD** | No     |
| Manage income/expense types                        | Yes   | No        | No      | No     |
| Create/manage users                                | Yes   | No        | No      | No     |
| Read change log                                    | Yes   | Yes       | **TBD** | No     |
| Edit mosque settings or public-transparency switch | Yes   | No        | No      | No     |
| View published report while enabled                | Yes   | Yes       | Yes     | Yes    |

All access checks must be enforced for the selected mosque on the server, including direct URLs, exports, and file downloads.

## 5. Cross-Screen Acceptance Checks

1. A transaction saved on S02 or S03 appears once in its list, S01 totals, and S06 ledger for every date range that includes it.
2. Editing or deleting a transaction recalculates affected balances and adds a readable entry to S08.
3. Changing the selected mosque updates all screen data and prevents access to another mosque's records, files, users, and exports.
4. An empty mosque can be configured through S09, S04/S05, and S07, then record its first transaction without a broken report state.
5. S06 screen, Excel, PDF, and print values match for the same filters once outputs ship in v1.1.
6. A public visitor cannot reach S01–S09. S10 exposes no report data when public transparency is disabled.

## 6. Decisions Still Needed

- Exact role name for the treasurer and the viewer's read permissions.
- Initial admin bootstrap, sign-in method, and password/account recovery flow.
- Opening balance setup, historical correction policy, and transaction/category deletion semantics.
- List export filters, storage provider, and attachment retention rules.
- Public report URL, fields, period, publication timing, and approval policy.
- Whether a single-mosque user is automatically placed in that mosque and which timezone governs transaction dates.

These decisions are also tracked in [PRD.md](PRD.md); changes to them should update both documents.
