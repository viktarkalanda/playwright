# Playwright Framework Audit Report

**Project:** `c:\Users\v.kalanda\Playwright`
**Audit Date:** 2026-03-12
**Auditor:** Claude Code (claude-sonnet-4-6)
**Scope:** Architecture, CI/CD, test organization, performance, best practices, maintainability

---

## 1. Executive Summary

The framework is **well above average** for a personal/contract automation project. The author demonstrates solid understanding of Playwright patterns: Page Object Model with a base class, fixture dependency injection, typed test data, custom reporters, tag-based test filtering, and separate API/UI/unit test layers. The codebase is clean, TypeScript strict mode is enforced, and CI/CD is wired to Jenkins + Allure Docker Service.

**Overall Rating: 7.5 / 10**

| Area | Score | Notes |
|---|---|---|
| Architecture & Modularity | 8/10 | Clear POM + fixture layers; minor structural inconsistencies |
| Test Organization | 8/10 | Strong SauceDemo coverage; DemoBlaze coverage minimal |
| Performance & Stability | 6/10 | No auth reuse; CI retries broken; workers hardcoded |
| CI/CD Infrastructure | 6/10 | Jenkins works but is fragile; no Docker image for runner |
| Best Practices Compliance | 8/10 | Step decorators, typed data, no sleep-hacks — solid |
| Maintainability | 7/10 | Good base; README empty; dual menu impls; orphan Java code |
| Test Data Management | 9/10 | Excellent: fixtures, builders, user matrix, scenarios DSL |

**Key risk:** The CI pipeline silently never retries failing tests despite being documented to do so. This is the most actionable bug to fix today.

---

## 2. Critical Issues (High Priority)

### H-1 — CI retries are documented but never applied

**File:** [playwright.config.ts](playwright.config.ts)
**Severity:** High — CI build reliability

**Root cause:** `.env.example` documents that `CI=true` enables `retries: 2`, but `playwright.config.ts` hardcodes `retries: 0` unconditionally. The CI env variable is read only to toggle `forbidOnly` — never for retries or workers.

```typescript
// Current (wrong):
retries: 0,
workers: 4,

// .env.example says CI should give retries=2, workers=2 — but this code never does that.
```

**Recommendation:**

```typescript
retries: process.env.CI ? 2 : 0,
workers: process.env.CI ? 2 : 4,
```

**Effort:** 15 minutes

---

### H-2 — Jenkins installs Node.js on every pipeline run via apt-get

**File:** [Jenkinsfile](Jenkinsfile)
**Severity:** High — pipeline speed and reproducibility

**Root cause:** The Jenkinsfile conditionally runs `apt-get install nodejs` inside the `agent any` container on every build. This is slow (~2-3 min), may fail on network issues, and produces non-reproducible builds (floating `nodejs` version from nodesource).

**Recommendation:** Replace `agent any` with a Node.js Docker image:

```groovy
agent {
  docker {
    image 'node:20-bookworm-slim'
    args '--user root'
  }
}
```

This eliminates the install step entirely and pins the Node.js version. Add Playwright browser cache between builds via Jenkins workspace or Docker volume.

**Effort:** 1-2 hours (Jenkinsfile rewrite + test run)

---

### H-3 — Single browser only (Chromium)

**File:** [playwright.config.ts](playwright.config.ts)
**Severity:** High — coverage gap

**Root cause:** Only `Desktop Chrome` is defined in `projects`. Firefox and WebKit (Safari) are not tested. Browser-specific CSS rendering and JS behavior bugs will go undetected.

