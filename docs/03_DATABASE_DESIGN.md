# 03 — Bubble database design

**Principle:** model the supplied data relationally, preserve every supplied value, and never invent records the dataset does not contain.

## 1. Schema at a glance

```text
User (built-in)
  role            Role option set: Admin | Author
  author_profile  → Author (empty for admins)

Author
  1 ─── many Book
  1 ─── many NotificationLog

Book
  many ─── 1 Author

NotificationLog
  many ─── 1 Author
  many ─── 1 User (requested_by)
```

Bubble's built-in `User` is the login identity. `Author` is the business record (royalty profile). They are deliberately separate:

- An admin does not need a fake Author record.
- An author's login can be created or reset without changing royalty data.
- The `User.author_profile` link is the single source of identity for privacy rules.
- No second `Author.user` back-link is needed; duplicating the relationship in both directions invites drift.

## 2. Option sets

| Option set | Options | Notes |
| --- | --- | --- |
| `Role` | `Admin`, `Author` | Used by privacy rules and page redirects. |
| `NotificationStatus` | `Queued`, `Processing`, `Success`, `Failed` | `Queued`/`Processing` make in-flight and stuck runs visible. The assignment's required terminal states are `Success` and `Failed`. |
| `PayoutFilter` | `All`, `Fully Paid`, `Pending`, `Overdue` | Admin UI filter state only. |
| `TriggerSource` | `Single`, `Bulk` | Distinguishes manual and bulk runs in the log. |

`Book.status` is a **text field**, not an option set. The dataset contains compound values (`In Production - Cover Design`, `In Production - Typesetting`) and the exact strings must be preserved. The UI tests the prefix `In Production` to choose the neutral badge.

## 3. Data types and fields

Field names are lowercase snake_case and must match the CSV headers exactly. Bubble is case-sensitive in CSV field mapping.

### 3.1 User (built-in)

| Field | Type | Rules |
| --- | --- | --- |
| `email` | text (built-in) | Required; unique in practice; used for login. |
| `role` | `Role` option set | Required for staff/author routing. |
| `author_profile` | `Author` | Required for authors; empty for admins. |
| `display_name` | text | Optional; shown in the top bar. |

Do not store passwords anywhere in the app data or repository. Bubble manages password hashes.

### 3.2 Author

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `author_id` | text | Yes | `AUTH001`…`AUTH010`; business key. |
| `name` | text | Yes | Full name. |
| `email` | text | Yes | Dataset email; not necessarily the login email. |
| `phone` | text | Yes | Keep the leading `+` and hyphens as text. |
| `city` | text | Yes | Used by the admin city filter. |
| `joined_date` | date | Yes | Date only; display with a date format. |

No aggregate fields (`total_books`, `total_pending`, etc.) are stored. They are computed from the related Books so the figures cannot drift. With 10 authors and 18 books, the workload is negligible.

### 3.3 Book

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `book_id` | text | Yes | `BK001`…`BK018`; business key. |
| `title` | text | Yes | Preserve punctuation, including `Durga’s Daughters`. |
| `isbn` | text | Yes | Text, not number; hyphens and `X` characters matter. |
| `genre` | text | Yes | Slash-separated values preserved. |
| `publication_date` | date | No | Null for in-production books. |
| `status` | text | Yes | Exact dataset string. |
| `mrp` | number | No | Null for in-production books. |
| `author_royalty_per_copy` | number | No | Null for in-production books. |
| `total_copies_sold` | number | Yes | `0` for in-production books. |
| `total_royalty_earned` | number | Yes | `0` for in-production books. |
| `royalty_paid` | number | Yes | `0` where supplied. |
| `royalty_pending` | number | Yes | `0` where supplied. |
| `last_royalty_payout_date` | date | No | Null means no payout ever recorded. |
| `print_partner` | text | No | Null for in-production books. |
| `available_on` | list of texts | Yes | Empty list for in-production books; otherwise exact platform names. |
| `author` | `Author` | Yes | Relationship; one author per book. |

`royalty_pending` is stored even though it equals `total_royalty_earned − royalty_paid` in this dataset. It is a supplied figure, it is queryable, and preserving it makes the import auditable. The validation script asserts the identity for every row.

