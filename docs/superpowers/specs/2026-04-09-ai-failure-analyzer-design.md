# AI-Powered Failure Analyzer — Design Spec

**Date:** 2026-04-09  
**Author:** QA Automation Team  
**Status:** Approved  
**Scope:** Playwright / TypeScript project (Phase 1)

---

## Goal

A Claude Code skill `/analyze-failures` that automatically parses Playwright test artifacts and Allure results upon failure, classifies each failure, and generates:
1. A detailed markdown report per run
2. A ready-to-paste Slack message for manual testers (where relevant)

---

## Architecture Overview

```
/analyze-failures
        │
        ▼
collect-failures.ts   (entry point)
    │
    ├── parse-allure.ts       reads allure-results/*.json → compressed data
    └── match-patterns.ts     reads categories/*.json → classification
        │
        ▼
failure-bundle.json            ← only file Claude reads
        │
        ▼
Claude (analyze-failures.md skill)
    │
    ├── failure-report-<timestamp>.md   (saved to reports/)
    └── Slack messages printed to terminal (copy-paste)
```

---

## File Structure

```
Playwright/
├── .claude/
│   └── failure-analyzer/
│       ├── analyze-failures.md       ← Claude Code skill
│       ├── collect-failures.ts       ← entry point script
│       ├── parse-allure.ts           ← Allure JSON parser
│       ├── match-patterns.ts         ← pattern matcher
│       └── categories/
│           ├── app-bug.json
│           ├── test-bug.json
│           ├── environment.json
│           └── flaky.json
└── reports/
    └── failure-report-<timestamp>.md
```

---

## Components

### `parse-allure.ts`

Reads raw Allure result JSON files from `allure-results/`. For each failed test extracts only:
- Test name and full title
- Last 5 steps before failure (name + status)
- Error message (first 300 characters)
- Environment info (baseURL, browser, environment name)
- Overall test status

**Why truncate:** Full Allure JSON per test can be 50KB+. After parsing: ~1KB. This is the primary token optimization.

---

### `match-patterns.ts`

Reads all `categories/*.json` files. For each test from `parse-allure.ts` output:
- Checks error message and step names against each pattern's `match[]` array (substring match, case-insensitive)
- If matched → `{ category, confidence: "HIGH", hint, actions }`
- If no match → `{ confidence: "LOW", needs_ai: true }`

Claude only performs deep analysis on `needs_ai: true` tests. HIGH confidence tests are written up directly from pre-classified data.

---

### `collect-failures.ts`

Entry point. Orchestrates the pipeline:
1. Reads `test-results/.last-run.json` → list of failed test IDs
2. Calls `parse-allure.ts` for each failed test
3. Calls `match-patterns.ts` for classification
4. Writes `failure-bundle.json` to project root (temp file, not committed)

Output shape:
```json
{
  "runDate": "2026-04-09T10:00:00Z",
  "environment": "staging",
  "baseUrl": "https://www.saucedemo.com",
  "browser": "chromium",
  "totalFailed": 5,
  "tests": [
    {
      "name": "Cannot proceed past checkout step two",
      "fullTitle": "Auth guards > Cannot proceed past checkout step two",
      "category": "APP_BUG",
      "confidence": "HIGH",
      "hint": "Добавить товар → checkout → проверить items на Overview",
      "actions": ["Воспроизвести вручную", "Приложить скриншот в баг-репорт"],
      "slack": true,
      "steps": [
        { "name": "Navigate to /checkout-step-one", "status": "passed" },
        { "name": "Fill customer info", "status": "passed" },
        { "name": "Click Continue", "status": "passed" },
        { "name": "Expect cart items visible", "status": "failed" }
      ],
      "error": "AssertionError: expected cart items to be visible, got empty cart. Item total: $0",
      "testData": { "user": "standard_user" }
    },
    {
      "name": "Some unknown failure",
      "confidence": "LOW",
      "needs_ai": true,
      "steps": [...],
      "error": "..."
    }
  ]
}
```

---

### `categories/*.json` — Pattern Files

One file per category. Each file contains patterns + action instructions for that category.