**Recommendation:** Add Firefox and WebKit projects for at minimum the smoke suite:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
],
```

Run all three on CI, or configure smoke tests only for Firefox/WebKit to limit CI time.

**Effort:** 2-4 hours (config + verify tests pass on all browsers)

---

### H-4 — No shared authentication state (storageState)

**Files:** [src/fixtures/test-fixtures.ts](src/fixtures/test-fixtures.ts), [src/config/testConfig.ts](src/config/testConfig.ts)
**Severity:** High — performance

**Root cause:** Every test that needs a logged-in session re-authenticates through the UI via `loginPage.login()`. With 27 UI test files and `fullyParallel: true`, login is performed dozens of times per run, adding seconds to each test worker's setup.

**Recommendation:** Use Playwright's `storageState` global setup pattern:

1. Create `tests/global-setup.ts` that logs in and saves `playwright/.auth/user.json`
2. Reference it in `playwright.config.ts`:

```typescript
globalSetup: require.resolve('./tests/global-setup'),
use: { storageState: 'playwright/.auth/user.json' }
```

3. Keep the direct-login fixture for tests that specifically test the login flow (`login.spec.ts`, `auth-guards.spec.ts`).

This typically reduces total suite run time by 15–25% depending on how many tests use `loggedInInventoryPage`.

**Effort:** 3-4 hours

---

### H-5 — Orphan Java module in a TypeScript project

**Directory:** [java-email-validation/](java-email-validation/)
**Severity:** High — repository hygiene / confusion

**Root cause:** A Java Maven project (`com.email.validation`) lives in the repo root alongside the Playwright framework. It has no build integration, no CI references, and no cross-references in any TypeScript or test file.

**Recommendation:** Remove the directory entirely or move it to a separate repository. It adds cognitive overhead and confusion for anyone onboarding to the project.

**Effort:** 5 minutes (delete or move)

---

### H-6 — stepDecorator.ts silenced in ESLint

**File:** [eslint.config.cjs](eslint.config.cjs), [src/utils/stepDecorator.ts](src/utils/stepDecorator.ts)
**Severity:** Medium-High — technical debt accumulation

**Root cause:** `src/utils/stepDecorator.ts` is explicitly listed in ESLint's `ignores` array. This means linting violations in this file are suppressed rather than fixed. The file uses TypeScript experimental decorators which may conflict with strict ESLint rules.

**Recommendation:** Fix the linting issues in `stepDecorator.ts` (likely `@typescript-eslint/no-explicit-any` or decorator-related rules) and remove it from the ignore list. If the violations are unavoidable due to decorator constraints, add inline `// eslint-disable-next-line` comments with explanation instead of file-level suppression.

**Effort:** 1-2 hours

---

## 3. Important Improvements (Medium Priority)

### M-1 — README is essentially empty

**File:** [README.md](README.md)
**Current content:** `# playwright` followed by `Playwright project.`

A new contributor or CI engineer cannot onboard without documentation. Recommended sections:

- Prerequisites (Node.js version, browsers)
- Quick start (`npm ci && npx playwright install && npm test`)
- Environment setup (`.env.example` walkthrough)
- Project structure overview
- How to run specific suites / tags
- CI/CD architecture (Jenkins + Allure Docker)
- How to add a new test / page object

**Effort:** 2-3 hours

---

### M-2 — DemoBlaze (second-shop) coverage is minimal

**Directory:** [tests/ui/second-shop/](tests/ui/second-shop/)

27 test files for SauceDemo vs 2 for DemoBlaze. The second-shop lacks:
- Negative tests (invalid order data, empty cart checkout)
- Authentication flow tests
- Responsive layout tests
- Navigation and menu tests
- Product filtering/browsing tests

If DemoBlaze is a contract-required target, this gap reduces overall test value significantly.

**Effort:** 5-8 hours (parity would require ~10 additional files)

---

### M-3 — Dual menu page object implementations

**Files:** [src/pages/saucedemo/HeaderMenu.ts](src/pages/saucedemo/HeaderMenu.ts), [src/pages/saucedemo/MainMenu.ts](src/pages/saucedemo/MainMenu.ts)

Both files appear to represent the burger/sidebar menu. This causes confusion about which to use in tests. Verify whether they are truly separate components (header vs sidebar) or duplicates. If duplicates, consolidate into one and update all usages.

