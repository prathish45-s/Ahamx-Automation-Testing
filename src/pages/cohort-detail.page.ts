import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * CohortDetailPage — Page Object Model for cohort detail pages
 * URL pattern: /home/bodhi/:cohortSlug
 *
 * Shared by Student and Entity profiles.
 *
 * Student view shows:
 *   - Cohort title, description
 *   - List of courses (with Start/Continue Learning CTA per course)
 *   - Cohort-level CTA button
 *
 * Entity view shows:
 *   - Published badge, capacity, managed-by info
 *   - Course list with management actions
 */
export class CohortDetailPage extends BasePage {
  // ─── Selectors ───────────────────────────────────────────────────────────────

  private readonly cohortTitle = () =>
    this.page.locator('h1, h2').filter({ hasNotText: /bodhi|dashboard/i }).first();
  private readonly cohortDescription = () =>
    this.page.locator('p, [class*="description"]').filter({ hasText: /\w{10,}/ }).first();
  private readonly startLearningCTA = () =>
    this.page.getByRole('button', { name: /start learning|continue learning/i }).first();
  private readonly publishedBadge = () => this.page.getByText('Published');

  // Metadata details
  private readonly authorLabel = () => this.page.getByText(/By:/i).first();
  private readonly publishedDateLabel = () => this.page.getByText(/Published On:/i).first();
  
  // Tabs
  private readonly coursesTab = () => this.page.locator('div').filter({ hasText: /^Courses \(\d+\)$/ }).first();
  private readonly channelsTab = () => this.page.locator('div').filter({ hasText: /^Channels \(\d+\)$/ }).first();

  // Course items: links or buttons that navigate into a course player
  private readonly courseLinks = () =>
    this.page.locator('a[href*="/learn"]');
  private readonly courseCards = () =>
    this.page.locator('div, article').filter({ has: this.page.locator('a[href*="/learn"]') });

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  async clickFirstCourse(): Promise<string> {
    const link = this.courseLinks().first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    const href = (await link.getAttribute('href')) ?? '';
    
    // Instead of clicking which can fail due to React re-renders ("detached from DOM"),
    // navigate directly to the href if available.
    if (href) {
      await this.page.goto(href);
    } else {
      // Fallback
      await link.click({ force: true });
    }
    
    await this.page.waitForLoadState('domcontentloaded');
    return href;
  }

  async clickStartLearning(): Promise<void> {
    await this.startLearningCTA().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertCohortTitleVisible(): Promise<void> {
    await this.assertVisible(this.cohortTitle());
  }

  async assertCourseLinksExist(): Promise<void> {
    // Wait for course links to appear (page may lazy-load)
    await this.courseLinks().first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const count = await this.courseLinks().count();
    expect(count).toBeGreaterThan(0);
  }

  async getCourseCount(): Promise<number> {
    await this.courseLinks().first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return this.courseLinks().count();
  }

  async assertStartLearningVisible(): Promise<void> {
    await this.assertVisible(this.startLearningCTA());
  }

  async assertPublishedBadgeVisible(): Promise<void> {
    await this.assertVisible(this.publishedBadge());
  }

  async assertMetadataVisible(): Promise<void> {
    await this.assertVisible(this.authorLabel());
    await this.assertVisible(this.publishedDateLabel());
  }

  async assertTabsVisible(): Promise<void> {
    await this.assertVisible(this.coursesTab());
    await this.assertVisible(this.channelsTab());
  }

  async assertUrlContainsCohortSlug(): Promise<void> {
    await expect(this.page).toHaveURL(/\/home\/bodhi\/.+/);
  }
}