### 3.4 NotificationLog

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `author` | `Author` | Yes | The author this summary is for. |
| `requested_by` | `User` | Yes | Admin who clicked. |
| `requested_at` | date | Yes | Set when the log is created. |
| `status` | `NotificationStatus` | Yes | Starts `Queued`. |
| `completed_at` | date | No | Set by callback or Bubble failure handler. |
| `request_id` | text | Yes | Unique per trigger; used by n8n and the callback. |
| `idempotency_key` | text | Yes | `author_id + time bucket` for duplicate detection. |
| `trigger_source` | `TriggerSource` | Yes | `Single` or `Bulk`. |
| `summary_subject` | text | No | AI-generated email subject. |
| `summary_body` | text (long) | No | AI-generated email body, stored for admin review. |
| `ai_model` | text | No | e.g. `openai/gpt-4o-mini` or `fallback`. |
| `error_message` | text (long) | No | Human-readable failure reason. |
| `n8n_execution_id` | text | No | Correlation with the n8n execution. |
| `attempt_count` | number | No | Starts 0; incremented on retry. |
| `email_sent` | yes/no | Yes | Default `no`; only set `yes` if SMTP is explicitly enabled. |
| `email_sent_at` | date | No | Set only when an email is actually sent. |

Do not add a `Book` link to the log. A summary covers all of an author's books; the payload and stored body capture the detail.

## 4. Relationships

| Relationship | Cardinality | Deletion behaviour |
| --- | --- | --- |
| `User.author_profile` → `Author` | many Users to one Author (in practice one-to-one) | Do not delete an Author with a linked User. |
| `Book.author` → `Author` | many Books to one Author | Books must be deleted before their Author in a rollback. |
| `NotificationLog.author` → `Author` | many Logs to one Author | Keep logs as an audit trail. |
| `NotificationLog.requested_by` → `User` | many Logs to one User | Keep logs if a staff account changes. |

Bubble does not enforce foreign keys or unique constraints. Enforce them in workflows/import validation:

- Before creating an Author, search for the same `author_id`.
- Before creating a Book, search for the same `book_id` and require `author` non-empty.
- The import script already refuses partial author mappings.

## 5. Why there is no `PayoutRecord`

The dataset contains:

- `royalty_paid` — one aggregate amount per book.
- `royalty_pending` — one aggregate amount per book.
- `last_royalty_payout_date` — one date per book.

It does **not** contain transaction IDs, individual payout amounts, payout methods, bank references, or a dated history. Creating `PayoutRecord` rows from these aggregates would fabricate history and mislead the author.

The admin and author views therefore show a **Payout summary (aggregate)**:

- Royalty paid to date: `Book.royalty_paid`.
- Last payout recorded: `Book.last_royalty_payout_date` (or "No payout recorded").
- A short note: "The supplied dataset contains aggregate royalty figures and a last-payout date. It does not contain transaction-level payout history, so none is shown."

If genuine transaction rows become available later, add `PayoutRecord` with `book`, `author`, `paid_at`, `amount`, `method`, `reference` and a reconciliation check. Do not backfill it now.

## 6. Privacy rules

Bubble privacy rules are the enforcement layer; page redirects are only UX.

### 6.1 Matrix

| Data type | Admin | Author (own) | Author (other) | Logged out |
| --- | --- | --- | --- | --- |
| `User` | View all | View self | No | No |
| `Author` | View all | View own profile | No | No |
| `Book` | View all | View own books | No | No |
| `NotificationLog` | View all | No | No | No |

### 6.2 Rule expressions

`Author`:

- Admin: `Current User's role is Admin` → all fields visible.
- Author: `Current User's author_profile is This Author` → all fields visible.
- Everyone else: no access.

`Book`:

- Admin: `Current User's role is Admin` → all fields visible.
- Author: `Current User's author_profile is This Book's author` → all fields visible.
- Everyone else: no access.

`NotificationLog`:

- Admin: `Current User's role is Admin` → all fields visible.
- No author rule. Authors cannot read logs, including their own. The log is an internal operations record.

`User`:

- Admin: all.
- Self: `This User is Current User` for the profile fields needed by the app.
- Do not expose other users' emails or roles.

### 6.3 Page-level guards

- `admin-*` pages: on page load, if `Current User's role is not Admin`, redirect to login/403.
- `author-*` pages: if `Current User's role is not Author` or `author_profile is empty`, redirect.
- Never rely on a URL parameter to select an author. Always derive the author from `Current User's author_profile`, except on admin pages where the selected Author is loaded by Unique ID and the admin role is verified.

### 6.4 Data API

- Keep the Bubble Data API disabled for external clients. n8n receives a payload instead.
- Enable backend workflows for the callback, but expose only the single callback API workflow.
- Require authentication on the callback workflow; do not make it "run without authentication".
- The callback workflow may ignore privacy rules because it runs as a trusted system operation. It must validate the bearer token and the `request_id` before writing.

## 7. Derived values and filters