**Effort:** 1-2 hours

---

### M-4 — Fixture location inconsistency between SauceDemo and second-shop

| Site | Fixture Location |
|---|---|
| SauceDemo | `src/fixtures/test-fixtures.ts` |
| second-shop | `src/second-shop/fixtures/test-fixtures.ts` |
| API | `src/api/fixtures/api-fixtures.ts` |

The pattern is inconsistent. SauceDemo fixtures are top-level; second-shop and API fixtures are nested in their own module folders. Pick one convention:
- **Option A:** All fixtures in `src/fixtures/` (flat, indexed by site name)
- **Option B:** All fixtures co-located with their module (`src/[site]/fixtures/`)

Option B scales better. Move `src/fixtures/test-fixtures.ts` → `src/saucedemo/fixtures/test-fixtures.ts`.

**Effort:** 2-3 hours (move + update imports)

---

### M-5 — Workers count hardcoded to 4

**File:** [playwright.config.ts](playwright.config.ts)

```typescript
workers: 4,
```

On a 2-core CI machine, 4 workers causes CPU contention and flakiness. On an 8-core dev machine, 4 workers underutilizes available parallelism. Playwright's default `undefined` (auto = half the CPU cores) or explicit env-based logic is better:

```typescript
workers: process.env.CI ? 2 : undefined,
```

Combined with the H-1 fix this covers both scenarios cleanly.

**Effort:** 5 minutes (combined with H-1 fix)

---

### M-6 — No Dockerfile for the test runner

**Current state:** The Jenkinsfile installs everything from scratch in a bare container. There is no versioned image definition.

**Recommendation:** Create a `Dockerfile.test` or `docker-compose.yml` that defines:
- Node.js version
- Playwright + browsers (via `npx playwright install --with-deps`)
- Optional: Allure CLI

This makes local reproduction of CI failures trivial and eliminates H-2's dynamic install problem.

**Effort:** 2-3 hours

---

### M-7 — package.json has stale boilerplate

**File:** [package.json](package.json)

```json
"main": "index.js",
"description": "# playwright",
```

`index.js` does not exist. `description` contains a markdown heading. These are left from `npm init` and add confusion. Clean up:

```json
"description": "Playwright test automation for SauceDemo and DemoBlaze",
```

Remove the `main` field entirely (this is not a library).

**Effort:** 5 minutes

---

### M-8 — tests/src/ directory with unclear purpose

**Directory:** [tests/src/](tests/src/)

The existence of `tests/src/` is confusing alongside the top-level `src/`. Verify its content and either:
- Merge it into the main `src/` tree
- Rename it to something explicit (`tests/helpers/`, `tests/fixtures/`)
- Delete it if empty

**Effort:** 30 minutes (investigation + cleanup)

---

### M-9 — TestConfig singleton pattern limits testability

**File:** [src/config/testConfig.ts](src/config/testConfig.ts)

The `TestConfig.getInstance()` singleton reads `process.env` at module-load time. This makes it impossible to unit-test configuration variations without manipulating the Node.js environment between tests, which is fragile. Unit tests for config (e.g., `tests/unit/test-run-config.spec.ts`) must work around this.

**Recommendation:** For a testing framework, prefer a simple factory function or class instantiated with explicit parameters (with env fallbacks as defaults). Singletons are appropriate for production app code but create coupling issues in test infrastructure itself.

**Effort:** 2-3 hours (refactor + update callers)

---

## 4. Minor Refinements (Low Priority)

### L-1 — No multi-environment URL configuration

Currently, only one base URL per site is supported (from env or hardcoded). A common pattern is:

```bash
ENV=staging npm test
ENV=prod npm test
```

Implement via a simple lookup in `testConfig.ts`:

```typescript
const envUrls = { staging: '...', prod: '...', local: 'http://localhost:3000' };
baseUrl = envUrls[process.env.ENV ?? 'prod'];
```

**Effort:** 1 hour

