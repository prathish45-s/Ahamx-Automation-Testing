import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

/**
 * Student Profile — Bodhi Dashboard Tests
 *
 * These run AFTER switching to the Student (personal) profile.
 * The student profile shows: Enrolled Cohorts, Completed Courses, Time spent.
 * No Studio section in sidebar.
 *
 * Project: student
 */
test.describe('Student Profile — Bodhi Dashboard', () => {
  test.beforeEach(async ({ page, bodhiDashboard, profileSwitcher }) => {
    // Navigate first, then switch profile
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();

    // Switch to student profile
    await profileSwitcher.switchToStudentProfile(ENV.STUDENT_PROFILE_NAME);

    // Navigate to Bodhi again after profile switch to get the student view
    await page.goto('/home/bodhi', { waitUntil: 'domcontentloaded' });
    await bodhiDashboard.dismissTourIfPresent();
    await page.waitForSelector('text=Next Level AI Learning Platform', { timeout: 15000 });
  });

  test('TC-STU-DASH-01: Bodhi page loads with correct title and subtitle', async ({ bodhiDashboard }) => {
    await bodhiDashboard.assertPageLoaded();
  });

  test('TC-STU-DASH-02: Student profile shows student-specific stat cards', async ({ bodhiDashboard }) => {
    await bodhiDashboard.assertStudentStats();
  });

  test('TC-STU-DASH-03: Continue Learning section is visible in student profile', async ({ bodhiDashboard }) => {
    await bodhiDashboard.assertContinueLearningVisible();
  });

  test('TC-STU-DASH-04: Ask AhamX button is present in student view', async ({ bodhiDashboard }) => {
    await bodhiDashboard.assertAskAhamXButtonVisible();
  });

  test('TC-STU-DASH-05: Student profile header shows student name (not entity)', async ({ page }) => {
    // Verify we see the student name, not "IIT Madras"
    await expect(page.getByText(ENV.STUDENT_PROFILE_NAME, { exact: false })).toBeVisible();
    await expect(page.getByText(ENV.ENTITY_PROFILE_NAME)).not.toBeVisible();
  });

  test('TC-STU-DASH-06: Studio section is NOT visible in student profile sidebar', async ({ page }) => {
    await expect(page.getByText('STUDIO')).not.toBeVisible();
  });
});
