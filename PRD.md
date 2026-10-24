# Product Requirements Document: Mosque Finance Web App

**Status:** Draft based on the screenshots in `references/` and the product owner's stated goal  
**Product name:** TBD (the reference product is labeled “MasjidCloud”)  
**Primary language and currency:** Indonesian UI; Indonesian rupiah (IDR)  
**Scope note:** The screenshots describe a reference product, not verified behavior of this repository. Decisions that cannot be established from them are marked **TBD**.

## 1. Executive Summary

### Problem Statement

Mosque administrators and treasurers need an easier way to manage mosque finances in one place: record money received and spent, see the current cash position, and prepare reports. Separate spreadsheets or informal records make balances, supporting evidence, and changes difficult to trace.

### Proposed Solution

Build a web app that makes daily mosque finance work simpler for administrators and treasurers. They can record income and expenses, organize them by category, review a dashboard and dated cash ledger, export reports, and inspect who changed financial data. Administrators can manage users and mosque settings; a controlled public report can support transparency.

### Success Criteria

These are **proposed launch targets** pending stakeholder confirmation, not facts inferred from the screenshots.

1. In acceptance testing, 100% of saved income and expense entries appear in the transaction list, dashboard totals, and cash report for the same mosque and date range.
2. In acceptance testing, 100% of report rows reconcile to the displayed closing balance: opening balance + income − expenses = closing balance.
3. At least 95% of trained administrators and treasurers can record a valid transaction with category and amount within two minutes in a usability test.
4. 100% of create, update, and delete actions on transactions, categories, users, and mosque settings produce an attributable audit entry.
5. 100% of cross-mosque access attempts in authorization tests are denied.

## 2. User Experience & Functionality

### Purpose and Users

The app is a finance ledger and reporting workspace for a mosque. Its primary users are the **administrator and treasurer**. Both can add, edit, and delete financial transactions; the administrator also manages users, access, and mosque settings. Viewing or publishing reports for other stakeholders is a secondary use shown or suggested by the reference screens.

| Persona                              | Main need                                                                                                                    | Access assumption                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Treasurer or finance staff (primary) | Add, edit, and delete income/expenses; attach proof; reconcile reports                                                       | Financial transaction write access; exact role name **TBD** |
| Mosque administrator (primary)       | Add, edit, and delete income/expenses; oversee finances; manage categories, users, mosque profile, and transparency settings | Financial transaction and administrative access             |
| Mosque leader or reviewer            | Read balances, reports, and change history                                                                                   | Read-only or admin access **TBD**                           |
| Public visitor                       | View a published financial report when enabled                                                                               | Public access only to explicitly published data **TBD**     |

The screenshots show an **Admin** user and a user creation form with a **viewer** role. The product owner confirmed that both administrators and treasurers may manage transactions. The exact role name for treasurers and viewer permissions are **TBD**.

### Reference Screens and Feature Inventory

| Area                        | Visible reference behavior                                                                                                                                                                   | Screenshot(s)      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Dashboard                   | Mosque switcher; date range; period income, expenses, cash balance, transaction count; month comparison; top income categories; quick actions; trend chart; recent transactions              | `152306`           |
| Income (`Uang Masuk`)       | All-time total and searchable, paginated list; add, edit, delete, and export Excel/CSV; optional proof attachment                                                                            | `152336`, `152354` |
| Expenses (`Uang Keluar`)    | All-time total and searchable, paginated list; add and export Excel/CSV; optional recipient and proof attachment                                                                             | `152344`, `152403` |
| Income and expense types    | Add, edit, and delete categories; example income types include donation, Friday infaq, alms, waqf, and opening balance; expense types include utilities, cleaning, equipment, and renovation | `152409`, `152417` |
| Cash report (`Laporan Kas`) | Date and transaction-type filters; income, expense, and period-balance summaries; chronological ledger with opening/running/closing balances; Excel, PDF, and print actions                  | `152423`           |
| Users (`Pengguna`)          | User list; add user with name, email, password, and role; change-history link                                                                                                                | `152434`, `152444` |
| Change log                  | Filter by table, action, and date range; show time, actor, action, table, and change summary                                                                                                 | `152450`, `152451` |
| Mosque settings             | Name, address, phone, login background upload, and public-transparency toggle                                                                                                                | `152457`           |

### Core User Flow

