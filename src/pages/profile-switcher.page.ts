import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * ProfileSwitcherPage — handles the Chakra UI profile switching dropdown
 *
 * Flow (2-step):
 *   1. Click the trigger button (chakra-menu__trigger) → dropdown opens
 *   2. Click "Switch Profile" inside the dropdown → sub-panel opens
 *   3. Click the desired profile name button in the sub-panel
 *
 * DOM (from live inspection):
 *   - Trigger:       button.chakra-menu__trigger  (contains "IIT Madras" or "HM")
 *   - Switch Profile: button containing text "Switch Profile"
 *   - Student option: button containing p "Harshavardhan MG"
 *   - Entity option:  button containing p "IIT Madras" + p "Entity Account"
 */
export class ProfileSwitcherPage extends BasePage {
  // ─── Selectors ───────────────────────────────────────────────────────────────

  /** The top-right Chakra menu trigger (profile badge) */
  private readonly menuTrigger = () =>
    this.page.locator('button.chakra-menu__trigger, [class*="chakra-menu__trigger"]');

  /** "Switch Profile" button inside the first-level dropdown */
  private readonly switchProfileButton = () =>
    this.page.getByRole('button').filter({ hasText: /switch profile/i });

  /** The Switch Profile panel heading (appears after clicking Switch Profile) */
  private readonly switchProfileHeading = () =>
    this.page.getByText('Switch Profile', { exact: true });

  /** "Personal" section heading in the sub-panel */
  private readonly personalSection = () =>
    this.page.getByText(/personal/i);

  /** "Entity Accounts" section heading in the sub-panel */
  private readonly entitySection = () =>
    this.page.getByText(/entity accounts/i);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Step 1: Open the Chakra dropdown by clicking the profile trigger.
   */
  async openMenu(): Promise<void> {
    await this.menuTrigger().click();
    // Wait for the dropdown list to appear
    await this.page.waitForTimeout(500);
  }

  /**
   * Step 2: Click "Switch Profile" inside the opened dropdown.
   */
  async clickSwitchProfile(): Promise<void> {
    await this.switchProfileButton().click();
    // Wait for the sub-panel to animate in
    await this.page.waitForTimeout(500);
  }

  /**
   * Full flow: open menu → click Switch Profile → click target profile.
   * @param profileName The exact displayed name of the profile to switch to
   */
  async switchToProfile(profileName: string): Promise<void> {
    await this.openMenu();
    await this.clickSwitchProfile();

    // Click the profile option by its displayed name
    const profileButton = this.page.getByRole('button').filter({
      has: this.page.locator('p').filter({ hasText: profileName }),
    });
    await profileButton.first().click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1500); // Profile switch animation
  }

  /**
   * Switch to the Student (personal) profile.
   */
  async switchToStudentProfile(studentName: string): Promise<void> {
    await this.switchToProfile(studentName);
  }

  /**
   * Switch to the Entity (IIT Madras) profile.
   */
  async switchToEntityProfile(entityName: string): Promise<void> {
    await this.switchToProfile(entityName);
    // Entity profile should show STUDIO in sidebar
    await this.page.waitForSelector('text=STUDIO', { timeout: 15000 }).catch(() => {});
  }

  /**
   * Open the Switch Profile panel (for assertions).
   */
  async openSwitchProfile(): Promise<void> {
    await this.openMenu();
    await this.clickSwitchProfile();
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertSwitchProfilePanelVisible(): Promise<void> {
    await this.assertVisible(this.switchProfileHeading());
    await this.assertVisible(this.personalSection());
    await this.assertVisible(this.entitySection());
  }

  async assertCurrentProfileIs(name: string): Promise<void> {
    // The trigger button shows the current profile name
    await expect(this.menuTrigger().filter({ hasText: name })).toBeVisible({ timeout: 10000 });
  }
}
