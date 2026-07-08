# DemoBlaze Auth Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full auth/contact coverage for DemoBlaze — 4 page objects, updated fixtures, 6 test files — totalling ~68,000 symbols.

**Architecture:** Each new modal gets its own class mirroring the existing `OrderModal.ts` pattern. Fixtures extend the existing `SecondShopFixtures` type. Test files import from fixtures and use inline helper functions for register/login flows.

**Tech Stack:** Playwright, TypeScript, DemoBlaze live site (https://www.demoblaze.com). Tests require internet access.

---

## File Map

**Create:**
- `src/pages/second-shop/NavBar.ts`
- `src/pages/second-shop/LoginModal.ts`
- `src/pages/second-shop/SignUpModal.ts`
- `src/pages/second-shop/ContactModal.ts`
- `tests/ui/second-shop/navbar.spec.ts`
- `tests/ui/second-shop/login.spec.ts`
- `tests/ui/second-shop/signup.spec.ts`
- `tests/ui/second-shop/auth-logout.spec.ts`
- `tests/ui/second-shop/contact-form.spec.ts`
- `tests/ui/second-shop/auth-e2e.spec.ts`

**Modify:**
- `src/second-shop/fixtures/test-fixtures.ts`

---

## Task 1: NavBar Page Object

**Files:**
- Create: `src/pages/second-shop/NavBar.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/pages/second-shop/NavBar.ts
import { Locator, Page } from '@playwright/test';

export class NavBar {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly signUpButton: Locator;
  readonly logoutLink: Locator;
  readonly contactLink: Locator;
  readonly loggedInUsername: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.locator('#login2');
    this.signUpButton = page.locator('#signin2');
    this.logoutLink = page.locator('#logout2');
    this.contactLink = page.locator('a', { hasText: 'Contact' }).first();
    this.loggedInUsername = page.locator('#nameofuser');
  }

  async openLoginModal(): Promise<void> {
    await this.loginButton.click();
  }

  async openSignUpModal(): Promise<void> {
    await this.signUpButton.click();
  }

  async openContactModal(): Promise<void> {
    await this.contactLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  async isLoggedIn(): Promise<boolean> {
    return this.logoutLink.isVisible();
  }

  async getLoggedInUsername(): Promise<string> {
    const text = await this.loggedInUsername.textContent();
    return (text ?? '').replace('Welcome', '').trim();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```
git add src/pages/second-shop/NavBar.ts
git commit -m "feat: add NavBar page object for DemoBlaze"
```

---

## Task 2: LoginModal Page Object

**Files:**
- Create: `src/pages/second-shop/LoginModal.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/pages/second-shop/LoginModal.ts
import { Locator, Page } from '@playwright/test';

export class LoginModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#logInModal');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.loginButton = this.modal.locator('button', { hasText: 'Log in' });
    this.closeButton = this.modal.locator('button', { hasText: 'Close' });
  }

  async waitForOpen(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
  }

  async fill(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async loginExpectingSuccess(): Promise<void> {
    await this.loginButton.click();
    await this.page.locator('#logout2').waitFor({ state: 'visible' });
  }

  async loginExpectingAlert(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.loginButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.dismiss();
    return message;
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async isOpen(): Promise<boolean> {
    return this.modal.isVisible();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```
git add src/pages/second-shop/LoginModal.ts
git commit -m "feat: add LoginModal page object for DemoBlaze"
```

---

## Task 3: SignUpModal Page Object

**Files:**
- Create: `src/pages/second-shop/SignUpModal.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/pages/second-shop/SignUpModal.ts
import { Locator, Page } from '@playwright/test';

export class SignUpModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signUpButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#signInModal');
    this.usernameInput = page.locator('#sign-username');
    this.passwordInput = page.locator('#sign-password');
    this.signUpButton = this.modal.locator('button', { hasText: 'Sign up' });
    this.closeButton = this.modal.locator('button', { hasText: 'Close' });
  }

  async waitForOpen(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
  }

  async fill(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async signUpAndWaitForAlert(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.signUpButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.dismiss();
    return message;
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async isOpen(): Promise<boolean> {
    return this.modal.isVisible();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```
git add src/pages/second-shop/SignUpModal.ts
git commit -m "feat: add SignUpModal page object for DemoBlaze"
```

---

## Task 4: ContactModal Page Object

**Files:**
- Create: `src/pages/second-shop/ContactModal.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/pages/second-shop/ContactModal.ts
import { Locator, Page } from '@playwright/test';

export class ContactModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#exampleModal');
    this.nameInput = page.locator('#recipient-name');
    this.emailInput = page.locator('#recipient-email');
    this.messageInput = page.locator('#message-text');
    this.sendButton = this.modal.locator('button', { hasText: 'Send message' });
    this.closeButton = this.modal.locator('button', { hasText: 'Close' });
  }

  async waitForOpen(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
  }

  async fill(options: { name?: string; email?: string; message?: string }): Promise<void> {
    if (options.name !== undefined) await this.nameInput.fill(options.name);
    if (options.email !== undefined) await this.emailInput.fill(options.email);
    if (options.message !== undefined) await this.messageInput.fill(options.message);
  }

  async sendAndWaitForAlert(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.sendButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async isOpen(): Promise<boolean> {
    return this.modal.isVisible();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```
git add src/pages/second-shop/ContactModal.ts
git commit -m "feat: add ContactModal page object for DemoBlaze"
```

---

## Task 5: Update Fixtures

**Files:**
- Modify: `src/second-shop/fixtures/test-fixtures.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
// src/second-shop/fixtures/test-fixtures.ts
import { test as base, expect } from '@playwright/test';
import { HomePage } from '../../pages/second-shop/HomePage';
import { ProductPage } from '../../pages/second-shop/ProductPage';
import { CartPage } from '../../pages/second-shop/CartPage';
import { OrderModal } from '../../pages/second-shop/OrderModal';
import { NavBar } from '../../pages/second-shop/NavBar';
import { LoginModal } from '../../pages/second-shop/LoginModal';
import { SignUpModal } from '../../pages/second-shop/SignUpModal';
import { ContactModal } from '../../pages/second-shop/ContactModal';

type Pages = {
  secondHomePage: HomePage;
  secondProductPage: ProductPage;
  secondCartPage: CartPage;
  secondOrderModal: OrderModal;
  secondNavBar: NavBar;
  secondLoginModal: LoginModal;
  secondSignUpModal: SignUpModal;
  secondContactModal: ContactModal;
};

export type SecondShopFixtures = Pages;

export const test = base.extend<SecondShopFixtures>({
  secondHomePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  secondProductPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  secondCartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  secondOrderModal: async ({ page }, use) => {
    await use(new OrderModal(page));
  },
  secondNavBar: async ({ page }, use) => {
    await use(new NavBar(page));
  },
  secondLoginModal: async ({ page }, use) => {
    await use(new LoginModal(page));
  },
  secondSignUpModal: async ({ page }, use) => {
    await use(new SignUpModal(page));
  },
  secondContactModal: async ({ page }, use) => {
    await use(new ContactModal(page));
  },
});

export { expect };
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```
git add src/second-shop/fixtures/test-fixtures.ts
git commit -m "feat: add NavBar, LoginModal, SignUpModal, ContactModal to second-shop fixtures"
```

---

## Task 6: navbar.spec.ts

**Files:**
- Create: `tests/ui/second-shop/navbar.spec.ts`

- [ ] **Step 1: Create the file**

```typescript
// tests/ui/second-shop/navbar.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type AuthFixtures = Pick<SecondShopFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>;

async function registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal }: AuthFixtures): Promise<string> {
  const username = `navtest_${Date.now()}`;
  const password = 'navpass123';
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openSignUpModal();
  await secondSignUpModal.waitForOpen();
  await secondSignUpModal.fill(username, password);
  await secondSignUpModal.signUpAndWaitForAlert();
  await secondNavBar.openLoginModal();
  await secondLoginModal.waitForOpen();
  await secondLoginModal.fill(username, password);
  await secondLoginModal.loginExpectingSuccess();
  return username;
}

test.describe('NavBar', () => {
  test.describe('Before login', () => {
    test('shows Login and Sign up buttons', { tag: ['@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar,
    }) => {
      await secondHomePage.open();
      await secondHomePage.waitForLoaded();

      await expect(secondNavBar.loginButton).toBeVisible();
      await expect(secondNavBar.signUpButton).toBeVisible();
    });

    test('does not show Logout link', { tag: ['@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar,
    }) => {
      await secondHomePage.open();
      await secondHomePage.waitForLoaded();

      await expect(secondNavBar.logoutLink).toBeHidden();
    });

    test('does not show logged-in username', { tag: ['@regression'] }, async ({
      secondHomePage, secondNavBar,
    }) => {
      await secondHomePage.open();
      await secondHomePage.waitForLoaded();

      const text = await secondNavBar.loggedInUsername.textContent().catch(() => '');
      expect((text ?? '').replace('Welcome', '').trim()).toBe('');
    });
  });

  test.describe('After login', () => {
    test('shows Logout link after successful login', { tag: ['@smoke', '@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

      await expect(secondNavBar.logoutLink).toBeVisible();
    });

    test('shows username in navbar after login', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const username = await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

      const displayed = await secondNavBar.getLoggedInUsername();
      expect(displayed).toContain(username);
    });

    test('hides Login button after login', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

      await expect(secondNavBar.loginButton).toBeHidden();
    });

    test('hides Sign up button after login', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

      await expect(secondNavBar.signUpButton).toBeHidden();
    });
  });

  test.describe('After logout', () => {
    test('shows Login button again after logout', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
      await secondNavBar.logout();

      await expect(secondNavBar.loginButton).toBeVisible();
    });

    test('shows Sign up button again after logout', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
      await secondNavBar.logout();

      await expect(secondNavBar.signUpButton).toBeVisible();
    });

    test('hides Logout link after logout', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
      await secondNavBar.logout();

      await expect(secondNavBar.logoutLink).toBeHidden();
    });
  });
}
```

- [ ] **Step 2: Run the tests**

```
npx playwright test tests/ui/second-shop/navbar.spec.ts --reporter=line
```
Expected: all 8 tests pass. If a test fails due to a selector mismatch, inspect the live site and update the relevant selector in `NavBar.ts`.

- [ ] **Step 3: Commit**

```
git add tests/ui/second-shop/navbar.spec.ts
git commit -m "test: add navbar state tests for DemoBlaze"
```

---

## Task 7: login.spec.ts

**Files:**
- Create: `tests/ui/second-shop/login.spec.ts`

- [ ] **Step 1: Create the file**

```typescript
// tests/ui/second-shop/login.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type SetupFixtures = Pick<SecondShopFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>;

