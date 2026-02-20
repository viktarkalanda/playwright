import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';

export class Footer extends BaseForm {
  readonly footerCopy: Locator;
  readonly twitterLink: Locator;
  readonly facebookLink: Locator;
  readonly linkedinLink: Locator;
  readonly socialLinks: Locator;

  constructor(page: Page) {
    super(page, page.locator('.footer'), 'Application footer');
    this.footerCopy = this.page.locator('.footer_copy');
    this.twitterLink = this.page.getByTestId('social-twitter');
    this.facebookLink = this.page.getByTestId('social-facebook');
    this.linkedinLink = this.page.getByTestId('social-linkedin');
    this.socialLinks = this.page.locator('.footer .social a');
  }

  async getFooterText(): Promise<string> {
    await this.waitForVisible();
    const text = await this.footerCopy.textContent();
    return text?.trim() ?? '';
  }

  async getSocialLinksCount(): Promise<number> {
    return this.socialLinks.count();
  }

  async getTwitterHref(): Promise<string> {
    return (await this.twitterLink.getAttribute('href')) ?? '';
  }

  async getFacebookHref(): Promise<string> {
    return (await this.facebookLink.getAttribute('href')) ?? '';
  }

  async getLinkedinHref(): Promise<string> {
    return (await this.linkedinLink.getAttribute('href')) ?? '';
  }
}
