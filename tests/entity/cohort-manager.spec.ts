import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

import { NavigationManager } from '../../src/utils/navigation-manager';

/**
 * Entity Profile (IIT Madras) — Cohort Manager Tests
 *
 * Tests the Cohort Manager features. We explicitly avoid creating cohorts
 * as requested (to avoid undeletable data).
 * Focuses on: Navigation, Rendering, Searching/Filtering, and Detail views.
 *
 * Project: entity
 */
test.describe('Entity Profile — Cohort Manager', () => {
  test.beforeEach(async ({ sharedPage }) => {
    await NavigationManager.recoverState(sharedPage);
    await NavigationManager.ensureCohortManager(sharedPage);
  });

  test('TC-ENT-CM-01: Cohort Manager page loads correctly', async ({ cohortManager, sharedPage }) => {
    await cohortManager.assertPageLoaded();
    await expect(sharedPage).toHaveURL(/cohort-builder|cohort/i);
  });

  test('TC-ENT-CM-02: Cohort list is displayed', async ({ cohortManager }) => {
    await cohortManager.assertCohortCardsExist();
  });

  test('TC-ENT-CM-03: Cohort cards display title and course count', async ({ cohortManager, sharedPage }) => {
    await cohortManager.assertCohortCardsExist();
    
    // Check that cohort cards show an h3 title and "Courses" text
    const firstTitle = sharedPage.locator('h3').filter({ hasText: /\w{2,}/ }).first();
    await expect(firstTitle).toBeVisible();
    
    // Course count text (e.g. "14 Courses")
    const courseCount = sharedPage.getByText(/\d+ Course/i).first();
    await expect(courseCount).toBeVisible();
  });

  test('TC-ENT-CM-04: Search input works for cohorts', async ({ cohortManager, sharedPage }) => {
    await cohortManager.assertCohortCardsExist();
    
    const searchInput = sharedPage.getByPlaceholder('Search Cohorts...');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const firstTitle = await cohortManager.getFirstCohortTitle();
      if (!firstTitle) {
        test.skip(true, 'No cohorts found to search for.');
        return;
      }
      
      const query = firstTitle.substring(0, Math.min(firstTitle.length, 5));
      await cohortManager.searchCohort(query);
      // After search, verify at least one cohort is visible
      const count = await cohortManager.getCohortCount();
      expect(count).toBeGreaterThan(0);
    } else {
      test.skip(true, 'No search input found on cohort manager page.');
    }
  });

  test('TC-ENT-CM-05: Clicking a cohort opens cohort management detail', async ({ cohortManager, sharedPage }) => {
    await cohortManager.assertCohortCardsExist();
    
    await cohortManager.clickFirstCohort();
    // URL should transition to a detail view
    await expect(sharedPage).toHaveURL(/\/home\/bodhi\/.+/, { timeout: 15000 });
  });

  test('TC-ENT-CM-06: Clearing search input restores the cohort list', async ({ cohortManager, sharedPage }) => {
    await cohortManager.assertCohortCardsExist();
    
    // Ensure search is clear from previous tests
    await cohortManager.clearSearch();
    await sharedPage.waitForTimeout(1000); // debounce
    
    const searchInput = sharedPage.getByPlaceholder('Search Cohorts...');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const initialCount = await cohortManager.getCohortCount();
      const firstTitle = await cohortManager.getFirstCohortTitle();
      if (!firstTitle) {
        test.skip(true, 'No cohorts found to search for.');
        return;
      }
      
      const query = firstTitle.substring(0, Math.min(firstTitle.length, 5));
      await cohortManager.searchCohort(query);
      await sharedPage.waitForTimeout(1000); // debounce

      await cohortManager.clearSearch();
      await sharedPage.waitForTimeout(1000); // debounce
      
      const restoredCount = await cohortManager.getCohortCount();
      expect(restoredCount).toBe(initialCount);
    } else {
      test.skip(true, 'No search input found on cohort manager page.');
    }
  });

  test('TC-ENT-CM-07: Filter tabs (All Cohorts, Published, Draft) are visible and clickable', async ({ cohortManager }) => {
    await cohortManager.assertTabsVisible();
    await cohortManager.clickPublishedTab();
    await cohortManager.clickDraftTab();
    await cohortManager.clickAllCohortsTab();
  });

  test('TC-ENT-CM-08: "Create Cohort" button opens flow and can be cancelled', async ({ cohortManager, sharedPage }) => {
    await cohortManager.clickCreateCohort();
    
    // Look for a close button inside the dialog
    const dialog = sharedPage.getByRole('dialog');
    const closeBtn = dialog.getByRole('button', { name: /cancel/i }).or(dialog.getByLabel(/close/i));
    
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await sharedPage.keyboard.press('Escape');
    }
    
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });
});
