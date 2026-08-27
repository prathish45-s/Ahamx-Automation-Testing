import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

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
  test.beforeEach(async ({ page, bodhiDashboard, profileSwitcher }) => {
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
    try {
      await profileSwitcher.switchToEntityProfile(ENV.ENTITY_PROFILE_NAME);
    } catch {
      // Already in entity profile
    }
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
  });

  test('TC-ENT-CM-01: Cohort Manager page loads correctly', async ({ bodhiDashboard, cohortManager, page }) => {
    await bodhiDashboard.clickCohortManager();
    await cohortManager.assertPageLoaded();
    await expect(page).toHaveURL(/cohort-builder|cohort/i);
  });

  test('TC-ENT-CM-02: Cohort list is displayed', async ({ bodhiDashboard, cohortManager }) => {
    await bodhiDashboard.clickCohortManager();
    await cohortManager.assertCohortCardsExist();
  });

  test('TC-ENT-CM-03: Cohort cards display title and course count', async ({ bodhiDashboard, cohortManager, page }) => {
    await bodhiDashboard.clickCohortManager();
    await cohortManager.assertCohortCardsExist();
    
    // Check that cohort cards show an h3 title and "Courses" text
    const firstTitle = page.locator('h3').filter({ hasText: /\w{2,}/ }).first();
    await expect(firstTitle).toBeVisible();
    
    // Course count text (e.g. "14 Courses")
    const courseCount = page.getByText(/\d+ Course/i).first();
    await expect(courseCount).toBeVisible();
  });

  test('TC-ENT-CM-04: Search input works for cohorts', async ({ bodhiDashboard, cohortManager, page }) => {
    await bodhiDashboard.clickCohortManager();
    await cohortManager.assertCohortCardsExist();
    
    const searchInput = page.getByPlaceholder('Search Cohorts...');
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

  test('TC-ENT-CM-05: Clicking a cohort opens cohort management detail', async ({ bodhiDashboard, cohortManager, page }) => {
    await bodhiDashboard.clickCohortManager();
    await cohortManager.assertCohortCardsExist();
    
    await cohortManager.clickFirstCohort();
    // URL should transition to a detail view
    await expect(page).toHaveURL(/\/home\/bodhi\/.+/, { timeout: 15000 });
  });
});
