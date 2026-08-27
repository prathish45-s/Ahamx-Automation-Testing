import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

/**
 * Entity Profile (IIT Madras) — Studio Navigation Tests
 *
 * Tests navigation to and rendering of each Studio section.
 * Project: entity
 */
test.describe('Entity Profile — Studio Navigation', () => {
  test.setTimeout(60000); // Profile switching + navigation can be slow on staging
  test.beforeEach(async ({ page, bodhiDashboard, profileSwitcher }) => {
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
    try {
      await profileSwitcher.switchToEntityProfile(ENV.ENTITY_PROFILE_NAME);
    } catch {
      // Already in entity or switch not needed
    }
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
  });

  test('TC-ENT-NAV-01: Concept Manager page loads correctly', async ({ bodhiDashboard, conceptManager, page }) => {
    await bodhiDashboard.clickConceptManager();
    await conceptManager.assertPageLoaded();
    await expect(page).toHaveURL(/concept/i);
  });

  test('TC-ENT-NAV-02: Concept Manager shows My Concepts and All Concepts tabs', async ({ bodhiDashboard, conceptManager }) => {
    await bodhiDashboard.clickConceptManager();
    await conceptManager.assertTabsVisible();
  });

  test('TC-ENT-NAV-03: Concept Manager shows concept cards', async ({ bodhiDashboard, conceptManager }) => {
    await bodhiDashboard.clickConceptManager();
    await conceptManager.assertConceptCardsExist();
  });

  test('TC-ENT-NAV-04: Concept Manager search input is functional', async ({ bodhiDashboard, conceptManager }) => {
    await bodhiDashboard.clickConceptManager();
    await conceptManager.searchConcept('Git');
    // Verify something is present (search filters don't crash)
    await conceptManager.assertPageLoaded();
  });

  test('TC-ENT-NAV-05: Course Library page loads correctly', async ({ bodhiDashboard, courseLibrary, page }) => {
    await bodhiDashboard.clickCourseLibrary();
    await courseLibrary.assertPageLoaded();
    await expect(page).toHaveURL(/course-library/i);
  });

  test('TC-ENT-NAV-06: Cohort Manager page loads correctly', async ({ bodhiDashboard, cohortManager, page }) => {
    await bodhiDashboard.clickCohortManager();
    await cohortManager.assertPageLoaded();
  });
});