```json
{
  "category": "APP_BUG",
  "slack": true,
  "actions": [
    "Воспроизвести вручную по шагам из отчёта",
    "Проверить в нескольких браузерах если возможно",
    "Приложить скриншот и шаги в баг-репорт"
  ],
  "patterns": [
    {
      "id": "empty_cart_checkout",
      "description": "Корзина пустая на странице Overview",
      "match": ["Item total: $0", "cart is empty"],
      "hint": "Добавить товар → перейти на Checkout → проверить items на Overview"
    }
  ]
}
```

**Categories:**

| Category | `slack` | Description |
|---|---|---|
| `APP_BUG` | true | Application behaved unexpectedly |
| `TEST_BUG` | false | Selector broken, wrong assertion, test data issue |
| `ENVIRONMENT` | true | Timeout, 502/503, service unavailable |
| `FLAKY` | true (brief) | Race condition, timing issue |
| `UNKNOWN` | true | Claude could not classify with confidence |

Categories are extensible — add a new `.json` file to add a new category.

---

### `analyze-failures.md` — The Skill

Instructions for Claude:
1. Run `npx ts-node .claude/failure-analyzer/collect-failures.ts`
2. Read `failure-bundle.json`
3. For `confidence: HIGH` tests — write report and Slack directly from bundle data
4. For `needs_ai: true` tests — analyze steps + error deeply, classify, write report
5. If a new pattern is identified — suggest adding it to the relevant category file
6. Detect common root cause if 3+ tests share the same category + similar error
7. Write `reports/failure-report-<timestamp>.md`
8. Print Slack messages to terminal for all tests where `slack: true`

---

## Output Formats

### Markdown Report (`reports/failure-report-YYYY-MM-DD-HH-MM.md`)

```markdown
# Failure Report — 2026-04-09 10:00

## Summary
- Total failed: 5
- APP_BUG: 3 | TEST_BUG: 1 | UNKNOWN: 1

## 🔁 Common Issue Detected
3 tests failed with the same root cause: APP_BUG / empty cart state
Affected: [test1, test2, test3]

---

## [APP_BUG] Cannot proceed past checkout step two
**Confidence:** HIGH  
**Steps before failure:**
1. ✅ Navigate to /checkout-step-one
2. ✅ Fill customer info
3. ✅ Click Continue
4. ❌ Expect cart items visible

**Root cause:** Cart state is lost between checkout steps. Item total shows $0.  
**Action:** Reproduce manually: add item → checkout → verify items on Overview page.
```

---

### Slack Message (printed to terminal)

```
🔴 *[APP_BUG]* Cannot proceed past checkout step two

*Окружение:* staging | https://www.saucedemo.com
*Браузер:* Chromium
*Тестовые данные:* user: `standard_user`

*Шаги воспроизведения:*
1. Залогиниться как standard_user
2. Добавить товар в корзину
3. Checkout → заполнить форму → Continue
4. ❌ На странице Overview корзина пустая

*Ожидаемо:* товары отображаются | *Фактически:* Item total: $0
```

Slack messages are generated for: `APP_BUG`, `ENVIRONMENT`, `FLAKY`, `UNKNOWN`.  
Slack messages are **not** generated for: `TEST_BUG`.

---

## Token Optimization Strategy

| Technique | Saving |
|---|---|
| `parse-allure.ts` truncates Allure JSON to ~1KB per test | ~98% reduction per test |
| Only last 5 steps passed to Claude | Removes noise |
| Error message capped at 300 chars | Removes stack trace bloat |
| HIGH confidence tests need no deep AI analysis | Claude writes report only |
| Claude never reads category JSON files | Script handles all matching |

---

## Common Root Cause Detection

If 3 or more tests share:
- Same `category`
- Same or very similar `error` message (fuzzy match in script)

The bundle marks them with `commonIssueGroup: "group_1"`. Claude surfaces this as a top-level section in the report before per-test details.

---

## Future Scope (not in this SPIKE)

- Add REST Assured / Java API project support
- Auto-post to Slack via webhook (currently copy-paste only)
- Jenkins pipeline integration as post-build step
- Historical trend: compare with previous run's `failure-bundle.json`
