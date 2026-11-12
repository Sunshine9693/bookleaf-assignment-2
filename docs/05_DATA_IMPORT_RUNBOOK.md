# 05 — Bubble data import runbook

This runbook is written to be executed **after** the Bubble app and plan decision are approved. It is deliberately conservative: verify a small sample, export the author IDs, then import books only when every book has a valid author link.

## 0. Preconditions

- [ ] Bubble app exists and is empty of `Author`/`Book` data (or a backup exists).
- [ ] You can sign in to the Bubble editor.
- [ ] `data/authors.csv` and `data/books.csv` exist and `data/VALIDATION_REPORT.md` says **PASS**.
- [ ] You have run `node scripts/convert-dataset.mjs` after any dataset change.
- [ ] You have approval to import 10 authors and 18 books.
- [ ] You know the app timezone. Set it to **Asia/Kolkata** in Settings → General before importing dates.

Bubble's CSV import is append-only. It does not update existing rows. If you import twice, you get duplicates. Verify counts before and after every import.

## 1. Create the option sets

In Bubble: **Data → Option sets**.

| Option set | Options |
| --- | --- |
| `Role` | `Admin`, `Author` |
| `NotificationStatus` | `Queued`, `Processing`, `Success`, `Failed` |
| `PayoutFilter` | `All`, `Fully Paid`, `Pending`, `Overdue` |
| `TriggerSource` | `Single`, `Bulk` |

Option display text must match exactly. These are used in expressions and filters.

## 2. Create the Author fields

Data type: **Author**.

| Field | Type |
| --- | --- |
| `author_id` | text |
| `name` | text |
| `email` | text |
| `phone` | text |
| `city` | text |
| `joined_date` | date |

Do not create a field called `Unique ID`; Bubble creates it automatically and ignores it on import.

## 3. Create the Book fields

Data type: **Book**.

| Field | Type |
| --- | --- |
| `book_id` | text |
| `title` | text |
| `isbn` | text |
| `genre` | text |
| `publication_date` | date |
| `status` | text |
| `mrp` | number |
| `author_royalty_per_copy` | number |
| `total_copies_sold` | number |
| `total_royalty_earned` | number |
| `royalty_paid` | number |
| `royalty_pending` | number |
| `last_royalty_payout_date` | date |
| `print_partner` | text |
| `available_on` | list of texts |
| `author` | Author |

The `author` field must be of type **Author**, not text. This is the relationship that powers privacy rules.

## 4. Create the NotificationLog fields

Data type: **NotificationLog**.

| Field | Type |
| --- | --- |
| `author` | Author |
| `requested_by` | User |
| `requested_at` | date |
| `status` | NotificationStatus |
| `completed_at` | date |
| `request_id` | text |
| `idempotency_key` | text |
| `trigger_source` | TriggerSource |
| `summary_subject` | text |
| `summary_body` | text (allow long text) |
| `ai_model` | text |
| `error_message` | text (allow long text) |
| `n8n_execution_id` | text |
| `attempt_count` | number |
| `email_sent` | yes/no |
| `email_sent_at` | date |

## 5. Import Authors

1. Open **Data → App data → Author**.
2. Click **Upload**.
3. Select `S:\bookleaf-assignment-2\data\authors.csv`.
4. Choose delimiter **`|`** (pipe).
5. Map every column to the matching field. Confirm `joined_date` is mapped as a date, not text.
6. Click **Validate data**. Fix any errors before importing.
7. Import.
8. Confirm **10 rows**.

Spot-check:

- AUTH001 `joined_date` displays as 15 Mar 2023.
- AUTH010 phone is `+91-09876-54321` (leading zero preserved; field is text).
- AUTH007 has 3 books later; the Author row itself has no book count field.

If Bubble reports a date error, confirm the cell looks like `Mar 15, 2023 12:00 PM` and that the app timezone is set. Do not switch the date column to text to "make it import".

## 6. Export Authors with their Bubble Unique IDs

1. In **Data → App data → Author**, click **Export**.
2. Export all fields as CSV, including **Unique ID**.
3. Save as:

```text
S:\bookleaf-assignment-2\data\bubble-authors-export.csv
```

The export is usually comma-delimited. The script parses quoted fields, so values containing commas are safe.

Verify the file has a header containing `Unique ID` and `author_id`, and 10 data rows.

## 7. Build the author ID map and the Books import file

From `S:\bookleaf-assignment-2`:

```powershell
node scripts/build-bubble-import.mjs --export="S:\bookleaf-assignment-2\data\bubble-authors-export.csv"
```

Expected output:

```text
Mapped 10/10 authors from ...\bubble-authors-export.csv
Wrote ...\data\author-id-map.csv
Wrote ...\data\books.bubble-import.csv (18 books, all with an author link)
```

If it reports missing authors, stop. Do not import books. The usual causes are:

- The Author import inserted duplicates or failed rows.
- The export does not include `author_id`.
- The `Unique ID` column was renamed or excluded.

Inspect `data/author-id-map.csv`; it must have 10 rows and Bubble IDs that look like `1750000000000x100000000000000001`.

## 8. Import Books

