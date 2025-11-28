// src/pages/MainMenu.ts
import { Page, Locator } from '@playwright/test';
import { step } from '../utils/stepDecorator';

export class MainMenu {
  readonly menuButton: Locator;
  readonly closeButton: Locator;
  readonly menuPanel: Locator;
  readonly allItemsLink: Locator;
  readonly aboutLink: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  constructor(private readonly page: Page) {
    this.menuButton = this.page.locator('#react-burger-menu-btn');
    this.closeButton = this.page.locator('#react-burger-cross-btn');
    this.menuPanel = this.page.locator('.bm-menu');
    this.allItemsLink = this.page.locator('[data-test="inventory-sidebar-link"]');
    this.aboutLink = this.page.locator('[data-test="about-sidebar-link"]');
    this.logoutLink = this.page.locator('[data-test="logout-sidebar-link"]');
    this.resetAppStateLink = this.page.locator('[data-test="reset-sidebar-link"]');
  }

  @step('Open main menu')
  async open(): Promise<void> {
    await this.menuButton.click();
    await this.menuPanel.waitFor({ state: 'visible' });
  }

  @step('Close main menu')
  async close(): Promise<void> {
    await this.closeButton.click();
    await this.menuPanel.waitFor({ state: 'hidden' });
  }

  @step('Check if main menu is visible')
  async isVisible(): Promise<boolean> {
    return this.menuPanel.isVisible();
  }

  @step('Navigate to all items from menu')
  async goToAllItems(): Promise<void> {
    await this.open();
    await this.allItemsLink.click();
  }

  @step('Navigate to About from menu')
  async goToAbout(): Promise<void> {
    await this.open();
    await this.aboutLink.click();
  }

  @step('Logout from menu')
  async logout(): Promise<void> {
    await this.open();
    await this.logoutLink.click();
  }

  @step('Reset app state from menu')
  async resetAppState(): Promise<void> {
    await this.open();
    await this.resetAppStateLink.click();
  }
}