async function openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal }: Omit<SetupFixtures, 'secondSignUpModal'>): Promise<void> {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openLoginModal();
  await secondLoginModal.waitForOpen();
}

async function registerUser({ secondHomePage, secondNavBar, secondSignUpModal }: Omit<SetupFixtures, 'secondLoginModal'>): Promise<{ username: string; password: string }> {
  const username = `logintest_${Date.now()}`;
  const password = 'loginpass123';
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openSignUpModal();
  await secondSignUpModal.waitForOpen();
  await secondSignUpModal.fill(username, password);
  await secondSignUpModal.signUpAndWaitForAlert();
  return { username, password };
}

test.describe('Login modal', () => {
  test.describe('Positive cases', () => {
    test('successful login hides login button and shows logout', { tag: ['@login', '@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const { username, password } = await registerUser({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, password);
      await secondLoginModal.loginExpectingSuccess();

      await expect(secondNavBar.logoutLink).toBeVisible();
      await expect(secondNavBar.loginButton).toBeHidden();
    });

    test('successful login shows username in navbar', { tag: ['@login', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const { username, password } = await registerUser({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, password);
      await secondLoginModal.loginExpectingSuccess();

      const displayed = await secondNavBar.getLoggedInUsername();
      expect(displayed).toContain(username);
    });

    test('login modal is not visible after successful login', { tag: ['@login', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const { username, password } = await registerUser({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, password);
      await secondLoginModal.loginExpectingSuccess();

      expect(await secondLoginModal.isOpen()).toBe(false);
    });
  });

  test.describe('Negative cases', () => {
    test('wrong password shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const { username } = await registerUser({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, 'wrongpassword');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('non-existent user shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill(`nouser_${Date.now()}`, 'anypass');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('empty username shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill('', 'somepass');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('empty password shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill('someuser', '');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('both fields empty shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill('', '');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('login modal can be closed without submitting', { tag: ['@login', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill('user', 'pass');
      await secondLoginModal.close();

      expect(await secondLoginModal.isOpen()).toBe(false);
      await expect(secondNavBar.loginButton).toBeVisible();
    });
  });
}
```

- [ ] **Step 2: Run the tests**

```
npx playwright test tests/ui/second-shop/login.spec.ts --reporter=line
```
Expected: all 9 tests pass.

- [ ] **Step 3: Commit**

```
git add tests/ui/second-shop/login.spec.ts
git commit -m "test: add login modal tests for DemoBlaze"
```

---

## Task 8: signup.spec.ts

**Files:**
- Create: `tests/ui/second-shop/signup.spec.ts`

- [ ] **Step 1: Create the file**

```typescript
// tests/ui/second-shop/signup.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type SetupFixtures = Pick<SecondShopFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>;

async function openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal }: Omit<SetupFixtures, 'secondLoginModal'>): Promise<void> {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openSignUpModal();
  await secondSignUpModal.waitForOpen();
}

test.describe('Sign up modal', () => {
  test.describe('Positive cases', () => {
    test('successful registration shows success alert', { tag: ['@signup', '@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill(`newuser_${Date.now()}`, 'pass123');
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message.toLowerCase()).toContain('sign up successful');
    });

    test('registered user can log in after signup', { tag: ['@signup', '@login', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const username = `regtest_${Date.now()}`;
      const password = 'regpass123';

      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill(username, password);
      await secondSignUpModal.signUpAndWaitForAlert();

      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, password);
      await secondLoginModal.loginExpectingSuccess();

      await expect(secondNavBar.logoutLink).toBeVisible();
    });

    test('sign up modal opens and is visible', { tag: ['@signup', '@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });

      expect(await secondSignUpModal.isOpen()).toBe(true);
    });

    test('sign up modal can be closed without registering', { tag: ['@signup', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill('someuser', 'somepass');
      await secondSignUpModal.close();

      expect(await secondSignUpModal.isOpen()).toBe(false);
    });
  });

  test.describe('Negative cases', () => {
    test('duplicate username shows error alert', { tag: ['@signup', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      const username = `dupuser_${Date.now()}`;
      const password = 'duppass123';

      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill(username, password);
      await secondSignUpModal.signUpAndWaitForAlert();

      await secondNavBar.openSignUpModal();
      await secondSignUpModal.waitForOpen();
      await secondSignUpModal.fill(username, password);
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message.toLowerCase()).toContain('exist');
    });

    test('empty username shows error alert', { tag: ['@signup', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill('', 'somepass');
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message).toBeTruthy();
    });

    test('empty password shows error alert', { tag: ['@signup', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill('someuser', '');
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message).toBeTruthy();
    });

    test('both fields empty shows error alert', { tag: ['@signup', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill('', '');
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message).toBeTruthy();
    });
  });
}
```

- [ ] **Step 2: Run the tests**

```
npx playwright test tests/ui/second-shop/signup.spec.ts --reporter=line
```
Expected: all 8 tests pass.

- [ ] **Step 3: Commit**

```
git add tests/ui/second-shop/signup.spec.ts
git commit -m "test: add sign up modal tests for DemoBlaze"
```

---

## Task 9: auth-logout.spec.ts

**Files:**
- Create: `tests/ui/second-shop/auth-logout.spec.ts`

- [ ] **Step 1: Create the file**

```typescript
// tests/ui/second-shop/auth-logout.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type AuthFixtures = Pick<SecondShopFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>;

async function registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal }: AuthFixtures): Promise<{ username: string; password: string }> {
  const username = `logouttest_${Date.now()}`;
  const password = 'logoutpass123';
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openSignUpModal();
  await secondSignUpModal.waitForOpen();
  await secondSignUpModal.fill(username, password);
  await secondSignUpModal.signUpAndWaitForAlert();
  await secondNavBar.openLoginModal();
  await secondLoginModal.waitForOpen();
  await secondLoginModal.fill(username, password);
  await secondLoginModal.loginExpectingSuccess();
  return { username, password };
}

test.describe('Logout', () => {
  test('logout link is visible when logged in', { tag: ['@login', '@smoke', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

    await expect(secondNavBar.logoutLink).toBeVisible();
  });

  test('logout hides the logout link', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    await secondNavBar.logout();

    await expect(secondNavBar.logoutLink).toBeHidden();
  });

  test('logout restores Login button', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    await secondNavBar.logout();

    await expect(secondNavBar.loginButton).toBeVisible();
  });

  test('logout restores Sign up button', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    await secondNavBar.logout();

    await expect(secondNavBar.signUpButton).toBeVisible();
  });

  test('username disappears from navbar after logout', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    const { username } = await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    const beforeLogout = await secondNavBar.getLoggedInUsername();
    expect(beforeLogout).toContain(username);

    await secondNavBar.logout();

    const afterLogout = await secondNavBar.loggedInUsername.textContent().catch(() => '');
    expect((afterLogout ?? '').replace('Welcome', '').trim()).toBe('');
  });

  test('can log in again after logout', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    const { username, password } = await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    await secondNavBar.logout();

    await expect(secondNavBar.logoutLink).toBeHidden();

    await secondNavBar.openLoginModal();
    await secondLoginModal.waitForOpen();
    await secondLoginModal.fill(username, password);
    await secondLoginModal.loginExpectingSuccess();

    await expect(secondNavBar.logoutLink).toBeVisible();
  });

  test('isLoggedIn returns false before login', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar,
  }) => {
    await secondHomePage.open();
    await secondHomePage.waitForLoaded();

    expect(await secondNavBar.isLoggedIn()).toBe(false);
  });

  test('isLoggedIn returns true after login', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

    expect(await secondNavBar.isLoggedIn()).toBe(true);
  });
}
```

- [ ] **Step 2: Run the tests**

```
npx playwright test tests/ui/second-shop/auth-logout.spec.ts --reporter=line
```
Expected: all 8 tests pass.

- [ ] **Step 3: Commit**

```
git add tests/ui/second-shop/auth-logout.spec.ts
git commit -m "test: add logout flow tests for DemoBlaze"
```

---

## Task 10: contact-form.spec.ts

**Files:**
- Create: `tests/ui/second-shop/contact-form.spec.ts`

- [ ] **Step 1: Create the file**

```typescript
// tests/ui/second-shop/contact-form.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';

