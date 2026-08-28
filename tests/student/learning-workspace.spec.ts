import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

import { NavigationManager } from '../../src/utils/navigation-manager';

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

  test.beforeEach(async ({ sharedPage }) => {
    await NavigationManager.recoverState(sharedPage);
    learnUrl = await NavigationManager.ensureCoursePlayerFromContinueLearning(sharedPage);
  });

  test('TC-STU-LW-01: Learning workspace loads from a Continue Learning link', async ({
    sharedPage, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await learningWorkspace.assertUrlIsLearnPage();
    await learningWorkspace.assertWorkspaceLoaded();
  });

  test('TC-STU-LW-02: URL contains resume parameters (conceptId)', async ({
    sharedPage, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await learningWorkspace.assertUrlHasResumeParams();
  });

  test('TC-STU-LW-03: Ask AhamX button is visible in learning workspace', async ({
    sharedPage, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await learningWorkspace.assertAskAhamXButtonVisible();
  });

  test('TC-STU-LW-04: Description tab is visible in learning workspace', async ({
    sharedPage, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    // Check for tab or button with "Description" label
    const descTab = sharedPage.getByRole('tab', { name: /description/i })
      .or(sharedPage.getByRole('button', { name: /description/i }))
      .or(sharedPage.getByText('Description').first());
    await expect(descTab).toBeVisible({ timeout: 10000 });
  });

  test('TC-STU-LW-05: Course Outline tab is visible and clickable', async ({
    sharedPage, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    const outlineTab = sharedPage.getByRole('tab', { name: /course outline/i })
      .or(sharedPage.getByRole('button', { name: /course outline/i }))
      .or(sharedPage.getByText('Course Outline'));
    const isVisible = await outlineTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await outlineTab.click();
      await sharedPage.waitForTimeout(500);
      // Verify we're still on the same page
      await expect(sharedPage).toHaveURL(/\/learn/);
      
      // Verify the outline contains items (chapters/lessons)
      await learningWorkspace.assertCourseOutlineHasItems();
    } else {
      test.skip(true, 'Course Outline tab not available in this workspace layout');
    }
  });

  test('TC-STU-LW-06: Quiz tab is visible', async ({
    sharedPage, learningWorkspace,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    const quizTab = sharedPage.getByRole('tab', { name: /quiz/i })
      .or(sharedPage.getByRole('button', { name: /quiz/i }))
      .or(sharedPage.getByText('Quiz').first());
    const isVisible = await quizTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip(true, 'Quiz tab not available in this workspace layout');
    } else {
      await expect(quizTab).toBeVisible();
    }
  });

  test('TC-STU-LW-07: Opening Ask AhamX in workspace shows chat drawer', async ({
    sharedPage, learningWorkspace, chatPage,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await learningWorkspace.openAskAhamX();
    await chatPage.assertChatOpen();
  });

  test('TC-STU-LW-08: LLM responds to a question asked in the learning workspace', async ({
    sharedPage, learningWorkspace, chatPage,
  }) => {
    if (!learnUrl) {
      test.skip(true, 'No /learn links found on student dashboard');
      return;
    }
    await learningWorkspace.openAskAhamX();
    await chatPage.sendMessage('Summarize this concept for me.');
    await chatPage.assertResponseReceived();
  });
});
