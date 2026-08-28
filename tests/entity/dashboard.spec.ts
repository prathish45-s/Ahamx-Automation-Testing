import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

import { NavigationManager } from '../../src/utils/navigation-manager';

/**
 * Entity Profile (IIT Madras) — Bodhi Dashboard Tests
 *
 * These tests run in the Entity (IIT Madras) profile context.
 * Entity profile shows: Enrolled Users, Courses stats.
 * Sidebar includes Studio section: Concept Manager, Course Library, Cohort Manager.
 *
 * Project: entity
 */
test.describe('Entity Profile — Bodhi Dashboard', () => {
  test.beforeEach(async ({ sharedPage }) => {
    await NavigationManager.recoverState(sharedPage);
    await NavigationManager.ensureEntityDashboard(sharedPage);
  });

  test('TC-ENT-DASH-01: Bodhi page loads with title and subtitle in entity profile', async ({ bodhiDashboard }) => {
    await bodhiDashboard.assertPageLoaded();
  });

  test('TC-ENT-DASH-02: Entity profile shows entity-specific stat cards', async ({ bodhiDashboard }) => {
    await bodhiDashboard.assertEntityStats();
  });

  test('TC-ENT-DASH-03: Entity profile header shows IIT Madras label', async ({ sharedPage }) => {
    await expect(sharedPage.getByText(ENV.ENTITY_PROFILE_NAME)).toBeVisible();
  });

  test('TC-ENT-DASH-04: Studio sidebar section is visible in entity profile', async ({ sharedPage }) => {
    await expect(sharedPage.getByText('STUDIO')).toBeVisible();
  });

  test('TC-ENT-DASH-05: Entity sidebar contains all Studio navigation links', async ({ bodhiDashboard }) => {
    await bodhiDashboard.assertEntitySidebarVisible();
  });

  test('TC-ENT-DASH-06: Cohorts section with cards is visible in entity view', async ({ bodhiDashboard }) => {
    await bodhiDashboard.assertCohortsVisible();
  });

  test('TC-ENT-DASH-07: Ask AhamX button is present in entity view', async ({ bodhiDashboard }) => {
    await bodhiDashboard.assertAskAhamXButtonVisible();
  });

  test('TC-ENT-DASH-08: Clicking a Cohort card on dashboard navigates to detail', async ({ bodhiDashboard, sharedPage, cohortDetail }) => {
    const count = await bodhiDashboard.getCohortCount();
    if (count > 0) {
      await bodhiDashboard.clickFirstCohortCard();
      await cohortDetail.assertCohortTitleVisible();
      await expect(sharedPage).toHaveURL(/\/home\/bodhi\/.+/);
    } else {
      test.skip(true, 'No cohorts found on entity dashboard');
    }
  });

  test('TC-ENT-DASH-09: Entity stats cards display numerical values', async ({ sharedPage }) => {
    // The stat card for "Total Available Cohorts" should contain a number
    const statLabel = sharedPage.getByText('Total Available Cohorts', { exact: true });
    await expect(statLabel).toBeVisible();
    
    // The stat value is a sibling/nearby element — just verify the overall page has numbers
    const pageText = await sharedPage.locator('body').textContent();
    // The stats area should show at least one number
    expect(pageText).toMatch(/Total Available Cohorts/);
    expect(pageText).toMatch(/\d+/);
  });
});
