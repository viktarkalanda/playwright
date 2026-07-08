# Claude Code Configuration

## Custom Skills

### contract-progress
- **Description:** Show contract progress tracking with required vs actual symbols
- **Usage:** Use the `/contract-progress` skill to view progress
- **Notes:** Skill is self-contained in `.claude-code/skills/contract-progress.md`, no external scripts needed

## Project Setup

- Playwright test automation project
- Tests: saucedemo.com + demoblaze.com
- Code metrics tracked in `scripts/code-metrics.cjs`

## Coding Conventions

### test.describe nesting

Use at most 2 levels of `test.describe`:

```
test.describe('Feature / Page') {       // Level 1 — required
  test.describe('Scenario group') {     // Level 2 — when grouping makes sense
    test('specific behaviour', ...)     // Leaf test
  }
}
```

### Fixture locations

| Site | Fixtures path |
|---|---|
| SauceDemo | `src/saucedemo/fixtures/test-fixtures.ts` |
| DemoBlaze | `src/second-shop/fixtures/test-fixtures.ts` |
| API | `src/api/fixtures/api-fixtures.ts` |

### Menu page object

Use only `HeaderMenu` — `MainMenu` has been removed. Relevant methods:
- `openMenu()` / `closeMenu()` / `isMenuOpen()`
- `clickAllItems()` / `clickAbout()` / `clickLogout()` / `clickResetAppState()`
- `getCartBadgeCount()`

### Tags

Every test must have at least one feature tag (`@cart`, `@login`, etc.) and one type tag (`@smoke`, `@regression`, `@e2e`, `@negative`).

### Language

All code, comments, and variable names must be in **English**.
