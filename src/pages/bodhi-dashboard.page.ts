import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * BodhiDashboardPage — Page Object Model for /home/bodhi
 *
 * Two profiles share this page with different content:
 *
 * Student profile sections:
 *   - Stats: Total Available Cohorts, Enrolled Cohorts, Completed Courses, Time spent
 *   - Continue Learning (course cards with resume links)
 *   - My Enrolled Cohorts (carousel)
 *   - Recommended Cohorts (carousel)
 *
 * Entity (IIT Madras) profile sections:
 *   - Stats: Total Available Cohorts, Enrolled Users, Courses, Learning Time
 *   - Cohorts (list of managed cohorts)
 *   - Studio sidebar: Concept Manager, Course Library, Cohort Manager
 */
export class BodhiDashboardPage extends BasePage {
  readonly url = '/home/bodhi';

  // ─── Selectors ───────────────────────────────────────────────────────────────

  // Header
  private readonly pageTitle = () => this.getByRole('heading', { name: 'Bodhi' });
  private readonly pageSubtitle = () => this.getByText('Next Level AI Learning Platform');

  // Stats cards (shared — just read the number + label pair)
  private readonly statCards = () => this.page.locator('[class*="stat"], [class*="card"]');

  // ── Student: Continue Learning ───────────────────────────────────────────────
  private readonly continueLearningSection = () =>
    this.getByRole('heading', { name: 'Continue Learning' });
  private readonly continueLearningRow = () =>
    this.page.locator('div').filter({ has: this.page.getByRole('heading', { name: 'Continue Learning' }) }).first();
  private readonly scrollRightContinueLearning = () =>
    this.continueLearningRow().getByRole('button', { name: /scroll right/i });

  // ── Student: My Enrolled Cohorts ─────────────────────────────────────────────
  private readonly enrolledCohortsSection = () =>
    this.getByRole('heading', { name: 'My Enrolled Cohorts' });
  private readonly enrolledCohortCards = () =>
    this.page.getByRole('button', { name: /view cohort:/i });
  private readonly enrolledCohortsRow = () =>
    this.page.locator('div').filter({ has: this.page.getByRole('heading', { name: 'My Enrolled Cohorts' }) }).first();
  private readonly scrollRightEnrolledCohorts = () =>
    this.enrolledCohortsRow().getByRole('button', { name: /scroll right/i });

  // ── Student: Recommended Cohorts ─────────────────────────────────────────────
  private readonly recommendedCohortsSection = () =>
    this.getByRole('heading', { name: 'Recommended Cohorts' });
  private readonly recommendedCohortCards = () =>
    this.page.locator('div').filter({ has: this.page.getByRole('heading', { name: 'Recommended Cohorts' }) }).first()
      .getByRole('button', { name: /view cohort:/i });

  // ── Entity: Cohorts list ──────────────────────────────────────────────────────
  private readonly cohortsSection = () => this.getByRole('heading', { name: 'Cohorts' });
  private readonly cohortCards = () =>
    this.page.getByRole('button', { name: /view cohort/i });

  // ── Sidebar navigation ────────────────────────────────────────────────────────
  private readonly cohortsCenterLink = () => this.page.locator('a[href="/home/bodhi"]').first();
  private readonly conceptManagerLink = () => this.page.locator('a[href="/home/bodhi/concept-library"]').first();
  private readonly courseLibraryLink = () => this.page.locator('a[href="/home/bodhi/course-library"]').first();
  private readonly cohortManagerLink = () => this.page.locator('a[href="/home/bodhi/cohort-builder"]').first();

  // ── Ask AhamX ─────────────────────────────────────────────────────────────────
  private readonly askAhamXButton = () => this.page.getByRole('button', { name: /ask ahamx/i });

