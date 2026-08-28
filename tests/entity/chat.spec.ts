import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

import { NavigationManager } from '../../src/utils/navigation-manager';

/**
 * Entity Profile — Ask AhamX Chat Tests
 *
 * Tests LLM chat in entity context (from the course learning workspace).
 * Project: entity
 */
test.describe('Entity Profile — Ask AhamX Chat', () => {
  // LLM responses can take a while to stream
  test.setTimeout(90000);

  test.beforeEach(async ({ sharedPage }) => {
    await NavigationManager.recoverState(sharedPage);
    await NavigationManager.ensureEntityDashboard(sharedPage);
  });

  test('TC-ENT-CHAT-01: Ask AhamX chat opens from entity Bodhi dashboard', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.assertChatOpen();
  });

  test('TC-ENT-CHAT-02: Chat shows empty state with suggestions in entity profile', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.assertEmptyStateVisible();
    await chatPage.assertSuggestedChipsVisible();
  });

  test('TC-ENT-CHAT-03: LLM responds to a message in entity profile', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.sendMessage('Tell me about this cohort.');
    await chatPage.assertResponseReceived();
  });

  test('TC-ENT-CHAT-04: Chat input is editable after LLM response streams in', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.sendMessage('What courses are available?');
    // The send button is tied to input content — it's disabled when input is empty.
    // The correct post-stream signal is that the chat input is editable again.
    await chatPage.assertChatInputEditable();
  });
});

test.describe('Entity Profile — Learning Workspace Chat', () => {
  // LLM responses can take a while to stream
  test.setTimeout(90000);

  test.beforeEach(async ({ sharedPage }) => {
    await NavigationManager.recoverState(sharedPage);
    await NavigationManager.ensureEntityDashboard(sharedPage);
  });

  test('TC-ENT-WS-01: Opening a cohort shows course content and Ask AhamX drawer', async ({
    sharedPage, bodhiDashboard, learningWorkspace, chatPage,
  }) => {
    // Find a direct /learn link from the entity dashboard
    const learnLinks = sharedPage.locator('a[href*="/learn"]');
    const learnCount = await learnLinks.count();

    if (learnCount === 0) {
      // Entity (admin) profile typically has no /learn links — skip gracefully
      test.skip(true, 'Entity profile has no /learn links — workspace test is student-only');
      return;
    }

    const href = await learnLinks.first().getAttribute('href');
    if (!href) {
      test.skip(true, 'Could not extract /learn URL from entity dashboard');
      return;
    }

    await sharedPage.goto(href, { waitUntil: 'domcontentloaded' });
    await learningWorkspace.assertWorkspaceLoaded();
    await learningWorkspace.assertAskAhamXButtonVisible();
    await learningWorkspace.openAskAhamX();
    await chatPage.assertChatOpen();
  });
});