test.describe('Contact form', () => {
  test.beforeEach(async ({ secondHomePage }) => {
    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
  });

  test('Contact link opens the modal', { tag: ['@contact', '@smoke', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();

    expect(await secondContactModal.isOpen()).toBe(true);
  });

  test('modal can be closed without sending', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.close();

    expect(await secondContactModal.isOpen()).toBe(false);
  });

  test('all three fields accept input', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: 'John', email: 'john@test.com', message: 'Hello world' });

    await expect(secondContactModal.nameInput).toHaveValue('John');
    await expect(secondContactModal.emailInput).toHaveValue('john@test.com');
    await expect(secondContactModal.messageInput).toHaveValue('Hello world');
  });

  test('sending filled form shows confirmation alert', { tag: ['@contact', '@smoke', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: 'Test User', email: 'test@example.com', message: 'Test message' });
    const alert = await secondContactModal.sendAndWaitForAlert();

    expect(alert).toBeTruthy();
  });

  test('modal closes after sending', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: 'User', email: 'u@t.com', message: 'msg' });
    await secondContactModal.sendAndWaitForAlert();

    expect(await secondContactModal.isOpen()).toBe(false);
  });

  test('sending with name only triggers a response', { tag: ['@contact', '@negative', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: 'OnlyName', email: '', message: '' });
    const alert = await secondContactModal.sendAndWaitForAlert();

    expect(alert).toBeTruthy();
  });

  test('sending with no fields triggers a response', { tag: ['@contact', '@negative', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    const alert = await secondContactModal.sendAndWaitForAlert();

    expect(alert).toBeTruthy();
  });

  test('name input accepts long text', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    const longName = 'A'.repeat(100);
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ name: longName });

    const value = await secondContactModal.nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('message field accepts multi-line text', { tag: ['@contact', '@regression'] }, async ({
    secondNavBar, secondContactModal,
  }) => {
    const multiLine = 'Line one\nLine two\nLine three';
    await secondNavBar.openContactModal();
    await secondContactModal.waitForOpen();
    await secondContactModal.fill({ message: multiLine });

    const value = await secondContactModal.messageInput.inputValue();
    expect(value).toContain('Line one');
  });
}
```

- [ ] **Step 2: Run the tests**

```
npx playwright test tests/ui/second-shop/contact-form.spec.ts --reporter=line
```
Expected: all 8 tests pass.

- [ ] **Step 3: Commit**

```
git add tests/ui/second-shop/contact-form.spec.ts
git commit -m "test: add contact form tests for DemoBlaze"
```

---

## Task 11: auth-e2e.spec.ts

**Files:**
- Create: `tests/ui/second-shop/auth-e2e.spec.ts`

- [ ] **Step 1: Create the file**

```typescript
// tests/ui/second-shop/auth-e2e.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type AllFixtures = Pick<
  SecondShopFixtures,
  | 'secondHomePage'
  | 'secondNavBar'
  | 'secondSignUpModal'
  | 'secondLoginModal'
  | 'secondProductPage'
  | 'secondCartPage'
  | 'secondOrderModal'
