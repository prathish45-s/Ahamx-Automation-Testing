import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * CourseLibraryPage — Page Object Model for /home/bodhi/course-library
 * Available only in Entity (IIT Madras) profile.
 *
 * Features:
 *   - Course list with h3 titles
 *   - Search input: "Search by Name or #Tag"
 *   - Tab filters: My Courses, All Courses
 *   - "Create Course" button (not "Add Course")
 *   - Cards with edit/delete actions (aria-label='Edit course', 'Delete course')
 */
export class CourseLibraryPage extends BasePage {
  readonly url = '/home/bodhi/course-library';

  // ─── Selectors ───────────────────────────────────────────────────────────────
  private readonly pageHeading = () => this.getByRole('heading', { name: /course library/i });
  
  // Course cards identified by their edit button (most reliable)
  private readonly courseCardEditButtons = () =>
    this.page.getByRole('button', { name: /edit course/i });
  
  // Course card titles (h3 inside each card)
  private readonly courseCardTitles = () =>
    this.page.locator('h3').filter({ hasText: /\w{2,}/ });

  private readonly searchInput = () => this.page.getByPlaceholder('Search by Name or #Tag');
  
  // Button is labeled "Create Course" not "Add Course"
  private readonly createCourseButton = () =>
    this.page.getByRole('button', { name: /create course/i });

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate(this.url);
    await this.page.waitForSelector('text=Course Library', { timeout: 10000 });
  }

  async getCourseCount(): Promise<number> {
    await this.courseCardEditButtons().first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return this.courseCardEditButtons().count();
  }

  async searchCourse(query: string): Promise<void> {
    await this.searchInput().fill(query);
    await this.page.waitForTimeout(500); // debounce
  }

  async clickCreateCourse(): Promise<void> {
    await this.createCourseButton().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getFirstCourseTitle(): Promise<string> {
    await this.courseCardTitles().first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return (await this.courseCardTitles().first().textContent()) ?? '';
  }

  async assertSearchResults(query: string): Promise<void> {
    const titles = this.courseCardTitles();
    await titles.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
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

  async assertCourseCardsExist(): Promise<void> {
    const count = await this.getCourseCount();
    expect(count).toBeGreaterThan(0);
  }

  async assertCreateCourseButtonVisible(): Promise<void> {
    await this.assertVisible(this.createCourseButton());
  }
}
