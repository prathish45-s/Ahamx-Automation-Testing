import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

import { NavigationManager } from '../../src/utils/navigation-manager';

/**
 * Entity Profile (IIT Madras) — Studio Navigation Tests
 *
 * Tests navigation to and rendering of each Studio section.
 * Project: entity
 */
test.describe('Entity Profile — Studio Navigation', () => {
  test.setTimeout(60000); // Profile switching + navigation can be slow on staging
  test.beforeEach(async ({ sharedPage }) => {
    await NavigationManager.recoverState(sharedPage);
  });

  test('TC-ENT-NAV-01: Concept Manager page loads correctly', async ({ conceptManager, sharedPage }) => {
    await NavigationManager.ensureConceptLibrary(sharedPage);
    await conceptManager.assertPageLoaded();
    await expect(sharedPage).toHaveURL(/concept/i);
  });

  test('TC-ENT-NAV-02: Concept Manager shows My Concepts and All Concepts tabs', async ({ conceptManager, sharedPage }) => {
    await NavigationManager.ensureConceptLibrary(sharedPage);
    await conceptManager.assertTabsVisible();
  });

  test('TC-ENT-NAV-03: Concept Manager shows concept cards', async ({ conceptManager, sharedPage }) => {
    await NavigationManager.ensureConceptLibrary(sharedPage);
    await conceptManager.assertConceptCardsExist();
  });

  test('TC-ENT-NAV-04: Concept Manager search input is functional', async ({ conceptManager, sharedPage }) => {
    await NavigationManager.ensureConceptLibrary(sharedPage);
    await conceptManager.searchConcept('Git');
    // Verify something is present (search filters don't crash)
    await conceptManager.assertPageLoaded();
  });

  test('TC-ENT-NAV-05: Course Library page loads correctly', async ({ courseLibrary, sharedPage }) => {
    await NavigationManager.ensureCourseLibrary(sharedPage);
    await courseLibrary.assertPageLoaded();
    await expect(sharedPage).toHaveURL(/course-library/i);
  });

  test('TC-ENT-NAV-06: Cohort Manager page loads correctly', async ({ cohortManager, sharedPage }) => {
    await NavigationManager.ensureCohortManager(sharedPage);
    await cohortManager.assertPageLoaded();
  });
});
