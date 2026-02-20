// src/pages/saucedemo/HeaderMenu.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';

export class HeaderMenu extends BaseForm {
  readonly menuButton: Locator;
  readonly closeButton: Locator;
  readonly menuPanel: Locator;
  readonly allItemsLink: Locator;
  readonly aboutLink: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page, page.locator('#header_container'), 'Header and burger menu');

    this.menuButton = this.page.locator('#react-burger-menu-btn');
    this.closeButton = this.page.locator('#react-burger-cross-btn');
    this.menuPanel = this.page.locator('.bm-menu-wrap');
    this.allItemsLink = this.page.locator('#inventory_sidebar_link');
    this.aboutLink = this.page.locator('#about_sidebar_link');
    this.logoutLink = this.page.locator('#logout_sidebar_link');
    this.resetAppStateLink = this.page.locator('#reset_sidebar_link');
    this.cartBadge = this.page.locator('.shopping_cart_badge');
  }

  async openMenu(): Promise<void> {
    if (await this.isMenuOpen()) {
      return;
    }
    await this.menuButton.click();
    await this.menuPanel.waitFor({ state: 'visible' });
  }

  async isMenuOpen(): Promise<boolean> {
    return this.menuPanel.isVisible();
  }

  async closeMenu(): Promise<void> {
    if (!(await this.isMenuOpen())) {
      return;
    }
    await this.closeButton.click();
    await this.menuPanel.waitFor({ state: 'hidden' });
  }

  async clickAllItems(): Promise<void> {
    await this.openMenu();
    await this.allItemsLink.click();
  }

  async clickAbout(): Promise<void> {
    await this.openMenu();
    await this.aboutLink.click();
  }

  async clickLogout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }

  async clickResetAppState(): Promise<void> {
    await this.openMenu();
    await this.resetAppStateLink.click();
  }

  async getCartBadgeCount(): Promise<number> {
    if (!(await this.cartBadge.isVisible())) {
      return 0;
    }
    const text = await this.cartBadge.textContent();
    const parsed = Number(text ?? '0');
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
