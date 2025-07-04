import { Page, Locator } from '@playwright/test';

/**
 * AccountPage represents the user account management interface.
 * Provides functionality for managing user profile, orders, and preferences.
 * 
 * Key Features:
 * - Profile information management
 * - Order history viewing
 * - Address book management
 * - Security settings
 * 
 * @example
 * ```typescript
 * const account = new AccountPage(page);
 * await account.updateProfile({ firstName: 'John', lastName: 'Doe' });
 * await account.addAddress({ street: '123 Main St', city: 'Boston' });
 * await account.viewOrderHistory();
 * ```
 */
export class AccountPage {
    readonly page: Page;

    // Profile Management
    readonly profileSection: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly emailInput: Locator;
    readonly phoneInput: Locator;
    readonly saveProfileButton: Locator;

    // Order History
    readonly orderHistorySection: Locator;
    readonly orderList: Locator;
    readonly orderDetails: Locator;
    readonly orderFilter: Locator;

    // Address Book
    readonly addressSection: Locator;
    readonly addAddressButton: Locator;
    readonly addressList: Locator;
    readonly streetInput: Locator;
    readonly cityInput: Locator;
    readonly stateInput: Locator;
    readonly zipInput: Locator;
    readonly saveAddressButton: Locator;

    // Security Settings
    readonly securitySection: Locator;
    readonly currentPasswordInput: Locator;
    readonly newPasswordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly changePasswordButton: Locator;
    readonly twoFactorToggle: Locator;

    constructor(page: Page) {
        this.page = page;

        // Profile Management
        this.profileSection = page.locator('.profile-section');
        this.firstNameInput = page.locator('#first-name');
        this.lastNameInput = page.locator('#last-name');
        this.emailInput = page.locator('#email');
        this.phoneInput = page.locator('#phone');
        this.saveProfileButton = page.locator('[data-testid="save-profile"]');

        // Order History
        this.orderHistorySection = page.locator('.order-history');
        this.orderList = page.locator('.order-list');
        this.orderDetails = page.locator('.order-details');
        this.orderFilter = page.locator('#order-filter');

        // Address Book
        this.addressSection = page.locator('.address-book');
        this.addAddressButton = page.locator('[data-testid="add-address"]');
        this.addressList = page.locator('.address-list');
        this.streetInput = page.locator('#street');
        this.cityInput = page.locator('#city');
        this.stateInput = page.locator('#state');
        this.zipInput = page.locator('#zip');
        this.saveAddressButton = page.locator('[data-testid="save-address"]');

        // Security Settings
        this.securitySection = page.locator('.security-settings');
        this.currentPasswordInput = page.locator('#current-password');
        this.newPasswordInput = page.locator('#new-password');
        this.confirmPasswordInput = page.locator('#confirm-password');
        this.changePasswordButton = page.locator('[data-testid="change-password"]');
        this.twoFactorToggle = page.locator('[data-testid="2fa-toggle"]');
    }

    /**
     * Updates user profile information
     * @param profile - Profile details
     */
    async updateProfile(profile: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
    }) {
        await this.profileSection.click();
        if (profile.firstName) {
            await this.firstNameInput.fill(profile.firstName);
        }
        if (profile.lastName) {
            await this.lastNameInput.fill(profile.lastName);
        }
        if (profile.email) {
            await this.emailInput.fill(profile.email);
        }
        if (profile.phone) {
            await this.phoneInput.fill(profile.phone);
        }
        await this.saveProfileButton.click();
    }

    /**
     * Views order history with optional filtering
     * @param filter - Filter criteria
     */
    async viewOrderHistory(filter?: {
        status?: string;
        dateRange?: string;
    }) {
        await this.orderHistorySection.click();
        if (filter) {
            await this.orderFilter.selectOption(filter.status || filter.dateRange || '');
        }
        await this.orderList.waitFor();
    }

    /**
     * Views details of a specific order
     * @param index - Order index in the list
     */
    async viewOrderDetails(index: number) {
        await this.orderList.nth(index).click();
        await this.orderDetails.waitFor();
    }

    /**
     * Adds a new address to the address book
     * @param address - Address details
     */
    async addAddress(address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    }) {
        await this.addressSection.click();
        await this.addAddressButton.click();
        await this.streetInput.fill(address.street);
        await this.cityInput.fill(address.city);
        await this.stateInput.fill(address.state);
        await this.zipInput.fill(address.zip);
        await this.saveAddressButton.click();
    }

    /**
     * Deletes an address from the address book
     * @param index - Address index in the list
     */
    async deleteAddress(index: number) {
        await this.addressSection.click();
        await this.addressList.nth(index).locator('[data-testid="delete-address"]').click();
        await this.page.locator('[data-testid="confirm-delete"]').click();
    }

    /**
     * Changes account password
     * @param passwords - Password details
     */
    async changePassword(passwords: {
        current: string;
        new: string;
        confirm: string;
    }) {
        await this.securitySection.click();
        await this.currentPasswordInput.fill(passwords.current);
        await this.newPasswordInput.fill(passwords.new);
        await this.confirmPasswordInput.fill(passwords.confirm);
        await this.changePasswordButton.click();
    }

    /**
     * Toggles two-factor authentication
     * @param enable - Whether to enable or disable 2FA
     */
    async toggleTwoFactor(enable: boolean) {
        await this.securitySection.click();
        const currentState = await this.twoFactorToggle.isChecked();
        if (currentState !== enable) {
            await this.twoFactorToggle.click();
            if (enable) {
                await this.page.locator('[data-testid="setup-2fa"]').click();
            }
        }
    }
} 