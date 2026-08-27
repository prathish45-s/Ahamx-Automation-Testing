import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

/**
 * Student Profile — Cohort and Learning Flow Tests
 *
 * Project: student
 */
test.describe('Student Profile — Cohorts Center', () => {
  test.beforeEach(async ({ page, bodhiDashboard, profileSwitcher }) => {
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
    try {
      await profileSwitcher.switchToStudentProfile(ENV.STUDENT_PROFILE_NAME);
    } catch {
      // Already in student or switch not needed
    }
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
  });

  test('TC-STU-COHORT-01: Cohorts Center navigation link is visible in student view', async ({ page }) => {
    // Sidebar might be collapsed, so check for the link by href or text
    const link = page.locator('a[href*="/home/bodhi"]').first();
    await expect(link).toBeVisible();
  });

  test('TC-STU-COHORT-02: Navigating to Cohorts Center loads cohort listing', async ({ bodhiDashboard, page }) => {
    await bodhiDashboard.clickCohortsCenter();
    // Should show a list of cohort items
    await expect(page.getByText(/cohort/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-STU-COHORT-03: Clicking an enrolled cohort card navigates to cohort detail page', async ({
    page, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertEnrolledCohortCardsExist();
    await bodhiDashboard.clickEnrolledCohortCard(0);
    // URL should change to a cohort slug path under /home/bodhi/
    await expect(page).toHaveURL(/\/home\/bodhi\/.+/, { timeout: 10000 });
  });

  test('TC-STU-COHORT-04: Cohort detail page shows cohort title', async ({
    page, bodhiDashboard, cohortDetail,
  }) => {
    await bodhiDashboard.clickEnrolledCohortCard(0);
    await cohortDetail.assertCohortTitleVisible();
  });

  test('TC-STU-COHORT-05: Cohort detail page shows at least one course link', async ({
    page, bodhiDashboard, cohortDetail,
  }) => {
    await bodhiDashboard.clickEnrolledCohortCard(0);
    await cohortDetail.assertCourseLinksExist();
  });

  test('TC-STU-COHORT-06: Cohort detail shows a Start Learning or Continue Learning action', async ({
    page, bodhiDashboard,
  }) => {
    await bodhiDashboard.clickEnrolledCohortCard(0);
    await page.waitForLoadState('domcontentloaded');
    // Either a "Start Learning" button OR a /learn link acts as the CTA
    const cta = page.getByRole('button', { name: /start learning|continue learning/i })
      .or(page.locator('a[href*="/learn"]'));
    await expect(cta.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Student Profile — Profile Switching', () => {
  test('TC-STU-PROFILE-01: Switch Profile panel shows Personal and Entity sections', async ({
    page,
    bodhiDashboard,
    profileSwitcher,
  }) => {
    await bodhiDashboard.goto();
    await profileSwitcher.openSwitchProfile();
    await profileSwitcher.assertSwitchProfilePanelVisible();
  });

  test('TC-STU-PROFILE-02: Can switch from Entity to Student profile', async ({
    page,
    bodhiDashboard,
    profileSwitcher,
  }) => {
    await bodhiDashboard.goto();
    // Ensure we start in entity, then switch to student
    await profileSwitcher.switchToStudentProfile(ENV.STUDENT_PROFILE_NAME);
    await profileSwitcher.assertCurrentProfileIs(ENV.STUDENT_PROFILE_NAME);
  });
});
