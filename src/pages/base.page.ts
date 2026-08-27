import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — abstract base class for all Page Object Models.
 *
 * Provides shared navigation, assertion, and interaction helpers
 * so that subclasses remain focused on page-specific logic only.
 *
 * Scalable: copy this base to any other Playwright project as-is.
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async navigate(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  // ─── Element Interaction ────────────────────────────────────────────────────

  protected locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  protected getByRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1]
  ): Locator {
    return this.page.getByRole(role, options);
  }

  protected getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  protected getByPlaceholder(placeholder: string): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  protected getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  protected getByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  // ─── Assertion Helpers ──────────────────────────────────────────────────────

  async assertUrlContains(segment: string): Promise<void> {
    await expect(this.page).toHaveURL(
      new RegExp(segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    );
  }

  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async assertText(locator: Locator, text: string | RegExp): Promise<void> {
    await expect(locator).toHaveText(text);
  }

  async assertEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
  }

  // ─── Utility ────────────────────────────────────────────────────────────────

  /**
   * Dismiss any tour/onboarding modal that may appear after login or profile switch.
   * Handles multiple tour styles: Done button, Skip button, or multi-step (Next/Skip).
   * Safe to call even if no modal is present.
   */
  async dismissTourIfPresent(): Promise<void> {
    const skipBtn = this.page.getByRole('button', { name: /^skip$/i });
    const doneBtn = this.page.getByRole('button', { name: /^done$/i });

    // Wait for a dialog to appear (up to 4s)
    await this.page.locator('dialog, [role="dialog"]').first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});

    // Dismiss tours by clicking Skip or Done
    for (let i = 0; i < 5; i++) {
      const skipVisible = await skipBtn.isVisible({ timeout: 500 }).catch(() => false);
      if (skipVisible) {
        await skipBtn.click();
        await this.page.waitForTimeout(300);
        continue;
      }
      const doneVisible = await doneBtn.isVisible({ timeout: 500 }).catch(() => false);
      if (doneVisible) {
        await doneBtn.click();
        await this.page.waitForTimeout(300);
        break;
      }
      break; // No more tour buttons found
    }
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }
}