---

### L-2 — Allure and HTML reporters running simultaneously

**File:** [playwright.config.ts](playwright.config.ts)

Four reporters run on every test run: `line`, `html`, `allure-playwright`, `TextFileReporter`. The HTML and Allure reporters produce redundant data. On CI, only Allure is used (uploaded to Allure Docker Service). The HTML report is never opened (`open: 'never'`).

**Recommendation:** Disable HTML reporter in CI:

```typescript
...(process.env.CI ? [] : [['html', { open: 'never' }]]),
```

**Effort:** 10 minutes

---

### L-3 — Log output path is not configurable

**File:** [playwright.config.ts](playwright.config.ts)

```typescript
['./src/reporters/TextFileReporter.ts', { outputFile: 'logs/test-run.log' }]
```

The output path is hardcoded in the config (not env-configurable). This is fine for a single project but worth noting for future flexibility.

**Effort:** 30 minutes if needed

---

### L-4 — Inconsistent test.describe nesting depth

Some test files use 2-3 levels of `test.describe` nesting; others have no nesting at all. Establish a convention:

- **Level 1:** Feature/page (`Cart Operations`)
- **Level 2:** Scenario group (`Adding items`, `Removing items`)
- Individual tests inside level 2

Document this in `CLAUDE.md` or a `CONTRIBUTING.md` guide.

**Effort:** 30 minutes (documentation only)

---

### L-5 — No `@playwright/test` version pinning strategy documented

**File:** [package.json](package.json)

```json
"@playwright/test": "^1.56.1"
```

The `^` prefix allows minor/patch updates without lockfile changes. Playwright releases browser bundles tied to the framework version — a patch bump can change browser behavior. For a test automation project, pin exactly:

```json
"@playwright/test": "1.56.1"
```

Or use Dependabot/Renovate to manage controlled updates.

**Effort:** 5 minutes

---

## 5. Action Plan

### Sprint 1 — Bugs & Quick Wins (1-2 days)

| # | Task | File(s) | Effort |
|---|---|---|---|
| 1 | Fix CI retries + workers (H-1 + M-5) | `playwright.config.ts` | 15 min |
| 2 | Remove orphan Java module (H-5) | `java-email-validation/` | 5 min |
| 3 | Fix package.json boilerplate (M-7) | `package.json` | 5 min |
| 4 | Investigate and clean tests/src/ (M-8) | `tests/src/` | 30 min |
| 5 | Pin `@playwright/test` version (L-5) | `package.json` | 5 min |
| 6 | Disable HTML reporter in CI (L-2) | `playwright.config.ts` | 10 min |

---

### Sprint 2 — Infrastructure (2-3 days)

| # | Task | File(s) | Effort |
|---|---|---|---|
| 7 | Migrate Jenkins to Node.js Docker image (H-2) | `Jenkinsfile` | 2 h |
| 8 | Add Firefox + WebKit projects for smoke (H-3) | `playwright.config.ts` | 3 h |
| 9 | Implement storageState for login reuse (H-4) | `tests/global-setup.ts`, `playwright.config.ts` | 4 h |
| 10 | Fix stepDecorator ESLint suppression (H-6) | `stepDecorator.ts`, `eslint.config.cjs` | 2 h |

---

### Sprint 3 — Architecture & DX (3-5 days)

| # | Task | File(s) | Effort |
|---|---|---|---|
| 11 | Write README with full onboarding guide (M-1) | `README.md` | 3 h |
| 12 | Consolidate fixture locations (M-4) | `src/fixtures/`, `src/second-shop/fixtures/` | 3 h |
| 13 | Clarify / consolidate dual menu implementations (M-3) | `HeaderMenu.ts`, `MainMenu.ts` | 2 h |
| 14 | Expand DemoBlaze test coverage (M-2) | `tests/ui/second-shop/` | 8 h |
| 15 | Refactor TestConfig from singleton (M-9) | `src/config/testConfig.ts` | 3 h |

