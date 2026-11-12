# 04 — Dynamic royalty status rules

The badge is computed at render time from `Current date/time`. No assessment date is stored in the app, hardcoded in an expression, or baked into the imported data.

## 1. Definitions

- **Published book**: `Book.status` is exactly `Published & Live`.
- **In-production book**: `Book.status` starts with `In Production`.
- **Pending**: `Book.royalty_pending`.
- **Last payout**: `Book.last_royalty_payout_date` (`empty` means no payout ever recorded).
- **Overdue threshold**: **more than 90 days**.
- **Assessment time**: `Current date/time` in the Bubble app timezone (`Asia/Kolkata`).

The 90-day threshold is the assignment's operational overdue rule. It is **not** the royalty policy's quarterly + 45-day payout cycle. The AI summary explains the policy cycle separately; the badge answers "is this balance overdue right now?"

## 2. Decision order

Evaluate in this order. The first match wins.

```text
1. status starts with "In Production"          → NEUTRAL / IN PRODUCTION
2. pending = 0                                  → GREEN
3. last payout exists and is older than 90 days → RED
4. no last payout and publication is older
   than 90 days                                 → RED
5. no last payout, no publication date,
   pending > 0                                  → RED / NEEDS REVIEW
6. otherwise                                    → YELLOW
```

### Why this order

- An in-production book must never be marked overdue, even though its dates are null and its pending is zero.
- A fully paid book is Green even if its last payout was long ago. There is nothing overdue.
- A pending book with a payout older than 90 days is Red.
- A pending book that has never been paid is Red only once it is more than 90 days past publication. A recently published book gets the normal cycle.
- A pending book with no payout and no publication date cannot be assessed; default to Red with a "needs review" note rather than silently showing Green.
- Everything else with pending > 0 is Yellow.

## 3. Bubble expression

Use a reusable element or a group with `Book` as its type. Build three conditional states.

### In Production (check first)

```text
This Book's status contains "In Production"
```

Show a neutral badge labelled **In Production** and the dataset status as secondary text. Do not show Green/Yellow/Red.

### Green

```text
This Book's status is "Published & Live"
and This Book's royalty_pending = 0
```

### Red

```text
This Book's status is "Published & Live"
and This Book's royalty_pending > 0
and (
  (
    This Book's last_royalty_payout_date is not empty
    and This Book's last_royalty_payout_date < Current date/time:plus days (-90)
  )
  or
  (
    This Book's last_royalty_payout_date is empty
    and This Book's publication_date is not empty
    and This Book's publication_date < Current date/time:plus days (-90)
  )
  or
  (
    This Book's last_royalty_payout_date is empty
    and This Book's publication_date is empty
  )
)
```

### Yellow

```text
This Book's status is "Published & Live"
and This Book's royalty_pending > 0
and [the Red condition is false]
```

In Bubble, the cleanest implementation is:

- Conditional 1: In Production → neutral.
- Conditional 2: Green → green.
- Conditional 3: Red → red.
- Default (else): Yellow.

That avoids repeating the negated Red expression.

### Bubble syntax notes

- `Current date/time:plus days (-90)` is the intended operator. If the editor normalises it differently, the meaning must remain "the instant 90 days before now".
- Use `<` (strictly before), not `≤`. A payout exactly 90 days ago is **not** "more than 90 days" and stays Yellow.
- Use `is empty` / `is not empty` for nullable dates.
- If the app timezone is not `Asia/Kolkata`, set it before testing. Dates were imported at 12:00 PM to avoid midnight boundary shifts.
- Do not use a stored `status` field on Book for the badge. The dataset `status` is publication/production status, not royalty status.

## 4. Author-level payout status

Used by the admin overview and filters.

| Status | Rule |
| --- | --- |
| **Fully paid** | Total pending across all books = 0. |
| **Overdue** | Total pending > 0 and at least one published book is Red. |
| **Pending** | Total pending > 0 and no published book is Red. |
| **No royalties yet** (edge case) | Total pending = 0 and every book is in production. |

In the current dataset:

- AUTH008 is **Fully paid** (BK014, pending 0).
- All other authors are **Overdue** because they have at least one Red book.
- No author is **Pending** on 10 November 2026. This is expected and must be documented in the demo; the filter still has to work.

