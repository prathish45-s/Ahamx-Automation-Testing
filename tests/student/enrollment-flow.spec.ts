import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

/**
 * Student Profile — Enrollment Flow
 *
 * Verifies the ability to enroll in a cohort from the "Recommended Cohorts" section
 * and checks that it subsequently appears in "My Enrolled Cohorts".
 *
 * WARNING: This test is skipped by default to prevent exhausting all recommended
 * cohorts in the staging environment. Run this manually if needed.
 *
 * Project: student
 */
test.describe('Student Profile — Enrollment Flow', () => {
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

  // Skipped to prevent consuming all recommended cohorts
  test.skip('TC-STU-ENROLL-01: Can enroll in a recommended cohort and see it in enrolled cohorts', async ({
    page, bodhiDashboard, cohortDetail
  }) => {
    // 1. Ensure Recommended Cohorts are visible
    await bodhiDashboard.assertRecommendedCohortsVisible();
    await bodhiDashboard.assertRecommendedCohortCardsExist();

    // 2. Note the name of the first recommended cohort
    const firstRecCard = page.getByRole('button', { name: /view cohort:/i }).first();
    const cohortName = await firstRecCard.getByRole('heading').first().textContent();
    expect(cohortName).toBeTruthy();

    // 3. Click the Enroll button (assuming it's a direct button or inside the detail page)
    // We'll click into the detail page to enroll
    await bodhiDashboard.clickRecommendedCohortCard(0);
    
    // 4. Click Enroll CTA
    const enrollBtn = page.getByRole('button', { name: /enroll|join/i }).first();
    await expect(enrollBtn).toBeVisible();
    await enrollBtn.click();

    // Wait for success toast or UI update
    await page.waitForTimeout(2000);

    // 5. Navigate back to dashboard
    await bodhiDashboard.goto();

    // 6. Verify it appears in My Enrolled Cohorts
    await bodhiDashboard.assertEnrolledCohortsVisible();
    // Assuming the newly enrolled cohort is at the start of the carousel
    const firstEnrolledCard = page.getByRole('button', { name: /view cohort:/i }).first();
    const enrolledName = await firstEnrolledCard.getByRole('heading').first().textContent();
    
    expect(enrolledName).toBe(cohortName);
  });
});
