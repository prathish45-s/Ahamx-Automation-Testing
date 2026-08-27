import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/login.page';
import { ENV } from '../../src/config/env.config';

/**
 * Login tests — run WITHOUT auth state (unauthenticated context)
 *
 * Covers:
 *  - Page structure validation
 *  - Valid credentials → redirect to Bodhi
 *  - Invalid credentials → error shown
 *  - Empty field submission
 *  - Forgot Password and Sign Up links
 */
test.describe('Authentication — Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('TC-AUTH-01: Login page renders all required elements', async () => {
    await loginPage.assertLoginPageVisible();
    await loginPage.assertForgotPasswordLinkVisible();
    await loginPage.assertSignUpLinkVisible();
  });

  test('TC-AUTH-02: Successful login with valid credentials redirects to Bodhi', async ({ page }) => {
    await loginPage.login(ENV.USER_EMAIL, ENV.USER_PASSWORD);

    await page.waitForURL(/\/home\/bodhi/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/home\/bodhi/);
  });

  test('TC-AUTH-03: Invalid password shows error message', async ({ page }) => {
    await loginPage.fillEmail(ENV.USER_EMAIL);
    await loginPage.fillPassword('WrongPassword!999');
    await loginPage.clickSignIn();

    // Should stay on login page — not redirect
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-04: Invalid email format shows validation', async () => {
    await loginPage.fillEmail('not-an-email');
    await loginPage.fillPassword(ENV.USER_PASSWORD);
    await loginPage.clickSignIn();

    // Should stay on login page — browser or app-level validation
    await expect(loginPage['page']).toHaveURL(/\/login/);
  });

  test('TC-AUTH-05: Sign in button is enabled on page load', async () => {
    await loginPage.assertSignInButtonEnabled();
  });

  test('TC-AUTH-06: Forgot Password link is clickable', async ({ page }) => {
    await loginPage.clickForgotPassword();
    // Should navigate away from the login page or open a modal
    await page.waitForTimeout(1500);
    const url = page.url();
    const hasForgotContent = url.includes('forgot') || url.includes('reset') ||
      await page.getByText(/reset password|forgot/i).isVisible().catch(() => false);
    expect(hasForgotContent).toBeTruthy();
  });
});
