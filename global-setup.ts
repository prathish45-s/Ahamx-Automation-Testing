import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * global-setup.ts — runs ONCE before the entire test suite.
 *
 * Logs in with real credentials, saves browser cookies + localStorage
 * to .auth/user.json. All authenticated tests then load this state
 * instead of logging in again.
 *
 * This ensures:
 *   1. Zero repeated logins across the test suite
 *   2. Credentials exist only in .env — never in test code
 *   3. Auth state is re-used per test run for maximum speed
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  // Load .env relative to project root
  dotenv.config({ path: path.resolve(__dirname, '.env') });

  const { BASE_URL, USER_EMAIL, USER_PASSWORD } = process.env;

  if (!BASE_URL || !USER_EMAIL || !USER_PASSWORD) {
    throw new Error(
      '[global-setup] Missing required env vars: BASE_URL, USER_EMAIL, USER_PASSWORD. ' +
        'Copy .env.example to .env and fill in your credentials.'
    );
  }

  // Ensure .auth directory exists
  const authDir = path.resolve(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  console.log(`[global-setup] Logging in as ${USER_EMAIL} at ${BASE_URL}`);

  // Navigate to login page
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for login form to be ready
  await page.getByPlaceholder('Enter your email ID').waitFor({ state: 'visible', timeout: 15000 });

  // Fill credentials
  await page.getByPlaceholder('Enter your email ID').fill(USER_EMAIL);
  await page.getByPlaceholder('Enter your password').fill(USER_PASSWORD);

  // Click sign in and wait for either navigation or error
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for navigation — use waitForURL with networkidle fallback
  try {
    await page.waitForURL(/\/home\/bodhi/, { timeout: 30000, waitUntil: 'domcontentloaded' });
  } catch {
    // If first attempt fails, the page may show an error or need a retry
    console.log(`[global-setup] First login attempt timed out. Current URL: ${page.url()}`);

    // Check for any visible error message
    const errorText = await page.locator('[class*="error"], [class*="alert"], [role="alert"]')
      .first().textContent({ timeout: 2000 }).catch(() => null);
    if (errorText) {
      console.log(`[global-setup] Login error message: ${errorText}`);
    }

    // Retry login — clear and re-fill
    console.log('[global-setup] Retrying login...');
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByPlaceholder('Enter your email ID').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByPlaceholder('Enter your email ID').fill(USER_EMAIL);
    await page.getByPlaceholder('Enter your password').fill(USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Second attempt with longer timeout
    try {
      await page.waitForURL(/\/home\/bodhi/, { timeout: 60000, waitUntil: 'domcontentloaded' });
    } catch (error) {
      console.log('[global-setup] Second login attempt failed. Taking screenshot...');
      await page.screenshot({ path: 'login-failure-ci.png', fullPage: true });
      console.log('[global-setup] Screenshot saved as login-failure-ci.png');
      throw error;
    }
  }

  console.log(`[global-setup] Login successful. URL: ${page.url()}`);

  // Dismiss any onboarding tour that appears
  const doneBtn = page.getByRole('button', { name: /^done$/i });
  if (await doneBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await doneBtn.click();
  }

  // Save auth state to .auth/user.json
  const authStatePath = path.resolve(authDir, 'user.json');
  await context.storageState({ path: authStatePath });
  console.log(`[global-setup] Auth state saved to ${authStatePath}`);

  await browser.close();
}
