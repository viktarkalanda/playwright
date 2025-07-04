import { Page, Locator } from '@playwright/test';

/**
 * CmsPage represents the content management system interface.
 * Provides functionality for managing website content, pages, and media.
 * 
 * Key Features:
 * - Page creation and editing
 * - Media library management
 * - Menu structure configuration
 * - Content blocks management
 * 
 * @example
 * ```typescript
 * const cms = new CmsPage(page);
 * await cms.createPage({ title: 'About Us', content: '...' });
 * await cms.uploadImage('logo.png');
 * await cms.publishPage();
 * ```
 */
export class CmsPage {
    readonly page: Page;

    // Page Management
    readonly pageList: Locator;
    readonly createPageButton: Locator;
    readonly pageTitleInput: Locator;
    readonly pageContentEditor: Locator;
    readonly pageStatusSelect: Locator;
    readonly publishButton: Locator;
    readonly previewButton: Locator;

    // Media Library
    readonly mediaLibrary: Locator;
    readonly uploadButton: Locator;
    readonly mediaGrid: Locator;
    readonly mediaSearch: Locator;
    readonly deleteMediaButton: Locator;

    // Menu Management
    readonly menuBuilder: Locator;
    readonly addMenuItemButton: Locator;
    readonly menuItemTitleInput: Locator;
    readonly menuItemUrlInput: Locator;
    readonly saveMenuButton: Locator;

    // Content Blocks
    readonly blockLibrary: Locator;
    readonly addBlockButton: Locator;
    readonly blockSettings: Locator;
    readonly saveBlockButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Page Management
        this.pageList = page.locator('.page-list');
        this.createPageButton = page.locator('[data-testid="create-page"]');
        this.pageTitleInput = page.locator('#page-title');
        this.pageContentEditor = page.locator('#page-content');
        this.pageStatusSelect = page.locator('#page-status');
        this.publishButton = page.locator('[data-testid="publish-page"]');
        this.previewButton = page.locator('[data-testid="preview-page"]');

        // Media Library
        this.mediaLibrary = page.locator('.media-library');
        this.uploadButton = page.locator('[data-testid="upload-media"]');
        this.mediaGrid = page.locator('.media-grid');
        this.mediaSearch = page.locator('#media-search');
        this.deleteMediaButton = page.locator('[data-testid="delete-media"]');

        // Menu Management
        this.menuBuilder = page.locator('.menu-builder');
        this.addMenuItemButton = page.locator('[data-testid="add-menu-item"]');
        this.menuItemTitleInput = page.locator('#menu-item-title');
        this.menuItemUrlInput = page.locator('#menu-item-url');
        this.saveMenuButton = page.locator('[data-testid="save-menu"]');

        // Content Blocks
        this.blockLibrary = page.locator('.block-library');
        this.addBlockButton = page.locator('[data-testid="add-block"]');
        this.blockSettings = page.locator('.block-settings');
        this.saveBlockButton = page.locator('[data-testid="save-block"]');
    }

    /**
     * Creates a new page
     * @param page - Page details
     */
    async createPage(page: {
        title: string;
        content: string;
        status?: 'draft' | 'published';
    }) {
        await this.createPageButton.click();
        await this.pageTitleInput.fill(page.title);
        await this.pageContentEditor.fill(page.content);
        if (page.status) {
            await this.pageStatusSelect.selectOption(page.status);
        }
        await this.publishButton.click();
    }

    /**
     * Uploads a media file
     * @param filePath - Path to the file
     */
    async uploadMedia(filePath: string) {
        await this.uploadButton.click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.waitForResponse(response => 
            response.url().includes('/api/media/upload') && 
            response.status() === 200
        );
    }

    /**
     * Searches media library
     * @param query - Search query
     */
    async searchMedia(query: string) {
        await this.mediaSearch.fill(query);
        await this.mediaGrid.waitFor();
    }

    /**
     * Adds a menu item
     * @param item - Menu item details
     */
    async addMenuItem(item: {
        title: string;
        url: string;
        parent?: string;
    }) {
        await this.addMenuItemButton.click();
        await this.menuItemTitleInput.fill(item.title);
        await this.menuItemUrlInput.fill(item.url);
        if (item.parent) {
            await this.page.selectOption('#menu-item-parent', item.parent);
        }
        await this.saveMenuButton.click();
    }

    /**
     * Adds a content block
     * @param block - Block details
     */
    async addContentBlock(block: {
        type: string;
        content: string;
        settings?: Record<string, any>;
    }) {
        await this.addBlockButton.click();
        await this.page.click(`[data-block-type="${block.type}"]`);
        await this.page.fill('.block-content', block.content);
        
        if (block.settings) {
            for (const [key, value] of Object.entries(block.settings)) {
                await this.page.fill(`[data-setting="${key}"]`, String(value));
            }
        }
        
        await this.saveBlockButton.click();
    }

    /**
     * Previews a page
     * @param index - Page index in the list
     */
    async previewPage(index: number) {
        await this.pageList.nth(index).click();
        await this.previewButton.click();
    }

    /**
     * Deletes a media item
     * @param index - Media item index
     */
    async deleteMedia(index: number) {
        await this.mediaGrid.nth(index).click();
        await this.deleteMediaButton.click();
        await this.page.locator('[data-testid="confirm-delete"]').click();
    }
} 