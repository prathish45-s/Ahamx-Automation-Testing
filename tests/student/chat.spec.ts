import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

/**
 * Student Profile — Ask AhamX Chat Tests
 *
 * Tests the LLM chat panel in student profile context.
 * All waits are condition-based (no waitForTimeout for responses).
 *
 * Project: student
 */
test.describe('Student Profile — Ask AhamX Chat', () => {
  // LLM responses can take a while to stream
  test.setTimeout(90000);

  test.beforeEach(async ({ page, bodhiDashboard, profileSwitcher }) => {
    await bodhiDashboard.goto();
    await profileSwitcher.switchToStudentProfile(ENV.STUDENT_PROFILE_NAME);
    await bodhiDashboard.goto();
  });

  test('TC-STU-CHAT-01: Ask AhamX button opens the chat drawer', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.assertChatOpen();
  });

  test('TC-STU-CHAT-02: Chat drawer shows empty state with prompt suggestions', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.assertEmptyStateVisible();
    await chatPage.assertSuggestedChipsVisible();
  });

  test('TC-STU-CHAT-03: Chat input accepts text and send button is enabled', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.typeMessage('What is leadership?');
    await chatPage.assertSendButtonEnabled();
  });

  test('TC-STU-CHAT-04: Sending a message receives a response from the LLM', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.sendMessage('What is leadership?');
    await chatPage.assertResponseReceived();
  });

  test('TC-STU-CHAT-05: Input is cleared after message is sent', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.sendMessage('Explain team dynamics.');
    await chatPage.assertInputEmpty();
  });

  test('TC-STU-CHAT-06: Send button re-enables after LLM response is complete', async ({ bodhiDashboard, chatPage }) => {
    await bodhiDashboard.openAskAhamX();
    await chatPage.sendMessage('Brief overview of leadership styles.');
    // Input is cleared after sending, so send button is disabled by default.
    // We must type something to verify the button actually re-enables.
    await chatPage.typeMessage('Follow up');
    await chatPage.assertSendButtonEnabled();
  });
});
