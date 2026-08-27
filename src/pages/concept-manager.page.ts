import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * ConceptManagerPage — Page Object Model for /home/bodhi/concept-library
 * Available only in Entity (IIT Madras) profile.
 *
 * Features:
 *   - Tab filter: "My Concepts" / "All Concepts"
 *   - Search input: "Search by Name or #Tag"
 *   - Add Concept button (top-right)
 *   - Concept cards with edit (✏) and delete (🗑) icons
 *   - Card info: title, description, updated date, publish status
 */
export class ConceptManagerPage extends BasePage {
  readonly url = '/home/bodhi/concept-library';

  // ─── Selectors ───────────────────────────────────────────────────────────────
  private readonly pageHeading = () => this.getByRole('heading', { name: 'Concept Manager' });
  private readonly addConceptButton = () => this.getByRole('button', { name: /add concept/i });
  private readonly searchInput = () => this.getByPlaceholder('Search by Name or #Tag');
  private readonly myConceptsTab = () => this.page.getByRole('button', { name: /my concepts/i }).or(this.page.getByText('My Concepts'));
  private readonly allConceptsTab = () => this.page.getByRole('button', { name: /all concepts/i }).or(this.page.getByText('All Concepts'));
  // Each concept card has both an "Edit concept" and "Delete concept" button.
  // We target the direct parent of the button row, then go up to the card root.
  private readonly conceptCards = () =>
    this.page.getByRole('button', { name: /edit concept/i });
  private readonly filterButton = () => this.page.locator('[aria-label*="filter"], button').filter({ has: this.page.locator('[class*="filter"]') });

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate(this.url);
    await this.page.waitForSelector('text=Concept Manager', { timeout: 10000 });
  }

  async clickMyConceptsTab(): Promise<void> {
    await this.myConceptsTab().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickAllConceptsTab(): Promise<void> {
    await this.allConceptsTab().click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchConcept(query: string): Promise<void> {
    await this.searchInput().fill(query);
    await this.page.waitForTimeout(500); // debounce
  }

  async clearSearch(): Promise<void> {
    await this.searchInput().clear();
    await this.page.waitForTimeout(300);
  }

  async clickAddConcept(): Promise<void> {
    await this.addConceptButton().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getConceptCardCount(): Promise<number> {
    // Wait for at least one edit button to appear (cards are lazily rendered)
    await this.page.getByRole('button', { name: /edit concept/i }).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return this.conceptCards().count();
  }

  async getFirstConceptTitle(): Promise<string> {
    // Concept titles are h3 elements on the page, not inside the edit button
    const titles = this.page.locator('h3').filter({ hasText: /\w{2,}/ });
    await titles.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return (await titles.first().textContent()) ?? '';
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertPageLoaded(): Promise<void> {
    await this.assertVisible(this.pageHeading());
    await this.assertVisible(this.searchInput());
    await this.assertVisible(this.addConceptButton());
  }

  async assertAddConceptModalVisible(): Promise<void> {
    const modalHeading = this.page.getByRole('heading', { name: /add concept|create concept|new concept/i });
    const nameInput = this.page.getByLabel(/name|title/i).first()
      .or(this.page.getByPlaceholder(/name|title/i).first());
    await expect(modalHeading.or(nameInput)).toBeVisible({ timeout: 10000 });
  }

  async assertTabsVisible(): Promise<void> {
    await this.assertVisible(this.myConceptsTab());
    await this.assertVisible(this.allConceptsTab());
  }

  async assertConceptCardsExist(): Promise<void> {
    const count = await this.getConceptCardCount();
    expect(count).toBeGreaterThan(0);
  }

  async assertSearchResults(query: string): Promise<void> {
    const cards = this.conceptCards();
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const text = (await cards.nth(i).textContent()) ?? '';
      expect(text.toLowerCase()).toContain(query.toLowerCase());
    }
  }
}
