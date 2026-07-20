---
name: contract-progress
description: Show contract progress tracking with required vs actual symbols
---

# Contract Progress Tracker

The contract runs indefinitely on a month-by-month basis (fixed Feb 15 - Dec 31, 2025
term ended; no new end date was set). Progress is tracked per calendar month, not
cumulatively from a fixed start date.

When this skill is invoked, perform the following steps:

1. **Get current date** - Determine today's date (defines the current calendar month).
2. **Run code metrics now** - Execute: `node scripts/code-metrics.cjs` to get the current
   total symbol count.
3. **Get the start-of-month baseline** - Find the last commit before the 1st of the
   current month:
   `git log --before="<YYYY-MM-01> 00:00:00" -1 --pretty=format:"%H %ad" --date=short`
   Check it out into a temporary worktree and run the metrics script there:
   ```
   git worktree add --detach <tmp-dir> <commit-hash>
   node <tmp-dir>/scripts/code-metrics.cjs
   git worktree remove <tmp-dir> --force
   ```
4. **Find the last code-writing date** - `git log -1 --pretty=format:"%ad" --date=short --
   "src/*.ts" "src/*.tsx" "tests/*.ts" "tests/*.tsx"` (and similarly for nested paths) to
   report how many days ago code was last added.
5. **Check prior months for gaps** - `git log --since=<month-start> --until=<month-end>
   --oneline -- "src/**/*.ts" "tests/**/*.ts"` for each month since the last known-good
   check, to flag any calendar month with zero code commits (missed target).
6. **Calculate this month's progress**:
   - Added this month = current total - start-of-month baseline total
   - Required this month = 34,000 symbols
   - Remaining = max(0, 34,000 - added this month)
   - Days left in month = last day of month - today

## Contract Details

- **Mode**: indefinite, month-to-month (no fixed end date)
- **Monthly rate**: 34,000 symbols per calendar month
- **Rate**: 2,000 symbols per 1,000 PLN
- **Monthly income**: 17,000 PLN

## Output Format

```
=== CONTRACT PROGRESS (monthly) ===

Date: [current date]
Mode: indefinite, month-to-month (34,000 symbols/month)

📝 LAST CODE WRITTEN: [date] ([N] days ago)

📊 THIS MONTH ([Month YYYY]):

Start-of-month baseline: [X] symbols
Actual now:              [Y] symbols
Added this month:        [Y-X] symbols
Required this month:     34,000 symbols
Status:                  ✅ AHEAD / ❌ BEHIND (need [Z] more)
Days left in month:      [N]

⚠️ MISSED MONTHS (0 commits to src/tests): [list, if any]
```

## Notes

- Deleted this skill's prior fixed-period logic (Feb 15 - Dec 31, 2025, 374,000 total)
  since the contract has no new fixed end date as of 2026-07-20; if the contract is later
  given a fixed renewal term, update this file with the new dates/total instead of using
  the monthly-only model above.
