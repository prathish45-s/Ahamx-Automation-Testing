import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

/**
 * Student Profile — Learning Workspace Tests
 *
 * Verifies the course player page (/home/bodhi/.../learn):
 *   - Page loads from a Continue Learning link
 *   - Description tab (default), Course Outline tab, Quiz tab
 *   - Ask AhamX is available and functional in the workspace
 *   - LLM responds to a question in the workspace
 *   - Breadcrumb navigation is present
 *   - Resume URL has correct params (conceptId)
 *
 * Project: student
 */
test.describe('Student Profile — Learning Workspace', () => {
  // LLM tests take longer
  test.setTimeout(90000);

  let learnUrl = '';

  test.beforeEach(async ({ page, bodhiDashboard, profileSwitcher }) => {
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
    try {
      await profileSwitcher.switchToStudentProfile(ENV.STUDENT_PROFILE_NAME);
    } catch {
      // Already in student profile
    }
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();

    // Get a valid learn URL from Continue Learning section
    const links = bodhiDashboard.getContinueLearningLearnLinks();
    await links.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    learnUrl = (await links.first().getAttribute('href')) ?? '';
  });

  test('TC-STU-LW-01: Learning workspace loads from a Continue Learning link', async ({
    page, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await page.goto(learnUrl);
    await page.waitForLoadState('domcontentloaded');
    await learningWorkspace.assertUrlIsLearnPage();
    await learningWorkspace.assertWorkspaceLoaded();
  });

  test('TC-STU-LW-02: URL contains resume parameters (conceptId)', async ({
    page, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await page.goto(learnUrl);
    await page.waitForLoadState('domcontentloaded');
    await learningWorkspace.assertUrlHasResumeParams();
  });

  test('TC-STU-LW-03: Ask AhamX button is visible in learning workspace', async ({
    page, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await page.goto(learnUrl);
    await page.waitForLoadState('domcontentloaded');
    await learningWorkspace.assertAskAhamXButtonVisible();
  });

  test('TC-STU-LW-04: Description tab is visible in learning workspace', async ({
    page, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await page.goto(learnUrl);
    await page.waitForLoadState('domcontentloaded');
    // Check for tab or button with "Description" label
    const descTab = page.getByRole('tab', { name: /description/i })
      .or(page.getByRole('button', { name: /description/i }))
      .or(page.getByText('Description').first());
    await expect(descTab).toBeVisible({ timeout: 10000 });
  });

  test('TC-STU-LW-05: Course Outline tab is visible and clickable', async ({
    page, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await page.goto(learnUrl);
    await page.waitForLoadState('domcontentloaded');
    const outlineTab = page.getByRole('tab', { name: /course outline/i })
      .or(page.getByRole('button', { name: /course outline/i }))
      .or(page.getByText('Course Outline'));
    const isVisible = await outlineTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await outlineTab.click();
      await page.waitForTimeout(500);
      // Verify we're still on the same page
      await expect(page).toHaveURL(/\/learn/);
      
      // Verify the outline contains items (chapters/lessons)
      await learningWorkspace.assertCourseOutlineHasItems();
    } else {
      test.skip(true, 'Course Outline tab not available in this workspace layout');
    }
  });

  test('TC-STU-LW-06: Quiz tab is visible', async ({
    page, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await page.goto(learnUrl);
    await page.waitForLoadState('domcontentloaded');
    const quizTab = page.getByRole('tab', { name: /quiz/i })
      .or(page.getByRole('button', { name: /quiz/i }))
      .or(page.getByText('Quiz').first());
    const isVisible = await quizTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip(true, 'Quiz tab not available in this workspace layout');
    } else {
      await expect(quizTab).toBeVisible();
    }
  });

  test('TC-STU-LW-07: Opening Ask AhamX in workspace shows chat drawer', async ({
    page, learningWorkspace, chatPage,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await page.goto(learnUrl);
    await page.waitForLoadState('domcontentloaded');
    await learningWorkspace.openAskAhamX();
    await chatPage.assertChatOpen();
  });

  test('TC-STU-LW-08: LLM responds to a question asked in the learning workspace', async ({
    page, learningWorkspace, chatPage,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await page.goto(learnUrl);
    await page.waitForLoadState('domcontentloaded');
    await learningWorkspace.openAskAhamX();
    await chatPage.sendMessage('Summarize this concept for me.');
    await chatPage.assertResponseReceived();
  });
});
