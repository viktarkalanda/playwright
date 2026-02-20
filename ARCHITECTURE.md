# Test Automation Architecture

## Directory Layout

- `src/pageObjects`: UI page object models.
- `src/fixtures`: shared fixtures for Playwright tests.
- `src/types`: shared TypeScript types.
- `src/utils`: reusable test utilities (preferred import path).
- `tests/ui`: end-to-end UI test suites.
- `tests/api`: API integration test suites.
- `tests/api/smoke`: lightweight API smoke coverage.
- `tests/visual`: visual regression specs and committed baselines only.
- `tests/smoke`: cross-suite smoke gate orchestration tests.
- `test-results`: generated runtime artifacts and reports.

## Naming Conventions

- Test files use `<feature>.<scope>.spec.ts`.
- API smoke tests use `<feature>.smoke.api.spec.ts`.
- Visual specs use `<feature>.visual.spec.ts`.

## Structural Rules

- New utility imports should use `src/utils/*`.
- Keep generated artifacts out of `tests/*` except committed visual baselines.
- Keep smoke orchestration in `tests/smoke`, not root `tests/`.
- Keep one feature per test file whenever possible.