1. An authorized user signs in and selects a mosque from the header.
2. The user configures income and expense categories for that mosque.
3. An administrator or treasurer records income or an expense with a date, category, positive IDR amount, optional details, and optional proof file.
4. The saved entry appears in its transaction list and contributes to dashboard and report calculations.
5. A reviewer filters the cash report, checks opening and closing balances, and exports or prints it.
6. An administrator reviews the change log and, if desired, enables a public report for the selected mosque.

### User Journeys

These journeys describe the intended end-to-end experience. They expand the screens into actionable flows; steps that depend on unresolved product rules remain marked **TBD**.

#### Journey A — Administrator prepares a mosque for financial recording

**Actor and goal:** An administrator wants the treasurer to start recording the mosque's finances using the correct identity, categories, and access.

| Step | User action                                                                                   | System response and completion condition                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Signs in and selects the mosque from the header.                                              | The app shows the selected mosque on the dashboard and scopes every subsequent screen to it. If the user has one mosque, whether selection is automatic is **TBD**. |
| 2    | Opens **Pengaturan Masjid**, enters name, address, and phone, then saves.                     | Required name is validated; the saved name appears in the header and future reports.                                                                                |
| 3    | Opens **Tipe Pemasukan** and **Tipe Pengeluaran** and creates the categories the mosque uses. | Each category appears in the relevant transaction form; duplicates are rejected.                                                                                    |
| 4    | Opens **Pengguna** and creates a treasurer account with the appropriate role.                 | The account is available for sign-in and has transaction create, edit, and delete permission for this mosque. The password delivery or reset process is **TBD**.    |
| 5    | Reviews the dashboard and opens **Change Log** if setup needs verification.                   | The dashboard shows a truthful empty state or current figures; setup changes have attributable audit entries.                                                       |

**Journey complete when:** The treasurer can sign in, choose the mosque, and find valid categories in both transaction forms. Opening balance setup must be defined before a first report is considered final (**TBD**).

#### Journey B — Treasurer records money received

**Actor and goal:** A treasurer wants to record a donation or other receipt once and immediately see it in the mosque's books.

| Step | User action                                                                                                                             | System response and completion condition                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Signs in, selects the mosque, and chooses **Uang Masuk** or the dashboard's quick action.                                               | The income screen shows that mosque's total and transaction list.                                                                                                 |
| 2    | Selects **Tambah Pemasukan**.                                                                                                           | A form opens with date, income type, amount, payment method, description, and proof upload.                                                                       |
| 3    | Enters a date, active type, and positive IDR amount; optionally adds method, description, and a JPG/PNG/PDF proof file of at most 5 MB. | The form identifies required fields and rejects invalid values or files without discarding valid input.                                                           |
| 4    | Selects **Simpan Transaksi**.                                                                                                           | Exactly one income record is stored with the actor and mosque ID, and the form closes or shows a success state. Double submission does not create a duplicate.    |
| 5    | Reviews the income list and dashboard or report.                                                                                        | The new receipt appears under its date and category; period income and cash balance increase by exactly its amount when the date falls within the selected range. |

**Recovery path:** If save fails, the treasurer sees the cause, keeps entered values, and can retry. If a category is missing, an administrator adds it before the treasurer retries; permission to create categories from the form is **TBD**.

#### Journey C — Administrator or treasurer records an expense and corrects a mistake

**Actor and goal:** An administrator or treasurer wants to record spending with evidence and later correct an incorrect entry without losing accountability.

| Step | User action                                                                         | System response and completion condition                                                                                                                                              |
| ---- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Opens **Uang Keluar** and selects **Tambah Pengeluaran**.                           | A form opens with date, expense type, amount, recipient, description, and proof upload.                                                                                               |
| 2    | Enters required values and optional recipient, description, and proof, then saves.  | One expense is stored and shown in the expense list. The cash balance decreases by its amount in applicable date ranges.                                                              |
| 3    | Notices a wrong amount, category, or date and opens that transaction's edit action. | The form shows the saved values and permits correction to authorized administrators and treasurers.                                                                                   |
| 4    | Saves the correction or deletes the erroneous entry.                                | The transaction list, dashboard, and all affected report ranges recalculate; an audit entry identifies the actor, action, record, and change summary. Deletion semantics are **TBD**. |
| 5    | Opens **Change Log** to verify the correction.                                      | The correction or deletion is visible in chronological history; secret or file contents are not shown.                                                                                |