>;

async function registerAndLogin(
  fixtures: Pick<AllFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>,
): Promise<{ username: string; password: string }> {
  const { secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal } = fixtures;
  const username = `e2euser_${Date.now()}`;
  const password = 'e2epass123';
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openSignUpModal();
  await secondSignUpModal.waitForOpen();
  await secondSignUpModal.fill(username, password);
  await secondSignUpModal.signUpAndWaitForAlert();
  await secondNavBar.openLoginModal();
  await secondLoginModal.waitForOpen();
  await secondLoginModal.fill(username, password);
  await secondLoginModal.loginExpectingSuccess();
  return { username, password };
}

test.describe('Authenticated E2E flows', () => {
  test('full flow: register, login, add product to cart, place order, logout', {
    tag: ['@login', '@cart', '@e2e'],
  }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    secondProductPage, secondCartPage, secondOrderModal,
  }) => {
    const { username } = await registerAndLogin({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    });

    expect(await secondNavBar.isLoggedIn()).toBe(true);
    const loggedName = await secondNavBar.getLoggedInUsername();
    expect(loggedName).toContain(username);

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    const products = await secondHomePage.getVisibleProductNames();
    expect(products.length).toBeGreaterThan(0);

    await secondHomePage.openProductByName(products[0]);
    await secondProductPage.waitForVisible();
    const productName = await secondProductPage.getProductName();
    await secondProductPage.addToCart();

    await secondProductPage.goToCart();
    await secondCartPage.waitForVisible();
    const cartItems = await secondCartPage.getCartItemNames();
    expect(cartItems.some((item) => item.includes(productName) || productName.includes(item))).toBe(true);

    await secondCartPage.openPlaceOrderDialogIfPossible();
    await secondOrderModal.waitForOpen();
    await secondOrderModal.fillForm({
      name: 'E2E User',
      country: 'Poland',
      city: 'Warsaw',
      card: '4111111111111111',
      month: '12',
      year: '2030',
    });
    await secondOrderModal.submitPurchase();
    await secondOrderModal.waitForConfirmation();

    expect(await secondOrderModal.confirmationDialog.first().isVisible()).toBe(true);
    await secondOrderModal.confirmSuccess();

    await secondNavBar.logout();
    expect(await secondNavBar.isLoggedIn()).toBe(false);
  });

  test('logged-in user can browse multiple categories and return to cart', {
    tag: ['@login', '@cart', '@e2e'],
  }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    secondProductPage, secondCartPage,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    await secondHomePage.selectCategoryByName('Phones');
    const phones = await secondHomePage.getVisibleProductNames();
    expect(phones.length).toBeGreaterThan(0);

    await secondHomePage.openProductByName(phones[0]);
    await secondProductPage.waitForVisible();
    await secondProductPage.addToCart();

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    await secondHomePage.selectCategoryByName('Laptops');
    const laptops = await secondHomePage.getVisibleProductNames();
    expect(laptops.length).toBeGreaterThan(0);

    await secondHomePage.openProductByName(laptops[0]);
    await secondProductPage.waitForVisible();
    await secondProductPage.addToCart();

    await secondProductPage.goToCart();
    await secondCartPage.waitForVisible();
    const cartItems = await secondCartPage.getCartItemNames();
    expect(cartItems.length).toBeGreaterThanOrEqual(2);
  });

  test('logged-in user can remove item from cart', {
    tag: ['@login', '@cart', '@regression'],
  }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    secondProductPage, secondCartPage,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

    await secondCartPage.open();
    await secondCartPage.waitForVisible();
    await secondCartPage.clearCartIfPossible();

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    const products = await secondHomePage.getVisibleProductNames();

    await secondHomePage.openProductByName(products[0]);
    await secondProductPage.waitForVisible();
    const firstProduct = await secondProductPage.getProductName();
    await secondProductPage.addToCart();

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    await secondHomePage.openProductByName(products[1]);
    await secondProductPage.waitForVisible();
    await secondProductPage.addToCart();

    await secondProductPage.goToCart();
    await secondCartPage.waitForVisible();
    await secondCartPage.removeItemByName(firstProduct);

    const remaining = await secondCartPage.getCartItemNames();
    expect(remaining.some((item) => item.includes(firstProduct) || firstProduct.includes(item))).toBe(false);
  });

  test('navbar still shows logged-in state after navigating between pages', {
    tag: ['@login', '@smoke', '@e2e'],
  }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    secondProductPage,
  }) => {
    const { username } = await registerAndLogin({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    });

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    expect(await secondNavBar.isLoggedIn()).toBe(true);

    const products = await secondHomePage.getVisibleProductNames();
    await secondHomePage.openProductByName(products[0]);
    await secondProductPage.waitForVisible();

    expect(await secondNavBar.isLoggedIn()).toBe(true);
    const name = await secondNavBar.getLoggedInUsername();
    expect(name).toContain(username);
  });
}
```

- [ ] **Step 2: Run the tests**

```
npx playwright test tests/ui/second-shop/auth-e2e.spec.ts --reporter=line
```
Expected: all 4 tests pass.

- [ ] **Step 3: Commit**

```
git add tests/ui/second-shop/auth-e2e.spec.ts
git commit -m "test: add authenticated E2E flow tests for DemoBlaze"
```

---

## Final Verification

- [ ] **Run all new second-shop tests together**

```
npx playwright test tests/ui/second-shop/ --reporter=line
```
Expected: all tests in the suite pass (new + existing).

- [ ] **Run code metrics to confirm symbol count**

```
node scripts/code-metrics.cjs
```
Expected: total characters ~510,000+ (was 442,433 before this work).