  // ─── Core Actions ─────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate(this.url);
    await this.dismissTourIfPresent();
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  async clickCohortsCenter(): Promise<void> {
    await this.cohortsCenterLink().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickConceptManager(): Promise<void> {
    await this.conceptManagerLink().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickCourseLibrary(): Promise<void> {
    await this.courseLibraryLink().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickCohortManager(): Promise<void> {
    await this.cohortManagerLink().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openAskAhamX(): Promise<void> {
    await this.askAhamXButton().click();
    await this.page.waitForSelector(
      'input[placeholder="Ask me anything..."], textarea[placeholder="Ask me anything..."]',
      { timeout: 8000 }
    ).catch(async () => {
      await this.page.waitForSelector('text=Ask me anything', { timeout: 5000 });
    });
  }

  async clickFirstCohortCard(): Promise<void> {
    await this.cohortCards().first().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ─── Continue Learning Actions ────────────────────────────────────────────────

  /** All /learn links on the dashboard — used for "Start Learning" buttons */
  getContinueLearningLearnLinks() {
    return this.page.locator('a[href*="/learn"]');
  }

  /**
   * Scans every /learn link visible on the student dashboard and returns the
   * href of the first one that contains a native <video> element.
   *
   * Strategy:
   *   1. Collect all href values from `a[href*="/learn"]` on the current page.
   *   2. Open each URL in the same tab, wait for domcontentloaded.
   *   3. Check document.querySelector('video') via evaluate().
   *   4. Return the first matching URL, or '' if none found.
   *
   * @param maxLinks - cap how many links to probe (default 10) to avoid long waits
   */
  async findVideoLearnUrl(maxLinks = 10): Promise<string> {
    const links = this.getContinueLearningLearnLinks();
    await links.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    const hrefs: string[] = [];
    const count = Math.min(await links.count(), maxLinks);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href').catch(() => null);
      if (href && !hrefs.includes(href)) hrefs.push(href);
    }

    const baseUrl = this.page.url().replace(/\/home\/bodhi.*$/, '');

    for (const href of hrefs) {
      const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
      try {
        await this.page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        // Give the player a moment to mount
        await this.page.waitForTimeout(1500);
        const hasVideo = await this.page.evaluate(
          () => !!document.querySelector('video')
        );
        if (hasVideo) {
          // Navigate back to dashboard to leave page in a clean state
          await this.navigate(this.url);
          return fullUrl;
        }
      } catch {
        // Network/navigation error for this link — try the next one
      }
    }

    // No video concept found — navigate back to dashboard
    await this.navigate(this.url).catch(() => {});
    return '';
  }

  /**
   * Clicks the "Start Learning" button on the first Continue Learning card.
   * Returns the href of the learn link for URL assertions.
   */
  async clickFirstContinueLearningCard(): Promise<string> {
    const links = this.getContinueLearningLearnLinks();
    await links.first().waitFor({ state: 'visible', timeout: 10000 });
    const href = (await links.first().getAttribute('href')) ?? '';
    // The button is inside the same card as the link
    const card = links.first().locator('xpath=ancestor::div[.//p[text()="Continue Learning"]]').last();
    const btn = card.getByRole('button', { name: /start learning/i });
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
    } else {
      await links.first().click();
    }
    await this.page.waitForLoadState('domcontentloaded');
    return href;
  }

  async getContinueLearningCardCount(): Promise<number> {
    // Each card has a "Continue Learning" paragraph label
    const labels = this.page.getByText('Continue Learning', { exact: true });
    await labels.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return labels.count();
  }

  async scrollContinueLearningRight(): Promise<void> {
    const btn = this.scrollRightContinueLearning();
    const isEnabled = await btn.isEnabled({ timeout: 3000 }).catch(() => false);
    if (isEnabled) {
      await btn.click();
      await this.page.waitForTimeout(400);
    }
  }

  // ─── Enrolled Cohorts Actions ─────────────────────────────────────────────────

  async getEnrolledCohortCardCount(): Promise<number> {
    await this.enrolledCohortsSection().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return this.enrolledCohortCards().count();
  }

  async clickEnrolledCohortCard(index = 0): Promise<void> {
    await this.enrolledCohortCards().nth(index).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async scrollEnrolledCohortsRight(): Promise<void> {
    const btn = this.scrollRightEnrolledCohorts();
    const isEnabled = await btn.isEnabled({ timeout: 3000 }).catch(() => false);
    if (isEnabled) {
      await btn.click();
      await this.page.waitForTimeout(400);
    }
  }

  // ─── Recommended Cohorts Actions ──────────────────────────────────────────────

  async getRecommendedCohortCardCount(): Promise<number> {
    await this.recommendedCohortsSection().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return this.recommendedCohortCards().count();
  }

  async clickRecommendedCohortCard(index = 0): Promise<void> {
    await this.recommendedCohortCards().nth(index).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ─── Assertions ───────────────────────────────────────────────────────────────

  async assertPageLoaded(): Promise<void> {
    await this.assertVisible(this.pageTitle());
    await this.assertVisible(this.pageSubtitle());
  }

  async assertStatCardExists(label: string): Promise<void> {
    await expect(this.page.getByText(label, { exact: true })).toBeVisible();
  }

  /** Student profile stats */
  async assertStudentStats(): Promise<void> {
    await this.assertStatCardExists('Total Available Cohorts');
    await this.assertStatCardExists('Enrolled Cohorts');
    await this.assertStatCardExists('Completed Courses');
    await this.assertStatCardExists('Time spent');
  }

  /** Entity profile stats */
  async assertEntityStats(): Promise<void> {
    await this.assertStatCardExists('Total Available Cohorts');
    await this.assertStatCardExists('Enrolled Users');
    await this.assertStatCardExists('Courses');
    await this.assertStatCardExists('Learning Time');
  }

  async assertContinueLearningVisible(): Promise<void> {
    await this.assertVisible(this.continueLearningSection());
  }

  async assertContinueLearningCardsExist(): Promise<void> {
    const count = await this.getContinueLearningCardCount();
    expect(count).toBeGreaterThan(0);
  }

  async assertEnrolledCohortsVisible(): Promise<void> {
    await this.assertVisible(this.enrolledCohortsSection());
  }

  async assertEnrolledCohortCardsExist(): Promise<void> {
    const count = await this.getEnrolledCohortCardCount();
    expect(count).toBeGreaterThan(0);
  }

  async assertRecommendedCohortsVisible(): Promise<void> {
    await this.assertVisible(this.recommendedCohortsSection());
  }

  async assertRecommendedCohortCardsExist(): Promise<void> {
    const count = await this.getRecommendedCohortCardCount();
    expect(count).toBeGreaterThan(0);
  }

  async assertCohortsVisible(): Promise<void> {
    await this.assertVisible(this.cohortsSection());
  }

  async assertSidebarLinksVisible(): Promise<void> {
    await this.assertVisible(this.cohortsCenterLink());
  }

  async assertEntitySidebarVisible(): Promise<void> {
    await this.assertVisible(this.conceptManagerLink());
    await this.assertVisible(this.courseLibraryLink());
    await this.assertVisible(this.cohortManagerLink());
  }

  async assertAskAhamXButtonVisible(): Promise<void> {
    await this.assertVisible(this.askAhamXButton());
  }

  async getCohortCount(): Promise<number> {
    return this.cohortCards().count();
  }
}