1. Open **Data → App data → Book**.
2. Click **Upload**.
3. Select `S:\bookleaf-assignment-2\data\books.bubble-import.csv`.
4. Choose delimiter **`|`**.
5. Map every column. Critical mappings:
   - `author` → **Author** (relationship). It must show the Author type, not text.
   - `available_on` → **list of texts**.
   - `publication_date` and `last_royalty_payout_date` → date.
   - `mrp`, `author_royalty_per_copy`, `total_copies_sold`, `total_royalty_earned`, `royalty_paid`, `royalty_pending` → number.
6. Click **Validate data**. If Bubble rejects the list field, see §11.
7. Import.
8. Confirm **18 rows**.

Do **not** import `data/books.csv` directly. It has no Bubble `author` relationship and would create orphan books.

## 9. Verify the import

### Counts

- Authors: 10.
- Books: 18.
- Every Book has a non-empty `author`.
- Every Author has at least one Book.

### Totals

In Bubble, create a temporary page or use the Data tab's export to check:

| Metric | Expected |
| --- | --- |
| Sum of `total_royalty_earned` | ₹2,43,382 |
| Sum of `royalty_paid` | ₹2,02,543 |
| Sum of `royalty_pending` | ₹40,839 |
| Published & Live | 16 |
| In Production | 2 |

### Spot checks

| Check | Expected |
| --- | --- |
| BK001 author | Priya Sharma (AUTH001) |
| BK013 | In Production - Cover Design; null publication date, MRP, per-copy royalty, last payout, print partner; `available_on` empty |
| BK015 | In Production - Typesetting; same null/zero pattern |
| BK005 | Published; `royalty_paid` 0; last payout empty; pending 2,546 |
| BK016 | Published; pending 850; last payout empty |
| BK018 | Published; pending 1,575; last payout empty |
| BK004 `available_on` | Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store |
| BK017 title | `Durga’s Daughters` (curly apostrophe preserved) |

### Relationship integrity

Temporarily add a text element on an admin-only page:

```text
Search for Books:count → 18
Search for Books (author is empty):count → 0
Search for Authors:count → 10
```

If any book has an empty author, delete the imported books and redo §6–§8. Do not patch relationships by hand unless it is a single verified row and the cause is understood.

## 10. Create login users and link profiles

Create these in **Data → App data → User** (or via the app's sign-up page):

| User | Role | Author profile |
| --- | --- | --- |
| Admin test account | `Admin` | empty |
| AUTH001 login | `Author` | Priya Sharma |
| AUTH002 login | `Author` | Rohit Kapoor |
| AUTH008 login (optional, fully paid demo) | `Author` | Farhan Sheikh |

Use the sample author emails for author logins if convenient (`priya.sharma@email.com`, `rohit.kapoor@email.com`, `farhan.sheikh@email.com`). Use a separate admin email that is not a real BookLeaf address.

Passwords:

- Generate strong, unique passwords.
- Do not put them in the repository, docs, screenshots or chat.
- Share test credentials privately with BookLeaf in the submission email or a password-manager link.
- Do not reuse the Bubble account password.

At least two author logins are required to prove isolation. The assignment asks for one author login in the submission, but two make the privacy test credible. Provide the second one if BookLeaf wants to verify isolation themselves; otherwise demonstrate it in the recording.

## 11. Common import problems

| Symptom | Cause | Fix |
| --- | --- | --- |
| `A list must be formatted as a JSON array` | `available_on` is empty or comma-separated text | Keep the JSON array format: `["Amazon India","BookLeaf Store"]`; empty list is `[]` |
| List imports as one text value | Field created as text, not list of texts | Recreate the field as **list of texts**; do not split a text field |
| Date invalid / shifted by a day | Wrong format or timezone | Use `Mar 15, 2023 12:00 PM`; set app timezone to Asia/Kolkata |
| Author relationship empty | No `author` column, wrong file, or ID mismatch | Use `books.bubble-import.csv` generated by the script; verify Unique IDs |
| Relationship imports as text | Field created as text | Recreate `author` as type **Author** |
| Import stuck at 0% | Bubble scheduler queue | Wait, refresh, try a smaller file; do not double-click import |
| Duplicate rows | Import run twice | Delete duplicates before proceeding; export and reconcile |
| Phone loses leading `+`/zero | Field is number | Use text |
| ISBN treated as number | Field is number | Use text |
| `&` in status breaks expression | Unlikely | Compare the exact text; `&` is valid in Bubble text values |

Bubble's importer has known list/date quirks. Always use **Validate data** before importing, and test one row first if the format is uncertain.

## 12. Rollback

If the import is wrong:

1. Export the current `Book` and `Author` data first (for diagnosis).
2. Delete all imported `Book` rows.
3. Delete all imported `Author` rows.
4. Delete any test `NotificationLog` rows.
5. Fix the CSV or field mapping.
6. Re-import from step 5.

Deleting an Author before its Books can leave books with broken links. Delete Books first.

Bubble's version history can restore the app structure, but it does not undo data imports. Data deletion is manual.

## 13. Import sign-off

- [ ] 10 Authors, 18 Books.
- [ ] 0 orphan Books.
- [ ] Totals match the validation report.
- [ ] BK013/BK015 nulls, zeros and empty list preserved.
- [ ] BK005/BK016/BK018 have no payout date.
- [ ] All 5 platforms and 3 print partners present.
- [ ] Test users created and linked.
- [ ] A private note records what was imported and when.

Only after this sign-off should the UI work begin.