---

### Sprint 4 — Polish (1-2 days)

| # | Task | Effort |
|---|---|---|
| 16 | Add multi-environment URL support (L-1) | 1 h |
| 17 | Create Dockerfile.test / docker-compose.yml (M-6) | 3 h |
| 18 | Document test.describe nesting convention (L-4) | 30 min |
| 19 | Make log output path configurable (L-3) | 30 min |

**Total estimated effort: ~40-45 hours** (across 4 sprints, parallelizable)

---

## 6. Benchmarks & Metrics

### Code Metrics (as of 2026-03-12)

| Directory | Files | Lines | Characters |
|---|---|---|---|
| `src/` | ~52 | ~4,500 | 130,500 |
| `tests/` | ~44 | ~8,200 | 248,238 |
| **Total** | **~96** | **~12,700** | **378,738** |

### Test Distribution

| Category | Files | Tests (approx.) |
|---|---|---|
| UI — SauceDemo | 27 | ~200 |
| UI — DemoBlaze | 2 | ~12 |
| API | 8 | ~25 |
| Unit | 4 | ~50 |
| **Total** | **41** | **~287** |

### Configuration Benchmarks

| Parameter | Current Value | Recommended |
|---|---|---|
| Test timeout | 20,000 ms | OK for live sites |
| Action timeout | 5,000 ms | OK |
| Navigation timeout | 10,000 ms | OK |
| Retries (local) | 0 | OK |
| Retries (CI) | 0 (broken) | 2 |
| Workers (local) | 4 | `undefined` (auto) |
| Workers (CI) | 4 (broken) | 2 |
| Browsers | 1 (Chromium) | 3 (+ Firefox, WebKit) |
| Auth strategy | Per-test UI login | storageState |
| Video | Off | OK |
| Trace | On first retry | OK |

### Positive Practices Observed

- TypeScript strict mode: **enabled**
- ESLint + Prettier: **configured and enforced**
- No `page.waitForTimeout()` / sleep hacks: **confirmed**
- Locators use Playwright best practices (`getByTestId`, `getByRole`): **confirmed**
- Test isolation (no shared state between tests): **confirmed**
- Custom step decorator for structured reports: **present**
- Tag-based test suite system: **implemented** (advanced)
- Data-driven patterns (user matrix, scenario DSL): **implemented** (advanced)
- API test layer separate from UI: **implemented**
- Unit tests for utilities: **implemented**
- CI/CD with artifact archiving: **implemented**
- Allure reporting with Docker service: **implemented**

---

## Appendix: File Reference Map

| Area | Key Files |
|---|---|
| Config | [playwright.config.ts](playwright.config.ts), [src/config/testConfig.ts](src/config/testConfig.ts), [src/config/testRunConfig.ts](src/config/testRunConfig.ts) |
| Fixtures | [src/fixtures/test-fixtures.ts](src/fixtures/test-fixtures.ts), [src/api/fixtures/api-fixtures.ts](src/api/fixtures/api-fixtures.ts), [src/second-shop/fixtures/test-fixtures.ts](src/second-shop/fixtures/test-fixtures.ts) |
| Page Objects | [src/pages/saucedemo/](src/pages/saucedemo/), [src/pages/second-shop/](src/pages/second-shop/) |
| Test Data | [src/data/](src/data/), [src/utils/testData.ts](src/utils/testData.ts) |
| Utilities | [src/utils/](src/utils/) |
| API Layer | [src/api/](src/api/) |
| CI/CD | [Jenkinsfile](Jenkinsfile), [.env.example](.env.example) |
| Quality | [eslint.config.cjs](eslint.config.cjs), [.prettierrc](.prettierrc), [tsconfig.json](tsconfig.json) |
| Reporting | [src/reporters/TextFileReporter.ts](src/reporters/TextFileReporter.ts) |
| Metrics | [scripts/code-metrics.cjs](scripts/code-metrics.cjs) |
