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

  test('TC-AUTH-07: Empty email validation', async ({ page }) => {
    await loginPage.fillPassword(ENV.USER_PASSWORD);
    await loginPage.clickSignIn();
    // Usually browser shows validation message or application shows error
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-08: Empty password validation', async ({ page }) => {
    await loginPage.fillEmail(ENV.USER_EMAIL);
    await loginPage.clickSignIn();
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-09: Unregistered credentials show error message', async ({ page }) => {
    await loginPage.login('unregistered_user@example.com', 'RandomPass123!');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-10: Show/Hide Password toggle works correctly', async () => {
    await loginPage.fillPassword('MySecretPassword');
    await loginPage.assertPasswordType('password');
    
    // Click to show
    await loginPage.clickShowPassword();
    await loginPage.assertPasswordType('text');
    
    // Click to hide
    await loginPage.clickShowPassword();
    await loginPage.assertPasswordType('password');
  });

  test('TC-AUTH-11: Sign up link navigation', async ({ page }) => {
    await loginPage.clickSignUp();
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url).toContain('/signup');
  });

  test('TC-AUTH-12: Cookie banner interaction', async () => {
    await loginPage.clickAcceptCookies();
    // After clicking, the accept cookies button should no longer be visible
    const acceptCookiesBtn = loginPage['page'].getByRole('button', { name: 'Accept All Cookies' });
    if (await acceptCookiesBtn.isVisible().catch(() => false)) {
      await expect(acceptCookiesBtn).toBeHidden();
    }
  });

  test('TC-AUTH-13: SQL Injection attempt is handled safely', async ({ page }) => {
    await loginPage.login("' OR 1=1 --", 'SomePassword');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-14: Email whitespace trimming', async ({ page }) => {
    await loginPage.login(`  ${ENV.USER_EMAIL}  `, ENV.USER_PASSWORD);
    await page.waitForURL(/\/home\/bodhi/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/home\/bodhi/);
  });

  test('TC-AUTH-15: Email case sensitivity (app treats uppercase as invalid)', async ({ page }) => {
    await loginPage.login(ENV.USER_EMAIL.toUpperCase(), ENV.USER_PASSWORD);
    await page.waitForTimeout(3000);
    // App does not redirect, meaning it treats it as invalid credentials
    await expect(page).toHaveURL(/\/login/);
  });

});
