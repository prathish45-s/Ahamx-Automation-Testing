import { Page } from '@playwright/test';
import { ENV } from '../config/env.config';

/**
 * LLM-aware wait helpers.
 *
 * Never use waitForTimeout() for LLM responses — streaming can take variable time.
 * Instead, poll for observable UI signals that indicate completion.
 */

/**
 * Helper to wait for LLM streaming response to complete.
 * Handles the "Stop generation" button and disabled input state.
 */
export async function waitForLLMResponse(page: Page): Promise<void> {
  // Wait for the "Stop generation" button to appear (may not appear for fast responses)
  const stopButton = page.getByRole('button', { name: /stop generation/i });
  await stopButton.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  // Wait for the "Stop generation" button to disappear (stream complete)
  await stopButton.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});

  // Poll until send button is enabled (up to 30s) — the button re-enables after streaming
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[aria-label="Send message"]') as HTMLButtonElement | null;
      return btn ? !btn.disabled : false;
    },
    { timeout: 30000 }
  ).catch(() => {});
}

/**
 * Wait for a network response that contains a specific URL pattern.
 * Useful for waiting for API data to load after navigation.
 */
export async function waitForApiResponse(page: Page, urlPattern: RegExp): Promise<void> {
  await page.waitForResponse(
    (response) => urlPattern.test(response.url()) && response.status() === 200,
    { timeout: ENV.DEFAULT_TIMEOUT }
  );
}

/**
 * Wait for a specific text to appear in the DOM (useful for dynamic content).
 */
export async function waitForText(page: Page, text: string): Promise<void> {
  await page.waitForSelector(`text=${text}`, { timeout: ENV.DEFAULT_TIMEOUT });
}

/**
 * Wait until the page has no pending network requests (network idle).
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: ENV.NAVIGATION_TIMEOUT });
}