### 7.1 Author totals

Computed live from the author's Books:

- Total books: `Search for Books (author = This Author):count`.
- Total earned: `...:each item's total_royalty_earned:sum`.
- Total paid: `...:each item's royalty_paid:sum`.
- Total pending: `...:each item's royalty_pending:sum`.
- Published/in-production counts: filtered counts by `status`.

These match `data/author-summary.csv`:

| Author | Books | Earned | Paid | Pending | Payout status |
| --- | --- | --- | --- | --- | --- |
| AUTH001 | 2 | 19,908 | 16,338 | 3,570 | Overdue |
| AUTH002 | 2 | 84,024 | 71,000 | 13,024 | Overdue |
| AUTH003 | 1 | 2,546 | 0 | 2,546 | Overdue |
| AUTH004 | 2 | 15,195 | 11,845 | 3,350 | Overdue |
| AUTH005 | 2 | 25,295 | 22,240 | 3,055 | Overdue |
| AUTH006 | 1 | 2,464 | 0 | 2,464 | Overdue |
| AUTH007 | 3 | 60,865 | 53,000 | 7,865 | Overdue |
| AUTH008 | 1 | 3,120 | 3,120 | 0 | Fully paid |
| AUTH009 | 2 | 850 | 0 | 850 | Overdue |
| AUTH010 | 2 | 29,115 | 25,000 | 4,115 | Overdue |

### 7.2 Payout status filter

Desired semantics:

- **Fully paid**: total pending = 0.
- **Overdue**: at least one published book is Red.
- **Pending**: total pending > 0 and no book is Red.

Primary implementation: a dropdown bound to `PayoutFilter`; the author repeating group's data source is conditionally changed or `:filtered` with an advanced expression using the author's Books.

Examples:

- Fully paid: `This Author's Books:each item's royalty_pending:sum = 0`.
- Overdue: count of this author's books matching the Red rule > 0.
- Pending: total pending > 0 AND the Red count = 0.

Bubble's advanced filters run client-side and some nested-list expressions are version-sensitive. If the editor rejects the nested expression:

1. Use three stacked repeating groups, each with its own data source, and show only the group matching the dropdown.
2. Or use a Book search grouped by Author for the Overdue/Pending views.
3. Or add cached helper fields on Author and recalculate them in a backend workflow. This is the last resort because it introduces drift.

The fallback must still produce the same three result sets. Do not silently change the requirement to "any pending" for the Pending filter.

### 7.3 Search and city filter

- Name search: `Author.name contains Input's value`; enable "Ignore empty constraints".
- City filter: dropdown of the 10 cities; `Author.city = Dropdown's value`; ignore empty.
- Combine with the payout filter. Show a result count and an empty state.

## 8. Data integrity rules

| Rule | Enforcement |
| --- | --- |
| `author_id` unique | Import script; pre-create search |
| `book_id` unique | Import script; pre-create search |
| Every Book has an Author | `build-bubble-import.mjs` refuses partial mappings |
| `total_royalty_earned = royalty_paid + royalty_pending` | Local validation; spot-check in Bubble |
| `author_royalty_per_copy × total_copies_sold = total_royalty_earned` for published books | Local validation |
| Non-negative amounts | Local validation; number fields |
| In-production books have no sales/royalty claims | Nulls and zeros preserved; neutral badge |
| No orphan NotificationLogs | `author` and `requested_by` required |
| No duplicate terminal callback for one request | Callback checks existing status |

## 9. Import field map

`data/authors.csv` (pipe-delimited):

```text
author_id | name | email | phone | city | joined_date
```

`data/books.bubble-import.csv` (pipe-delimited, generated after the Author ID map exists):

```text
book_id | title | isbn | genre | publication_date | status | mrp |
author_royalty_per_copy | total_copies_sold | total_royalty_earned |
royalty_paid | royalty_pending | last_royalty_payout_date | print_partner |
available_on | author_id | author
```

`available_on` is a JSON array in one cell, for example `["Amazon India","Flipkart"]`. `author` is the Bubble Unique ID of the linked Author.

## 10. Bubble-specific notes

- Set the app timezone to **Asia/Kolkata**. Dates are imported at 12:00 PM to keep the calendar date stable across time zones.
- Use date formatting that hides the time in the UI (`d MMM yyyy`).
- Bubble stores dates as timestamps; comparisons use `Current date/time`.
- `available_on` is a list of texts, not a comma-separated string. Do not split it in display expressions.
- Avoid option sets for `Book.status`; exact text preservation matters.
- Do not store the AI API key, webhook secret or callback token in any data type, page, or option set.
