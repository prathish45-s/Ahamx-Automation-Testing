import { Page, expect } from '@playwright/test';

/**
 * Utility helpers — generic, reusable across any project.
 * No AhamX-specific logic here; keep this pure utility.
 */

/**
 * Dismiss any visible tour/onboarding modal by clicking its "Done" or "Skip" button.
 * Safe to call even if no modal is present.
 */
export async function dismissTourModal(page: Page): Promise<void> {
  const doneButton = page.getByRole('button', { name: /done|skip|got it/i });
  if (await doneButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await doneButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Scroll the page to bring an element into view before interacting with it.
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Assert that a URL contains the expected path segment.
 */
export async function assertUrlContains(page: Page, segment: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

/**
 * Type text character by character (useful for inputs that react to keypress events).
 */
export async function typeSlowly(
  page: Page,
  selector: string,
  text: string,
  delayMs = 50
): Promise<void> {
  const locator = page.locator(selector);
  await locator.click();
  await locator.pressSequentially(text, { delay: delayMs });
}

/**
 * Take a labelled screenshot into test-results.
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}
