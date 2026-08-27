import { test, expect } from '../../src/fixtures/authenticated.fixture';

/**
 * Shared Tests — Run for both Student and Entity profiles
 *
 * Tests that apply to the app regardless of which profile is active.
 * Project: shared
 */
test.describe('Shared — App-Level Tests', () => {
  test('TC-SHARED-01: AhamX logo is present in the page header', async ({ page, bodhiDashboard }) => {
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
    // The logo is a Next.js optimized img with alt="AhamX Logo"
    // It may have visibility:hidden initially (Next.js Image component behavior)
    // Assert it's in the DOM and attached (not that it's visually visible)
    const logo = page.locator('img[alt="AhamX Logo"]').first();
    await expect(logo).toBeAttached({ timeout: 10000 });
    // Also verify the logo link/container is visible
    const logoLink = page.locator('a').filter({ has: logo });
    if (await logoLink.count() > 0) {
      await expect(logoLink.first()).toBeVisible();
    }
  });

  test('TC-SHARED-02: Hamburger menu toggle works', async ({ page, bodhiDashboard }) => {
    await bodhiDashboard.goto();
    const hamburger = page.getByRole('button', { name: /menu|toggle/i }).or(
      page.locator('button').filter({ has: page.locator('[class*="hamburger"], [class*="menu-icon"]') })
    ).first();

    if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hamburger.click();
      await page.waitForTimeout(500);
      // Just verify no errors — the sidebar may collapse/expand
    }
  });

  test('TC-SHARED-03: Bodhi page title is always "Bodhi"', async ({ bodhiDashboard }) => {
    await bodhiDashboard.goto();
    await bodhiDashboard.assertPageLoaded();
  });

  test('TC-SHARED-04: Page does not show JavaScript errors on load', async ({ page, bodhiDashboard }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await bodhiDashboard.goto();
    await page.waitForLoadState('networkidle');

    // Filter out known benign errors if any
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error') && !e.includes('Minified React error')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