**Recovery path:** Invalid corrections cannot replace a valid record. An unsupported or oversized proof file is rejected before the financial change is committed. The policy for correcting a closed reporting period is **TBD**.

#### Journey D — Administrator or treasurer closes and shares a cash report

**Actor and goal:** An administrator or treasurer wants to verify a selected period and share a consistent financial report with mosque leadership.

| Step | User action                                                                                    | System response and completion condition                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Opens **Laporan Kas**, chooses start/end dates and all, income, or expense transactions.       | The report shows the selected mosque and period; an invalid date range is rejected.                                                                                |
| 2    | Reads opening balance, transaction rows, running balances, period totals, and closing balance. | Every displayed balance follows the same ledger order and `closing = opening + income − expenses`. An empty period still shows valid opening and closing balances. |
| 3    | Checks an unexpected figure against **Uang Masuk**, **Uang Keluar**, and **Change Log**.       | The user can identify the underlying transaction and its correction history, then resolve the discrepancy through the authorized transaction flow.                 |
| 4    | Selects Excel, PDF, or Print.                                                                  | The output names the mosque and date range and reproduces the same filtered rows and amounts as the screen.                                                        |

**Journey complete when:** The user can reconcile the period and provide a report whose totals match the on-screen ledger. Formal period locking or approval is **TBD** and is not implied by the screenshots.

#### Journey E — Administrator publishes a limited report for the public

**Actor and goal:** An administrator wants community members to see approved financial information without exposing internal records.

| Step | User action                                                      | System response and completion condition                                                                                                                    |
| ---- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Opens **Pengaturan Masjid** and reviews **Transparansi Publik**. | The setting is off for a new mosque by default. The exact public fields and URL are **TBD**.                                                                |
| 2    | Enables publication after checking the permitted data.           | The app records the actor and time, then makes only allowlisted report fields available without sign-in.                                                    |
| 3    | Opens the public view as a visitor.                              | The visitor sees the published mosque identity, period, and approved totals or rows; they cannot access attachments, internal notes, users, or change logs. |
| 4    | Disables publication when sharing is no longer appropriate.      | Public access stops and the change is recorded in the audit log.                                                                                            |

**Journey complete when:** A visitor can access only the approved public report while the setting is on, and receives no report data when it is off. This journey depends on a stakeholder-approved publication policy.

### User Stories and Acceptance Criteria

**US-01 — Select a mosque and inspect its dashboard.** As an authorized user, I want to choose a mosque and date range so that I can see that mosque's financial position.

- The selected mosque name is visible in the header and all financial screens use only that mosque's data.
- A valid start and end date can be selected; an end date before the start date is rejected.
- The dashboard shows income, expenses, cash balance, and transaction count for the chosen period, plus a prior-month comparison, category breakdown, trend chart, and recent transactions when data exists.
- Empty states show zero totals and clear “no data” messages without inventing activity.
- Quick actions open income entry, expense entry, the cash report, or the relevant category page.

**US-02 — Record and manage income.** As an administrator or treasurer, I want to record incoming funds so that donations and other receipts are included in the mosque ledger.

- Creating an income entry requires a date, an active income type, and an amount greater than zero in IDR.
- The form offers payment method, description, and one optional proof file. The reference accepts JPG, PNG, or PDF up to 5 MB.
- A successful save creates one transaction only, updates the list and calculated totals, and shows a success state; validation failures preserve entered values.
- The income list shows date, income type, amount, payment method, description, and attachment availability; users can search and page through it.
- Administrators and treasurers can edit or delete an entry, with an audit record and recalculated balances. Deletion behavior (soft delete versus permanent removal) is **TBD**.
- Exported CSV or spreadsheet data matches the active mosque and the visible filters; exact export filter controls are **TBD**.

**US-03 — Record and manage expenses.** As an administrator or treasurer, I want to record outgoing funds so that mosque spending is reflected in the cash position.

- Creating an expense requires a date, an active expense type, and an amount greater than zero in IDR.
- The form offers recipient, description, and one optional JPG, PNG, or PDF proof file up to 5 MB.
- Saving, listing, searching, pagination, administrator/treasurer correction and deletion, exports, audit entries, and balance updates follow the same rules as income.
- The expense list shows date, expense type, amount, recipient, description, and attachment availability.

