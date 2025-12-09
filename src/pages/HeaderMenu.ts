// src/pages/HeaderMenu.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../utils/stepDecorator';

export class HeaderMenu extends BaseForm {
  readonly menuButton: Locator = this.page.locator('#react-burger-menu-btn');
  readonly closeButton: Locator = this.page.locator('#react-burger-cross-btn');
  readonly menuPanel: Locator = this.page.locator('.bm-menu');
  readonly allItemsLink: Locator = this.page.locator('[data-test="inventory-sidebar-link"]');
  readonly aboutLink: Locator = this.page.locator('[data-test="about-sidebar-link"]');
  readonly logoutLink: Locator = this.page.locator('[data-test="logout-sidebar-link"]');
  readonly resetAppStateLink: Locator = this.page.locator('[data-test="reset-sidebar-link"]');
  readonly cartIcon: Locator = this.page.locator('[data-test="shopping-cart-link"]');
  readonly cartBadge: Locator = this.page.locator('[data-test="shopping-cart-badge"]');

  constructor(page: Page) {
    super(page, page.locator('header'), 'Header menu');
  }

  @step('Open header menu')
  async openMenu(): Promise<void> {
    if (await this.menuPanel.isVisible()) {
      return;
    }
    await this.menuButton.click();
    await this.menuPanel.waitFor({ state: 'visible' });
  }

  @step('Close header menu')
  async closeMenu(): Promise<void> {
    if (!(await this.menuPanel.isVisible())) {
      return;
    }
    await this.closeButton.click();
    await this.menuPanel.waitFor({ state: 'hidden' });
  }

  @step('Click All Items in header menu')
  async clickAllItems(): Promise<void> {
    await this.openMenu();
    await this.allItemsLink.click();
  }

  @step('Click About in header menu')
  async clickAbout(): Promise<Page> {
    await this.openMenu();
    const [aboutPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.aboutLink.click(),
    ]);
    await aboutPage.waitForLoadState('domcontentloaded');
    return aboutPage;
  }

  @step('Click Logout in header menu')
  async clickLogout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }

  @step('Click Reset App State in header menu')
  async clickResetAppState(): Promise<void> {
    await this.openMenu();
    await this.resetAppStateLink.click();
  }

  @step('Get cart badge count from header')
  async getCartBadgeCount(): Promise<number> {
    const count = await this.cartBadge.count();
    if (count === 0) {
      return 0;
    }
    const text = await this.cartBadge.textContent();
    const numeric = Number.parseInt((text ?? '').trim(), 10);
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  @step('Check if header menu is open')
  async isMenuOpen(): Promise<boolean> {
    return this.menuPanel.isVisible();
  }
}
