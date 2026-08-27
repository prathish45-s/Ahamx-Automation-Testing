import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { waitForLLMResponse } from '../utils/wait.helpers';

/**
 * AskAhamXChatPage — Page Object Model for the LLM Chat Drawer
 *
 * The "Ask AhamX" chat panel is a slide-in drawer available globally.
 * It contains:
 *   - Header: "Ask AhamX" title + close (X) button + menu (≡) + new chat (+) buttons
 *   - Empty state: AhamX avatar + "Got a question? Ask AhamX and keep learning"
 *   - Suggested prompts (chips): "Advance Machine Learning?", "Tell me more about the course", etc.
 *   - Input: placeholder "Ask me anything..."
 *   - Send button (submit, disabled while streaming)
 *   - Response area with copy / thumbs-up / thumbs-down / bookmark actions
 */
export class AskAhamXChatPage extends BasePage {
  // ─── Selectors ───────────────────────────────────────────────────────────────

  private readonly chatDrawer = () => this.page.locator('[class*="drawer"], [class*="chat-panel"], [class*="sidebar-right"]').filter({ hasText: 'Ask AhamX' });
  private readonly chatTitle = () => this.getByText('Ask AhamX');
  private readonly closeButton = () => this.page.locator('[class*="drawer"], [class*="chat"]').getByRole('button', { name: /close/i });
  private readonly chatInput = () => this.getByPlaceholder('Ask me anything...');
  private readonly sendButton = () => this.page.getByRole('button', { name: /send message/i });
  private readonly emptyStateText = () => this.getByText(/Got a question\? Ask AhamX/i);
  private readonly suggestedChips = () => this.page.getByRole('button').filter({ hasText: /\?|tell me more/i });
  private readonly messages = () => this.page.locator('[class*="message"], [class*="response"]');
  private readonly menuButton = () => this.page.locator('button').filter({ has: this.page.locator('text=≡') }).or(this.page.locator('[aria-label*="menu"], [class*="menu-btn"]'));
  private readonly newChatButton = () => this.page.locator('[aria-label*="new"], [class*="new-chat"]');

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async assertChatOpen(): Promise<void> {
    await expect(this.chatTitle().first()).toBeVisible({ timeout: 5000 });
    await expect(this.chatInput()).toBeVisible();
  }

  async assertChatClosed(): Promise<void> {
    await expect(this.chatInput()).not.toBeVisible({ timeout: 5000 });
  }

  async close(): Promise<void> {
    const closeBtn = this.page.locator('[class*="chat"], [class*="drawer"]').getByRole('button').filter({ hasText: /^×$|close/i }).or(
      this.page.locator('button[aria-label="Close"]')
    );
    // Fallback: find button with × character near "Ask AhamX" heading
    const xBtn = this.page.locator('button').filter({ hasText: '×' });
    if (await xBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await xBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.assertChatClosed();
  }

  async typeMessage(message: string): Promise<void> {
    await this.chatInput().click();
    await this.chatInput().fill(message);
  }

  async sendMessage(message: string): Promise<void> {
    await this.typeMessage(message);
    await this.sendButton().click();
    await waitForLLMResponse(this.page);
  }

  async clickSuggestedChip(chipText: string): Promise<void> {
    await this.page.getByText(chipText, { exact: false }).click();
    await waitForLLMResponse(this.page);
  }

  async getLastResponseText(): Promise<string> {
    const lastMessage = this.messages().last();
    return (await lastMessage.textContent()) ?? '';
  }

  async getMessageCount(): Promise<number> {
    return this.messages().count();
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertEmptyStateVisible(): Promise<void> {
    await this.assertVisible(this.emptyStateText());
  }

  async assertSuggestedChipsVisible(): Promise<void> {
    const count = await this.suggestedChips().count();
    expect(count).toBeGreaterThan(0);
  }

  async assertResponseReceived(): Promise<void> {
    // After sending, at least one message element should exist
    await expect(this.messages().first()).toBeVisible({ timeout: 60000 });
  }

  async assertInputEmpty(): Promise<void> {
    await expect(this.chatInput()).toBeEmpty();
  }

  async assertChatInputEditable(): Promise<void> {
    // After LLM stream, the input should be enabled (not readonly/disabled)
    await expect(this.chatInput()).toBeEnabled({ timeout: 30000 });
    await expect(this.chatInput()).not.toBeDisabled();
  }

  async assertSendButtonEnabled(): Promise<void> {
    // After LLM stream, the send button re-enables — wait up to 30s for it
    await expect(this.sendButton()).toBeEnabled({ timeout: 30000 });
  }

  async assertResponseContains(text: string): Promise<void> {
    const responseText = await this.getLastResponseText();
    expect(responseText.toLowerCase()).toContain(text.toLowerCase());
  }
}
