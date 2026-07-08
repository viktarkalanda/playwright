# DemoBlaze Auth Coverage — Design Spec

**Date:** 2026-05-14
**Goal:** Add ~68,000 symbols of new code to cover DemoBlaze (second-shop) auth, contact form, and authenticated E2E flows.

---

## Context

SauceDemo is well-covered (20+ test files). DemoBlaze has only 5 test files covering basic smoke, order flow, navigation, product details, and order form. Major gaps:
- No auth (login/logout)
- No registration (signup)
- No contact form
- No authenticated E2E scenarios
- No navbar state verification

---

## Architecture

### New Page Objects (`src/pages/second-shop/`)

| File | Class | Responsibility |
|---|---|---|
| `NavBar.ts` | `NavBar` | Triggers opening modals (Login, Sign Up, Contact), shows/hides Logout, reads logged-in username |
| `LoginModal.ts` | `LoginModal` | Username/password fields, submit, close, reads error state |
| `SignUpModal.ts` | `SignUpModal` | Username/password fields, submit, close, reads success/error alerts |
| `ContactModal.ts` | `ContactModal` | Name/email/message fields, submit, close |

All classes follow the same pattern as the existing `OrderModal.ts`: plain class with `readonly` locators, `async` methods, no base class.

### Fixture Updates (`src/second-shop/fixtures/test-fixtures.ts`)

Four new fixtures added to `SecondShopFixtures`:

```
secondNavBar: NavBar
secondLoginModal: LoginModal
secondSignUpModal: SignUpModal
secondContactModal: ContactModal
```

### New Test Files (`tests/ui/second-shop/`)

| File | Tags | Scenarios |
|---|---|---|
| `login.spec.ts` | `@login @smoke @regression @negative` | Successful login, wrong password, non-existent user, empty username, empty password, empty both fields |
| `signup.spec.ts` | `@signup @regression @negative` | Successful registration, duplicate username, empty username, empty password, empty both fields |
| `auth-logout.spec.ts` | `@login @regression` | Logout hides logout button, shows login/signup again, username disappears, re-login after logout |
| `contact-form.spec.ts` | `@contact @regression @negative` | Modal opens, successful send, empty name, empty email, empty message, close without sending |
| `auth-e2e.spec.ts` | `@login @cart @e2e` | Full flow: signup → login → open homepage → add product → go to cart → checkout → confirm → logout |
| `navbar.spec.ts` | `@smoke @regression` | Before login: shows Login/Sign Up, no Logout; after login: shows Logout and username, no Login/Sign Up |

---

## Selectors Reference (DemoBlaze)

| Element | Selector |
|---|---|
| Login button (navbar) | `#login2` |
| Sign Up button (navbar) | `#signin2` |
| Logout link (navbar) | `#logout2` |
| Contact link (navbar) | `a` with text `"Contact"` in navbar |
| Logged-in username | `#nameofuser` |
| Login modal | `#logInModal` |
| Login username field | `#loginusername` |
| Login password field | `#loginpassword` |
| Signup modal | `#signInModal` |
| Signup username field | `#sign-username` |
| Signup password field | `#sign-password` |
| Contact modal | `#exampleModal` |
| Contact name field | `#recipient-name` |
| Contact email field | `#recipient-email` |
| Contact message field | `#message-text` |

---

## Data Flow

- Tests use `beforeEach` to open the homepage and wait for it to load.
- Auth tests that require a logged-in state create a unique username via a helper (e.g., `testuser_${Date.now()}`) to avoid conflicts with duplicate-user checks.
- The `auth-e2e.spec.ts` registers a fresh user per test run to keep E2E tests isolated.
- Negative tests rely on browser `dialog` events (DemoBlaze uses `alert()` for error messages).

---

## Error Handling

DemoBlaze shows errors as native browser `alert()` dialogs. Tests capture these via Playwright's `page.on('dialog', ...)` or `page.waitForEvent('dialog')`. Page objects expose a `waitForAlert()` method returning the alert message text.

---

## Estimated Size

| Category | Files | Est. Lines |
|---|---|---|
| Page objects (new) | 4 | ~480 |
| Fixture update | 1 | ~50 |
| Test files (new) | 6 | ~1,350 |
| **Total** | **11** | **~1,880** |

At ~36 chars/line average → **~67,700 symbols** (≈ 2 months of contract output).

---

## Tags Convention

Every test has at least one feature tag and one type tag, per project convention:
- Feature: `@login`, `@signup`, `@contact`, `@cart`, `@e2e`
- Type: `@smoke`, `@regression`, `@negative`, `@e2e`
