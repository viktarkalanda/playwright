import { Page } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { expect } from '@playwright/test';

/**
 * Configuration interface for visual comparison options
 */
interface VisualComparisonOptions {
  maxDiffPixels?: number;
  threshold?: number;
  baselineDir?: string;
  diffDir?: string;
  screenshotDir?: string;
}

/**
 * Helper class for visual regression testing
 * Provides functionality for comparing screenshots with baseline images
 */
export class VisualHelper {
  private readonly baselineDir: string;
  private readonly diffDir: string;
  private readonly screenshotDir: string;
  private readonly maxDiffPixels: number;
  private readonly threshold: number;

  constructor(options: VisualComparisonOptions = {}) {
    const {
      maxDiffPixels = 100,
      threshold = 0.1,
      baselineDir = 'tests/visual/baseline',
      diffDir = 'test-results/visual/diff',
      screenshotDir = 'test-results/visual/screenshots'
    } = options;

    this.maxDiffPixels = maxDiffPixels;
    this.threshold = threshold;
    this.baselineDir = baselineDir;
    this.diffDir = diffDir;
    this.screenshotDir = screenshotDir;
  }

  /**
   * Initialize directories for visual testing
   */
  private async initDirectories(): Promise<void> {
    const dirs = [this.baselineDir, this.diffDir, this.screenshotDir];
    
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Generate a unique filename for the screenshot
   * @param name - Base name for the screenshot
   * @param viewport - Viewport dimensions
   * @param theme - Theme name if applicable
   * @returns string The generated filename
   */
  private generateFilename(name: string, viewport?: string, theme?: string): string {
    const parts = [name];
    if (viewport) parts.push(viewport);
    if (theme) parts.push(theme);
    return `${parts.join('-')}.png`;
  }

  /**
   * Compare a screenshot with its baseline
   * @param page - Playwright page object
   * @param name - Name of the screenshot
   * @param options - Additional comparison options
   */
  async compareScreenshot(
    page: Page,
    name: string,
    options: {
      viewport?: { width: number; height: number };
      theme?: 'light' | 'dark';
      fullPage?: boolean;
      timeout?: number;
    } = {}
  ): Promise<void> {
    await this.initDirectories();

    const {
      viewport,
      theme,
      fullPage = true,
      timeout = 30000
    } = options;

    // Set viewport if specified
    if (viewport) {
      await page.setViewportSize(viewport);
    }

    // Generate filenames
    const viewportStr = viewport ? `${viewport.width}x${viewport.height}` : undefined;
    const filename = this.generateFilename(name, viewportStr, theme);
    const baselinePath = path.join(this.baselineDir, filename);
    const screenshotPath = path.join(this.screenshotDir, filename);
    const diffPath = path.join(this.diffDir, filename);

    // Take screenshot
    await page.screenshot({
      path: screenshotPath,
      fullPage,
      timeout
    });

    try {
      // Check if baseline exists
      await fs.access(baselinePath);
      
      // Compare with baseline
      await expect(await page.screenshot({ fullPage }))
        .toMatchSnapshot(baselinePath, {
          maxDiffPixels: this.maxDiffPixels,
          threshold: this.threshold
        });

      // If comparison passes, clean up diff
      try {
        await fs.unlink(diffPath);
      } catch {
        // Ignore if diff doesn't exist
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        // Baseline doesn't exist, create it
        await fs.copyFile(screenshotPath, baselinePath);
        console.log(`Created baseline: ${baselinePath}`);
      } else {
        // Save diff image
        const screenshot = await page.screenshot({ fullPage });
        await fs.writeFile(diffPath, screenshot);
        throw error;
      }
    }
  }

  /**
   * Update baseline image for a specific test
   * @param name - Name of the screenshot
   * @param viewport - Viewport dimensions
   * @param theme - Theme name if applicable
   */
  async updateBaseline(
    name: string,
    viewport?: { width: number; height: number },
    theme?: 'light' | 'dark'
  ): Promise<void> {
    const viewportStr = viewport ? `${viewport.width}x${viewport.height}` : undefined;
    const filename = this.generateFilename(name, viewportStr, theme);
    const baselinePath = path.join(this.baselineDir, filename);
    const screenshotPath = path.join(this.screenshotDir, filename);

    try {
      await fs.copyFile(screenshotPath, baselinePath);
      console.log(`Updated baseline: ${baselinePath}`);
    } catch (error) {
      throw new Error(`Failed to update baseline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up temporary screenshots and diff images
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.screenshotDir, { recursive: true, force: true });
      await fs.rm(this.diffDir, { recursive: true, force: true });
      await this.initDirectories();
    } catch (error) {
      console.error('Failed to cleanup visual test artifacts:', error);
    }
  }
} 
