---
name: contract-progress
description: Show contract progress tracking with required vs actual symbols
---

# Contract Progress Tracker

When this skill is invoked, perform the following steps:

1. **Get current date** - Determine today's date
2. **Run code metrics** - Execute: `node scripts/code-metrics.cjs` to get actual symbol count
3. **Calculate required symbols** - Based on contract:
   - Contract period: February 15, 2025 - December 31, 2025
   - Total required: 374,000 symbols
   - Calculate daily progress based on current date
4. **Format and display results** with:
   - Current date
   - Required symbols by today
   - Actual symbols
   - Status (AHEAD ✅ or BEHIND ❌)
   - Completion percentage
   - Surplus/deficit amount

## Contract Details

- **Period**: February 15, 2025 - December 31, 2025 (11 months)
- **Monthly rate**: 34,000 symbols
- **Total required**: 374,000 symbols
- **Rate**: 2,000 symbols per 1,000 PLN
- **Monthly income**: 17,000 PLN

## Output Format

```
=== CONTRACT PROGRESS ===

Date: [current date]
Period: February 15, 2025 - December 31, 2025

📊 REQUIRED vs ACTUAL:

Required by today: [X] symbols
Actual now:        [Y] symbols
Status:            ✅ AHEAD or ❌ BEHIND

📈 PROGRESS:

Total required: 374,000 symbols
Completion:    [X]%
Surplus/Deficit: [+X] or [-X] symbols
```

## Implementation

Execute the bash command to get metrics:
```bash
node scripts/code-metrics.cjs
```

Then calculate:
- Days in contract period: (Dec 31, 2025 - Feb 15, 2025)
- Days passed: (today - Feb 15, 2025)
- Required = (days_passed / total_days) × 374,000
- Actual = characters count from code-metrics
- Difference = Actual - Required
