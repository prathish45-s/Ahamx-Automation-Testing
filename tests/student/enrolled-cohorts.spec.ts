import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

import { NavigationManager } from '../../src/utils/navigation-manager';

/**
 * Student Profile — My Enrolled Cohorts Tests
 *
 * Verifies the "My Enrolled Cohorts" carousel section on the Bodhi dashboard:
 *   - Section and cards are visible
 *   - Card content (name, author, course count)
 *   - Clicking a card navigates to cohort detail
 *   - Cohort detail shows title, course list, and CTA
 *   - Clicking a course in cohort detail navigates to course player
 *
 * Project: student
 */
test.describe('Student Profile — My Enrolled Cohorts', () => {
  test.beforeEach(async ({ sharedPage }) => {
    await NavigationManager.recoverState(sharedPage);
    await NavigationManager.ensureStudentDashboard(sharedPage);
  });

  test('TC-STU-EC-01: My Enrolled Cohorts section is visible on student dashboard', async ({
    bodhiDashboard,
  }) => {
    await bodhiDashboard.assertEnrolledCohortsVisible();
  });

  test('TC-STU-EC-02: My Enrolled Cohorts section has cohort cards', async ({
    bodhiDashboard,
  }) => {
    await bodhiDashboard.assertEnrolledCohortCardsExist();
  });

  test('TC-STU-EC-03: Enrolled cohort card shows cohort name and author', async ({
    sharedPage, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertEnrolledCohortsVisible();
    // Each card button has aria-label "View cohort: <Name>"
    const firstCard = sharedPage.getByRole('button', { name: /view cohort:/i }).first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Card should contain a heading with the cohort name
    const cardHeading = firstCard.getByRole('heading').first();
    await expect(cardHeading).toBeVisible();

    // Card should show "By :" author line
    const authorLine = firstCard.getByText(/By\s*:/i).first();
    await expect(authorLine).toBeVisible();
  });

  test('TC-STU-EC-04: Enrolled cohort card shows course count', async ({
    sharedPage, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertEnrolledCohortsVisible();
    const firstCard = sharedPage.getByRole('button', { name: /view cohort:/i }).first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    // Course count text (e.g. "1 Course •" or "3 Courses •")
    const courseCount = firstCard.getByText(/\d+ Course/i).first();
    await expect(courseCount).toBeVisible();
  });

  test('TC-STU-EC-05: Clicking an enrolled cohort card navigates to cohort detail', async ({
    sharedPage, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertEnrolledCohortCardsExist();
    await NavigationManager.ensureEnrolledCohortDetail(sharedPage, 0);
    // URL should change to a cohort detail page
    await expect(sharedPage).toHaveURL(/\/home\/bodhi\/.+/);
  });

  test('TC-STU-EC-06: Cohort detail page shows cohort title', async ({
    sharedPage, bodhiDashboard, cohortDetail,
  }) => {
    await NavigationManager.ensureEnrolledCohortDetail(sharedPage, 0);
    await cohortDetail.assertCohortTitleVisible();
  });

  test('TC-STU-EC-07: Cohort detail page has course links to the player', async ({
    sharedPage, bodhiDashboard, cohortDetail,
  }) => {
    await NavigationManager.ensureEnrolledCohortDetail(sharedPage, 0);
    await cohortDetail.assertCourseLinksExist();
  });

  test('TC-STU-EC-08: Clicking a course in cohort detail navigates to learning workspace', async ({
    sharedPage, bodhiDashboard, cohortDetail, learningWorkspace,
  }) => {
    await NavigationManager.ensureEnrolledCohortDetail(sharedPage, 0);
    const count = await cohortDetail.getCourseCount();
    if (count === 0) {
      test.skip(true, 'Cohort has no course links — skipping workspace navigation test');
      return;
    }
    await cohortDetail.clickFirstCourse();
    await expect(sharedPage).toHaveURL(/\/learn/);
    await learningWorkspace.assertAskAhamXButtonVisible();
  });

  test('TC-STU-EC-09: Cohort detail page shows metadata (Author and Publish Date)', async ({
    sharedPage, bodhiDashboard, cohortDetail,
  }) => {
    await NavigationManager.ensureEnrolledCohortDetail(sharedPage, 0);
    await cohortDetail.assertMetadataVisible();
  });

  test('TC-STU-EC-10: Cohort detail page shows Courses and Channels tabs', async ({
    sharedPage, bodhiDashboard, cohortDetail,
  }) => {
    await NavigationManager.ensureEnrolledCohortDetail(sharedPage, 0);
    await cohortDetail.assertTabsVisible();
  });

  test('TC-STU-EC-11: Scroll right button exists in enrolled cohorts carousel', async ({
    sharedPage, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertEnrolledCohortsVisible();
    // Scroll right button in the enrolled cohorts row
    const scrollBtn = sharedPage.getByRole('button', { name: /scroll right/i }).first();
    await expect(scrollBtn).toBeVisible({ timeout: 5000 });
  });
});