## 5. Current dataset snapshot

As of **10 November 2026** (dynamic calculation; see `data/VALIDATION_REPORT.md` for the full table):

| Badge | Count | Books |
| --- | --- | --- |
| Green | 4 | BK002, BK007, BK008, BK014 |
| Yellow | 0 | — |
| Red | 12 | BK001, BK003, BK004, BK005, BK006, BK009, BK010, BK011, BK012, BK016, BK017, BK018 |
| In Production | 2 | BK013, BK015 |

Why there are no Yellow books: every published book with a pending balance either has a last payout older than 90 days or has never been paid and was published more than 90 days ago. This is a data property, not a hardcoded rule.

Examples:

- **BK001**: pending ₹3,570; last payout 15 Oct 2025; 391 days ago → **Red**.
- **BK002**: pending ₹0; last payout 1 Dec 2025 → **Green** (paid up, regardless of age).
- **BK013**: in production; no dates; pending 0 → **In Production**, never Red.
- **BK016**: pending ₹850; no payout ever; published 5 Nov 2024; 735 days ago → **Red**.
- **AUTH009**: total pending ₹850, below the ₹1,000 payout threshold; still **Red/Overdue** because the book is overdue. The AI should explain the rollover threshold separately, not use it to excuse the overdue status.

## 6. Boundary and edge-case tests

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Pending 0; last payout 2 years ago | Green |
| 2 | Pending > 0; last payout 89 days ago | Yellow |
| 3 | Pending > 0; last payout exactly 90 days ago | Yellow |
| 4 | Pending > 0; last payout 91 days ago | Red |
| 5 | Pending > 0; no payout; published 89 days ago | Yellow |
| 6 | Pending > 0; no payout; published exactly 90 days ago | Yellow |
| 7 | Pending > 0; no payout; published 91 days ago | Red |
| 8 | In production; null dates; pending 0 | In Production (neutral) |
| 9 | Published; pending > 0; no payout; no publication date | Red / needs review |
| 10 | Pending negative | Data error; do not render a badge; flag for review |
| 11 | Published; pending 0; no payout date | Green |
| 12 | Author with all books in production; pending 0 | No royalties yet / fully paid equivalent |

Tests 2, 3, 5, 6 and 9 do not occur in the supplied data on 10 November 2026. Create a temporary test Book in Bubble (not in the submitted dataset) or use the script's `--as-of` flag with a controlled fixture to prove the boundaries, then delete the test record. Do not alter the supplied books to force a colour.

## 7. How to prove the date is not hardcoded

1. Open the author dashboard and record BK001's badge (Red).
2. In a test copy, create a Book with pending ₹100, last payout `Current date/time:plus days (-89)` → Yellow.
3. Change the last payout to `Current date/time:plus days (-91)` → Red, without editing any expression.
4. Change pending to 0 → Green.
5. Change status to `In Production - Cover Design` → neutral.

Alternatively, run:

```powershell
node scripts/convert-dataset.mjs --as-of=2025-11-20
```

and compare the generated snapshot with the default date. The script uses the same rules, so it is a useful cross-check, but the Bubble expression itself must still be tested in the browser.

## 8. Display guidance

- Show colour **and** a text label: `Green — Fully paid`, `Yellow — Pending`, `Red — Overdue`, `In Production`.
- Do not rely on colour alone; use an icon or label for accessibility.
- On the book row, show the reason inline or on hover: e.g. "Pending since 15 Oct 2025" or "No payout recorded".
- On the admin overview, show the author-level status and the number of overdue books.
- On the author portal, never show another author's status or totals.
- On the admin detail, keep the aggregate payout disclaimer visible near the last payout date.

## 9. Related policy language for the AI

The badge threshold and the payout policy are different:

- **Badge**: pending > 0 and last payout > 90 days → overdue.
- **Policy**: royalties are calculated quarterly and paid within 45 days of the quarter ending; the minimum payout threshold is ₹1,000, below which amounts roll over.

For a Red book, the AI must acknowledge the delay and escalate, not claim the 90-day rule is the policy. For a Yellow book, the AI may explain the quarterly + 45-day window. For a fully paid author, it should acknowledge the account is up to date.
