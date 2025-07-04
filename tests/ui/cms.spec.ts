import { test, expect } from '@playwright/test';
import path from 'path';
import { CmsPage } from '../../src/pageObjects/CmsPage';

/**
 * @test
 * Scenario: CMS Pages Test Suite
 * Page Objects: CmsPage
 * 
 * This test suite validates the functionality of static CMS pages including:
 * - Page creation and editing
 * - Media library management
 * - Menu structure configuration
 * - Content blocks management
 * 
 * Key aspects tested:
 * 1. Page CRUD operations
 * 2. Media upload and management
 * 3. Menu structure updates
 * 4. Content block handling
 * 
 * Test coverage:
 * - Page creation and publishing
 * - Media library operations
 * - Menu item management
 * - Content block integration
 */

test.describe('CMS Pages', () => {
    let cms: CmsPage;
    let consoleErrors: string[] = [];
    
    test.beforeEach(async ({ page }) => {
        cms = new CmsPage(page);
        consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
    });

    test('should create and publish a new page @cms', async ({ page }) => {
        await test.step('Create new page', async () => {
            await cms.createPage({
                title: 'Terms & Conditions',
                content: 'Test terms and conditions content',
                status: 'published'
            });

            // Verify page was created
            await expect(page.getByRole('heading', { 
                name: 'Terms & Conditions',
                level: 1 
            })).toBeVisible();
        });

        await test.step('Add content blocks', async () => {
            await cms.addContentBlock({
                type: 'text',
                content: 'Welcome to our terms and conditions',
                settings: {
                    alignment: 'center',
                    fontSize: 'large'
                }
            });

            await cms.addContentBlock({
                type: 'image',
                content: 'logo.png',
                settings: {
                    width: '300px',
                    alt: 'Company Logo'
                }
            });
        });

        await test.step('Check for console errors', async () => {
            expect(consoleErrors).toHaveLength(0);
        });
    });

    test('should manage media library @cms', async ({ page }) => {
        await test.step('Upload media file', async () => {
            await cms.uploadMedia('test-artifacts/logo.png');
            
            // Search for uploaded file
            await cms.searchMedia('logo.png');
            
            // Verify file appears in media grid
            await expect(page.locator('.media-grid')).toContainText('logo.png');
        });

        await test.step('Delete media file', async () => {
            await cms.searchMedia('logo.png');
            await cms.deleteMedia(0);
            
            // Verify file was deleted
            await cms.searchMedia('logo.png');
            await expect(page.locator('.media-grid')).not.toContainText('logo.png');
        });
    });

    test('should manage menu structure @cms', async ({ page }) => {
        await test.step('Add menu items', async () => {
            await cms.addMenuItem({
                title: 'About Us',
                url: '/about',
            });

            await cms.addMenuItem({
                title: 'Contact',
                url: '/contact',
                parent: 'About Us'
            });

            // Verify menu structure
            await expect(page.locator('.menu-builder')).toContainText('About Us');
            await expect(page.locator('.menu-builder')).toContainText('Contact');
        });
    });

    test('should handle content blocks @cms', async ({ page }) => {
        await test.step('Create page with multiple blocks', async () => {
            await cms.createPage({
                title: 'About Us',
                content: '',
                status: 'draft'
            });

            // Add header block
            await cms.addContentBlock({
                type: 'header',
                content: 'Welcome to Our Company',
                settings: {
                    level: 'h1',
                    alignment: 'center'
                }
            });

            // Add text block
            await cms.addContentBlock({
                type: 'text',
                content: 'We are a leading provider of...',
                settings: {
                    columns: 2
                }
            });

            // Add image block
            await cms.addContentBlock({
                type: 'image',
                content: 'team.jpg',
                settings: {
                    caption: 'Our Team'
                }
            });

            // Verify blocks are present
            await expect(page.locator('.block-library')).toContainText('Welcome to Our Company');
            await expect(page.locator('.block-library')).toContainText('We are a leading provider');
            await expect(page.locator('.block-library')).toContainText('Our Team');
        });
    });

    test('should preview pages before publishing @cms', async ({ page }) => {
        await test.step('Create draft page', async () => {
            await cms.createPage({
                title: 'Privacy Policy',
                content: 'Draft privacy policy content',
                status: 'draft'
            });
        });

        await test.step('Preview page', async () => {
            await cms.previewPage(0);
            
            // Verify preview content
            await expect(page.getByRole('heading', { 
                name: 'Privacy Policy',
                level: 1 
            })).toBeVisible();
            
            await expect(page.locator('body')).toContainText('Draft privacy policy content');
        });
    });
}); 