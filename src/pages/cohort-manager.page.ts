import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * CohortManagerPage — Page Object Model for /home/bodhi/cohort-builder
 * Available only in Entity (IIT Madras) profile.
 *
 * Features:
 *   - Cohort list with status (Published/Draft) via icons
 *   - Search input: "Search Cohorts..."
 *   - Filter tabs: All Cohorts, Published, Draft
 *   - Create new cohort button
 *   - Cards with h3 title, description, course count, "Manage" action
 */
export class CohortManagerPage extends BasePage {
  readonly url = '/home/bodhi/cohort-builder';

  // ─── Selectors ───────────────────────────────────────────────────────────────
  private readonly pageHeading = () => this.getByRole('heading', { name: /cohort manager|cohorts/i });
  
  // Cohort cards: target h3 headings inside the cohort list (each card has an h3 title)
  private readonly cohortCardTitles = () =>
    this.page.locator('h3').filter({ hasText: /\w{2,}/ });
  
  // Full card containers: parent divs that contain h3 + "Manage" or course count
  private readonly cohortCards = () =>
    this.page.locator('div').filter({ has: this.page.locator('h3') }).filter({ hasText: /Manage|Course/i });

  private readonly createCohortButton = () =>
    this.getByRole('button', { name: /create|add cohort/i });
  
  private readonly searchInput = () => this.page.getByPlaceholder('Search Cohorts...');

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate(this.url);
    await this.page.waitForSelector('text=Cohort', { timeout: 10000 });
  }

  async getCohortCount(): Promise<number> {
    await this.cohortCardTitles().first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return this.cohortCardTitles().count();
  }

  async searchCohort(query: string): Promise<void> {
    const input = this.searchInput();
    if (await input.isVisible().catch(() => false)) {
      await input.fill(query);
      await this.page.waitForTimeout(500); // debounce
    }
  }

  async clickFirstCohort(): Promise<void> {
    // Click the "Manage" text/link inside the first cohort card
    const manageLink = this.page.getByText('Manage').first();
    if (await manageLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await manageLink.click();
    } else {
      // Fallback: click the first h3 title
      await this.cohortCardTitles().first().click();
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getFirstCohortTitle(): Promise<string> {
    await this.cohortCardTitles().first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return (await this.cohortCardTitles().first().textContent()) ?? '';
  }

  async assertSearchResults(query: string): Promise<void> {
    const titles = this.cohortCardTitles();
    const count = await titles.count();
    for (let i = 0; i < count; i++) {
      const text = (await titles.nth(i).textContent()) ?? '';
      expect(text.toLowerCase()).toContain(query.toLowerCase());
    }
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertPageLoaded(): Promise<void> {
    await this.assertVisible(this.pageHeading());
  }

  async assertCohortCardsExist(): Promise<void> {
    const count = await this.getCohortCount();
    expect(count).toBeGreaterThan(0);
  }
}
