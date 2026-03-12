# Playwright Test Automation Framework

End-to-end, API, and unit test suite for two demo e-commerce applications:

| Site | URL | Coverage |
|---|---|---|
| SauceDemo | https://www.saucedemo.com | UI (login, inventory, cart, checkout), API, unit |
| DemoBlaze | https://www.demoblaze.com | UI (smoke, order flow) |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20.x (LTS) |
| npm | 10.x |
| Playwright browsers | installed via `npx playwright install` |

---

## Quick Start

```bash
# 1. Clone the repo and install dependencies
git clone <repo-url>
cd playwright
npm ci

# 2. Install browser binaries (Chromium, Firefox, WebKit)
npx playwright install --with-deps

# 3. Copy environment config and adjust if needed
cp .env.example .env

# 4. Run the full suite
npm test
```

---

## Environment Configuration

Copy `.env.example` to `.env` (git-ignored) and fill in values as needed.

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://www.saucedemo.com/` | SauceDemo base URL |
| `SAUCE_PASSWORD` | `secret_sauce` | Shared password for all SauceDemo users |
| `SECOND_SHOP_BASE_URL` | `https://www.demoblaze.com` | DemoBlaze base URL |
| `CI` | — | Set by CI pipeline. Enables `forbidOnly`, retries=2, workers=2 |
| `ENV` | `prod` | Target environment: `prod` \| `staging` \| `local` |

---

## Running Tests

```bash
# All tests (Chromium + Firefox + WebKit)
npm test

# UI tests only
npm run test:ui

# API tests only
npm run test:api

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Specific file or directory
npx playwright test tests/ui/saucedemo/login.spec.ts
npx playwright test tests/ui/saucedemo/

# By tag
npx playwright test --grep @smoke
npx playwright test --grep @checkout
npx playwright test --grep "@smoke and not @slow"

# With Allure report (local)
npm run allure:serve
```

---

## Project Structure

```
playwright/
├── src/
│   ├── api/              # API client layer (BaseApiClient, AssetsClient, StatusClient)
│   ├── config/           # TestConfig singleton, TestRunConfig suite definitions
│   ├── data/             # Static test data (products, routes, validation messages, user matrix)
│   ├── fixtures/         # Playwright test fixtures for SauceDemo
│   ├── pages/
│   │   ├── saucedemo/    # Page objects: LoginPage, InventoryPage, CartPage, Checkout*, etc.
│   │   └── second-shop/  # Page objects for DemoBlaze
│   ├── reporters/        # TextFileReporter — plain-text log of every test run
│   ├── second-shop/      # DemoBlaze config and fixtures
│   ├── types/            # Shared TypeScript types (SauceDemoContext, etc.)
│   └── utils/            # Helpers: assertions, cartHistory, navigation, scenarios, tags, etc.
├── tests/
│   ├── global-setup.ts   # Logs in once; saves session to playwright/.auth/
│   ├── ui/
│   │   ├── saucedemo/    # ~27 spec files covering all SauceDemo flows
│   │   └── second-shop/  # Smoke + order flow for DemoBlaze
│   ├── api/              # HTTP-level tests (assets, headers, manifest, routes)
│   └── unit/             # Unit tests for utilities (cartHistory, tagExpression, etc.)
├── scripts/
│   └── code-metrics.cjs  # Counts files / lines / symbols in src/ and tests/
├── playwright.config.ts
├── Jenkinsfile
└── .env.example
```

---

## Adding a New Test

1. Create a spec file in the appropriate `tests/` subdirectory.
2. Import `test` and `expect` from the matching fixture file:
   - SauceDemo UI: `../../../src/fixtures/test-fixtures`
   - API: `../../../src/api/fixtures/api-fixtures`
   - DemoBlaze: `../../../src/second-shop/fixtures/test-fixtures`
3. Use page objects from `src/pages/` — no raw `page.locator()` calls in tests.
4. Tag each test with at least one feature tag and one type tag, e.g.:
   ```typescript
   test('...', { tag: ['@cart', '@smoke'] }, async ({ cartPage }) => { ... });
   ```
5. Group tests inside `test.describe` blocks (feature → scenario).

### test.describe nesting convention

```
test.describe('Feature / Page') {          // Level 1
  test.describe('Scenario group') {        // Level 2
    test('specific behaviour', ...)        // Leaf
  }
}
```

---

## Tag Reference

| Tag | Meaning |
|---|---|
| `@smoke` | Minimal happy-path coverage |
| `@regression` | Full regression suite |
| `@e2e` | End-to-end flow spanning multiple pages |
| `@login` `@auth` | Authentication flows |
| `@inventory` | Product listing / sorting |
| `@cart` | Cart operations |
| `@checkout` | Checkout funnel |
| `@negative` `@validation` | Error / edge-case paths |
| `@responsive` `@desktop` `@tablet` `@mobile` | Layout / viewport tests |
| `@userType` | Behaviour matrix across user types |
| `@bulk` `@random` | Bulk / randomised scenarios |

---

## CI/CD

The pipeline runs inside the official **Playwright Docker image** (`mcr.microsoft.com/playwright:v1.56.0-noble`), which ships with Node.js 20 and all browser dependencies pre-installed.

```
Checkout → Install npm deps → Lint → Clean reports → Run tests
  → Upload Allure results to Allure Docker Service
  → Archive artifacts (playwright-report, allure-results, logs)
```

Allure report URL (local Docker network):
```
http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html
```

---

## Code Metrics

```bash
node scripts/code-metrics.cjs
```

Counts TypeScript files, lines, and characters in `src/` and `tests/`.
Contract target: **374,000 symbols** (Feb–Dec 2025).

---

## Reports

| Reporter | Location | When |
|---|---|---|
| HTML (Playwright) | `playwright-report/index.html` | Every local run |
| Allure | Allure Docker Service | CI only |
| Text log | `logs/test-run.log` | Every run |

Open HTML report: `npx playwright show-report`
