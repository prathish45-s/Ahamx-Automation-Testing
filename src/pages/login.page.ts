import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * LoginPage — Page Object Model for /login
 *
 * Selectors discovered from DOM exploration:
 *   - Email input: placeholder "Enter your email ID"
 *   - Password input: placeholder "Enter your password"
 *   - Sign in button: role=button name="Sign in"
 *   - Forgot password: role=link name="Forgot Password?"
 *   - Sign up link: role=link name="Sign Up"
 *
 * Note: The "Sign in" heading uses styled text (not a semantic <h1> role).
 * Use text-based locators for reliability.
 */
export class LoginPage extends BasePage {
  // ─── Selectors ───────────────────────────────────────────────────────────────
  private readonly emailInput = () => this.getByPlaceholder('Enter your email ID');
  private readonly passwordInput = () => this.getByPlaceholder('Enter your password');
  private readonly signInButton = () => this.getByRole('button', { name: 'Sign in' });
  private readonly forgotPasswordLink = () => this.getByRole('link', { name: 'Forgot Password?' });
  private readonly signUpLink = () => this.page.locator('text=Sign Up').last();
  // "Sign in" is rendered as styled text, not a semantic <h1> — use text matcher
  private readonly signInHeading = () => this.page.locator('h1, h2').filter({ hasText: /^sign in$/i }).or(this.getByText('Sign in').first());
  private readonly infoMessage = () =>
    this.getByText(/please sign in to continue/i);
  private readonly errorMessage = () =>
    this.page.locator('[class*="error"], [class*="alert"], [role="alert"]');

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/login');
    // Wait for the email input to be visible — more reliable than heading role
    await this.emailInput().waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput().fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput().fill(password);
  }

  async clickSignIn(): Promise<void> {
    await this.signInButton().click();
  }

  /**
   * Full login flow — fills credentials and submits.
   * Does NOT assert the post-login state; callers handle that.
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink().click();
  }

  async clickSignUp(): Promise<void> {
    await this.signUpLink().click();
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertLoginPageVisible(): Promise<void> {
    await this.assertVisible(this.emailInput());
    await this.assertVisible(this.passwordInput());
    await this.assertVisible(this.signInButton());
    // Verify we are NOT on the dashboard (i.e., actually on login page)
    await expect(this.page).toHaveURL(/\/login/);
  }

  async assertEmailFieldEmpty(): Promise<void> {
    await expect(this.emailInput()).toBeEmpty();
  }

  async assertPasswordFieldEmpty(): Promise<void> {
    await expect(this.passwordInput()).toBeEmpty();
  }

  async assertSignInButtonEnabled(): Promise<void> {
    await this.assertEnabled(this.signInButton());
  }

  async assertErrorMessageVisible(): Promise<void> {
    await this.assertVisible(this.errorMessage());
  }

  async assertInfoMessageVisible(): Promise<void> {
    await this.assertVisible(this.infoMessage());
  }

  async assertForgotPasswordLinkVisible(): Promise<void> {
    await this.assertVisible(this.forgotPasswordLink());
  }

  async assertSignUpLinkVisible(): Promise<void> {
    await this.assertVisible(this.signUpLink());
  }
}