**US-04 — Maintain transaction types.** As an administrator, I want to add, rename, and retire income and expense types so that entries use consistent categories.

- Income and expense types are kept separate and scoped to the selected mosque.
- A category name is required and cannot duplicate an active category of the same kind in the same mosque after case and whitespace normalization.
- Existing transactions retain a readable category name after a category is renamed or retired.
- Removing a category with linked transactions cannot erase or invalidate historical entries; the exact archive/delete policy is **TBD**.
- Category changes appear in the change log.

**US-05 — Review and export a cash report.** As a reviewer, I want a dated cash ledger so that I can verify income, spending, and balances.

- A report can be filtered by inclusive start/end dates and by income, expense, or all transactions.
- It shows opening balance immediately before the start date, each matching transaction in deterministic order, running balance, period income and expenses, and closing balance.
- The report uses `closing = opening + income − expenses`; identical amounts and ordering are used in the on-screen report, Excel export, PDF export, and print view.
- Opening balance is displayed as a distinct ledger item, as in the reference. How an administrator initially sets or adjusts it is **TBD**.
- Reports clearly identify the mosque and selected date range.

**US-06 — Manage users and permissions.** As an administrator, I want to create users and assign roles so that access matches responsibilities.

- The add-user form requires name, unique email, password, and role.
- A viewer can read only the screens allowed by the eventual role policy. Role names, edit/deactivation flow, and invitation or password-reset flow are **TBD**.
- Financial writes, user management, settings, audit viewing, and public publishing are authorized on the server for the selected mosque.
- User creation and role changes are captured in the change log without recording password values.

**US-07 — Inspect the change log.** As an administrator or reviewer, I want to see who changed records so that discrepancies can be investigated.

- Each auditable action stores time, actor, action, affected entity/table, record identifier, and a safe change summary.
- Administrators and treasurers can read the change log for their mosque; viewer access is **TBD**.
- The log can be filtered by entity/table, action, and date range and is shown newest first by default.
- Ordinary users cannot alter or delete audit entries through the app.
- The log excludes passwords, authentication tokens, and attachment file contents.

**US-08 — Configure the mosque and public report.** As an administrator, I want to manage mosque information and public visibility so that reports carry the correct identity and sharing is intentional.

- The profile saves mosque name (required), address, and phone and shows the updated name in the mosque selector and reports.
- The login background accepts JPG, PNG, or WebP up to 5 MB; the reference recommends 1920×1080 pixels.
- The public-transparency setting defaults to off for a new mosque unless product owners decide otherwise.
- When enabled, only an explicitly defined public report is accessible without sign-in; user details, audit logs, attachments, and internal notes are excluded. The public report's fields, URL, and publication timing are **TBD**.
- Settings changes appear in the change log.

### Non-Goals

- Bank account connections, automatic bank reconciliation, and payment collection.
- Full general-ledger accounting, tax reporting, payroll, and inventory.
- Donor CRM, pledge tracking, and automated donation receipts.
- AI analysis or prediction; no AI function is shown in the references.
- Native mobile apps. The web UI should still work on common mobile screen sizes.
- The reference site's donation/support, help, tutorial, about, and shortcut links are navigation cues, not core financial features for this release.

## 3. AI System Requirements (If Applicable)

Not applicable. The reference screens do not show an AI feature.

## 4. Technical Specifications

### Architecture Overview

The current repository is a starter monorepo with a TanStack Start web app, shared shadcn UI components, Better Auth, Drizzle ORM, PostgreSQL, and Turborepo. This is the implementation baseline visible in `README.md`; product behavior described above still needs to be built.

The web app submits authenticated requests to server-side actions or APIs. The server validates the selected mosque and user permission, writes a transaction and its audit entry atomically, and stores attachment metadata with access-controlled file storage. Dashboard cards and reports derive from the same transaction ledger and category records. The public report uses a separate read path gated by the mosque's transparency setting.

**Proposed data entities:** Mosque, MosqueMembership, User, IncomeType, ExpenseType, Transaction, Attachment, AuditEntry, and MosqueSettings. A transaction has mosque ID, kind (income/expense), effective date, positive amount in integer rupiah, category ID, optional method or recipient, description, creator, timestamps, and deletion status if soft deletion is selected. Financial amounts must not use floating-point storage.

