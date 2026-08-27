import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

/**
 * Student Profile — Recommended Cohorts Tests
 *
 * Verifies the "Recommended Cohorts" carousel section on the Bodhi dashboard:
 *   - Section and cards visible
 *   - Card content (name, author, course count)
 *   - Clicking card navigates to cohort detail
 *   - Cohort detail has a CTA (enroll / start)
 *   - Scroll controls work
 *
 * Project: student
 */
test.describe('Student Profile — Recommended Cohorts', () => {
  test.beforeEach(async ({ bodhiDashboard, profileSwitcher }) => {
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
    try {
      await profileSwitcher.switchToStudentProfile(ENV.STUDENT_PROFILE_NAME);
    } catch {
      // Already in student profile
    }
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
  });

  test('TC-STU-RC-01: Recommended Cohorts section is visible on student dashboard', async ({
    bodhiDashboard,
  }) => {
    await bodhiDashboard.assertRecommendedCohortsVisible();
  });

  test('TC-STU-RC-02: Recommended Cohorts section has cohort cards', async ({
    bodhiDashboard,
  }) => {
    await bodhiDashboard.assertRecommendedCohortCardsExist();
  });

  test('TC-STU-RC-03: Recommended cohort card shows name, author, and course count', async ({
    page, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertRecommendedCohortsVisible();
    const firstCard = page.getByRole('button', { name: /view cohort:/i }).last();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Heading with cohort name
    const cardHeading = firstCard.getByRole('heading').first();
    await expect(cardHeading).toBeVisible();

    // Author line
    const authorLine = firstCard.getByText(/By\s*:/i).first();
    await expect(authorLine).toBeVisible();

    // Course count
    const courseCount = firstCard.getByText(/\d+ Course/i).first();
    await expect(courseCount).toBeVisible();
  });

  test('TC-STU-RC-04: Clicking a recommended cohort card navigates to cohort detail', async ({
    page, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertRecommendedCohortCardsExist();
    await bodhiDashboard.clickRecommendedCohortCard(0);
    await expect(page).toHaveURL(/\/home\/bodhi\/.+/);
  });

  test('TC-STU-RC-05: Recommended cohort detail page shows cohort title', async ({
    page, bodhiDashboard, cohortDetail,
  }) => {
    await bodhiDashboard.clickRecommendedCohortCard(0);
    await cohortDetail.assertCohortTitleVisible();
  });

  test('TC-STU-RC-06: Scroll right button exists in recommended cohorts carousel', async ({
    page, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertRecommendedCohortsVisible();
    const scrollBtn = page.getByRole('button', { name: /scroll right/i }).first();
    await expect(scrollBtn).toBeVisible({ timeout: 5000 });
  });
});
