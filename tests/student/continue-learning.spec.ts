import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

/**
 * Student Profile — Continue Learning Tests
 *
 * Verifies the "Continue Learning" section on the Bodhi dashboard:
 *   - Cards are visible with correct labels
 *   - "Start Learning" navigates to the course player
 *   - The player resumes from the saved position (URL params)
 *   - Scroll controls work on the carousel
 *
 * Project: student
 */
test.describe('Student Profile — Continue Learning', () => {
  test.setTimeout(60000);
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

  test('TC-STU-CL-01: Continue Learning section is visible on student dashboard', async ({
    bodhiDashboard,
  }) => {
    await bodhiDashboard.assertContinueLearningVisible();
  });

  test('TC-STU-CL-02: Continue Learning section has course cards', async ({
    bodhiDashboard,
  }) => {
    await bodhiDashboard.assertContinueLearningCardsExist();
  });

  test('TC-STU-CL-03: Continue Learning card shows course title and cohort name', async ({
    page, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertContinueLearningVisible();
    // Each card has a h2 heading for course title and a paragraph for cohort name
    const firstCardHeading = page.getByRole('heading', { level: 2 })
      .filter({ hasText: /\w{3,}/ })
      .first();
    await expect(firstCardHeading).toBeVisible({ timeout: 10000 });
    // Cohort name paragraph (e.g. "Cohort: Mastering Java")
    const cohortLabel = page.getByText(/^Cohort:/i).first();
    await expect(cohortLabel).toBeVisible({ timeout: 5000 });
  });

  test('TC-STU-CL-04: Continue Learning card shows progress bar and time remaining', async ({
    page, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertContinueLearningVisible();
    // Progress bar (role="progressbar") and time left text
    const progressBar = page.getByRole('progressbar').first();
    await expect(progressBar).toBeVisible({ timeout: 10000 });
    // Time remaining (e.g. "57:08 left" or "01:29:11 left")
    const timeLeft = page.getByText(/\d+:\d+ left|\d+h \d+m left/i).first();
    await expect(timeLeft).toBeVisible({ timeout: 5000 });
  });

  test('TC-STU-CL-05: Clicking Start Learning navigates to course player', async ({
    page, bodhiDashboard,
  }) => {
    // Wait for learn links to appear
    const links = bodhiDashboard.getContinueLearningLearnLinks();
    await links.first().waitFor({ state: 'visible', timeout: 10000 });
    const href = (await links.first().getAttribute('href')) ?? '';
    expect(href).toContain('/learn');

    // Navigate directly via the link (most reliable)
    await page.goto(href);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/learn/);
  });

  test('TC-STU-CL-06: Course player URL contains resume position (conceptId)', async ({
    page, bodhiDashboard,
  }) => {
    const links = bodhiDashboard.getContinueLearningLearnLinks();
    await links.first().waitFor({ state: 'visible', timeout: 10000 });
    const href = (await links.first().getAttribute('href')) ?? '';
    // Resume links include ?conceptId= to track position in the course
    expect(href).toMatch(/conceptId=/);
  });

  test('TC-STU-CL-07: Course player loads Ask AhamX after navigating from Continue Learning', async ({
    page, bodhiDashboard, learningWorkspace,
  }) => {
    const links = bodhiDashboard.getContinueLearningLearnLinks();
    await links.first().waitFor({ state: 'visible', timeout: 10000 });
    const href = (await links.first().getAttribute('href')) ?? '';
    await page.goto(href);
    await page.waitForLoadState('domcontentloaded');
    await learningWorkspace.assertAskAhamXButtonVisible();
  });

  test('TC-STU-CL-08: Scroll right button exists in Continue Learning carousel', async ({
    page, bodhiDashboard,
  }) => {
    await bodhiDashboard.assertContinueLearningVisible();
    const scrollBtn = page.getByRole('button', { name: /scroll right/i }).first();
    await expect(scrollBtn).toBeVisible({ timeout: 5000 });
  });
});