### Integration Points

- **Authentication:** Existing Better Auth package; final sign-in method and account lifecycle are **TBD**.
- **Database:** Existing PostgreSQL and Drizzle packages; schema and migrations required for the proposed entities.
- **File storage:** Private attachment storage and optional public login-background asset storage; provider is **TBD**.
- **Exports:** Server-generated CSV/Excel and PDF or print output from the same filtered report data; library choice is **TBD**.
- **External services:** None required by the screenshots.

### Security & Privacy

- Enforce membership and role checks server-side on every mosque-scoped read, write, file download, and export. Never trust the selected mosque ID from the browser alone.
- Keep receipts/proof files private by default. Validate file size and actual media type, use generated storage names, and prevent executable content from being served inline.
- Record audit entries in the same database transaction as the corresponding change where feasible; restrict audit-log access and redact secrets.
- Require an explicit administrator action to publish financial information. The public view must use an allowlist of fields and must stop serving private data when transparency is disabled.
- Protect credentials and sessions using the existing authentication system. Password and retention policies are **TBD**.
- Define backups, restore checks, attachment retention, and local regulatory requirements with the product owner before production launch.

### Validation and Test Scenarios

- Record one income and one expense; verify list totals, dashboard, report, and exports reconcile exactly in IDR.
- Backdate a transaction and verify opening and running balances for multiple date ranges, including an empty range and same-day entries.
- Edit and delete a transaction and verify all derived totals and the audit trail update correctly.
- Switch mosques and verify data, categories, exports, attachments, and users never leak across mosque boundaries.
- Try invalid dates, zero/negative amounts, duplicate categories, unsupported or oversized files, and unauthorized actions; verify saves fail without partial records.
- Toggle public transparency and verify public access follows the setting while private fields remain inaccessible.

## 5. Risks & Roadmap

### Phased Rollout

| Phase | Scope                                                                                                                                                                                                                                                   | Exit gate                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| MVP   | Authentication and mosque membership; basic mosque profile and admin creation of treasurer accounts; income/expense categories; transaction forms and lists; cash report with correct balances; basic dashboard; server authorization and audit entries | Acceptance tests for US-01 through US-05 and core audit/authorization rules pass |
| v1.1  | Proof attachments; CSV/Excel and PDF exports; print view; fuller user lifecycle; detailed audit filters                                                                                                                                                 | Export reconciliation, file validation, and role tests pass                      |
| v2.0  | Login background and advanced mosque settings; opt-in public transparency report; richer dashboard comparisons/charts                                                                                                                                   | Public/private access tests and stakeholder review of public fields pass         |

### Technical Risks

| Risk                                   | Impact                                   | Mitigation                                                                               |
| -------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Ambiguous opening-balance policy       | Reports can appear inconsistent          | Agree on initialization and adjustment rules before building the ledger                  |
| Backdated edits and deletions          | Historical running balances change       | Compute from ledger history with stable ordering; audit every correction                 |
| Multi-mosque data leakage              | Exposure of financial and user data      | Centralize mosque-scoped authorization and add cross-mosque tests                        |
| Export/report divergence               | Stakeholders receive conflicting figures | Use one report calculation/query for UI and all export formats                           |
| Public-transparency scope is undefined | Private financial details may be exposed | Define a published-field allowlist and keep the setting off until approved               |
| File upload abuse or storage growth    | Security and cost concerns               | Enforce media/size limits, private storage, download authorization, and retention policy |

### Decisions Needed

1. Confirm measurable success targets for making the administrator's and treasurer's financial work easier.
2. Confirm deadline, budget, hosting, and whether the repository's current stack is mandatory.
3. Define the treasurer role name, viewer permissions, and multi-mosque membership rules. Administrators and treasurers both have transaction create, edit, and delete access.
4. Decide opening-balance setup, correction/deletion policy, and category archival behavior.
5. Define which fields, periods, and attachments (if any) appear on the public report.
6. Confirm export formats, file storage provider, retention, and backup requirements.

### Reference Basis

This draft is derived from the thirteen PNG screenshots in `references/`, captured on 2026-10-07. They show interface states, not complete workflows or verified business rules. The roadmap, KPI targets, security controls, and data model are proposed requirements to validate with stakeholders.
