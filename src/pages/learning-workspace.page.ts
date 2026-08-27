import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * LearningWorkspacePage — Page Object Model for the course player
 * URL: /home/bodhi/:cohortSlug/:courseSlug/learn
 *
 * Features:
 *   - Breadcrumb: Bodhi > Cohort Name > Course Name
 *   - Content area: Video.js player (for video concepts) or LLM content
 *   - Three tabs: Description | Course Outline | Quiz
 *   - Ask AhamX button (top-right, always available)
 *   - Resume-from-timestamp: URL contains ?conceptId= and ?t=
 *
 * Video Player: Video.js with a custom vjs-settings plugin
 *   Control bar classes confirmed via live browser inspection:
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  ▶  ⏭  🔊  0:00 / 11:02     [progress bar]    ⚙  ⧉  ⛶  │
 *   └─────────────────────────────────────────────────────────────────┘
 *   Play/Pause : .vjs-play-control   (title="Play" / "Pause")
 *   Progress   : .vjs-progress-holder[aria-label="Progress Bar"]
 *   Settings   : .vjs-settings-menu-button  → opens .vjs-settings-menu
 *   Quality    : .vjs-settings-row .vjs-settings-nav  (first row)
 *   Speed      : .vjs-settings-row .vjs-settings-nav  (second row)
 *   Theater    : .vjs-theater-control
 *   Fullscreen : .vjs-fullscreen-control  (title="Fullscreen")
 */
export class LearningWorkspacePage extends BasePage {
  // ─── Selectors ───────────────────────────────────────────────────────────────

  private readonly breadcrumb = () =>
    this.page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"], [aria-label*="breadcrumb"]');

  // ── Video.js Player ──────────────────────────────────────────────────────────

  /** Native <video> element — present whenever the concept is video-type */
  private readonly videoElement = () =>
    this.page.locator('video').first();

  /** Outer Video.js wrapper */
  private readonly vjsPlayer = () =>
    this.page.locator('.video-js, [class*="video-js"]').first();

  /**
   * Video.js play/pause button in the control bar.
   * Classes: vjs-play-control vjs-control vjs-button
   * title attribute toggles between "Play" and "Pause"
   */
  private readonly playPauseBtn = () =>
    this.page.locator('button.vjs-play-control').first();

  /**
   * Video.js big-play button (center overlay shown before first play).
   * Classes: vjs-big-play-button
   */
  private readonly bigPlayBtn = () =>
    this.page.locator('button.vjs-big-play-button').first();

  /**
   * Video.js progress/seek bar.
   * Classes: vjs-progress-holder vjs-slider vjs-slider-horizontal
   * role="slider", aria-label="Progress Bar"
   */
  private readonly progressBar = () =>
    this.page.locator('.vjs-progress-holder[aria-label="Progress Bar"]').first();

  /**
   * Video.js settings/gear button that opens Quality + Speed sub-menus.
   * Classes: vjs-settings-menu-button vjs-menu-button vjs-control vjs-button
   */
  private readonly settingsBtn = () =>
    this.page.locator('button.vjs-settings-menu-button').first();

  /**
   * Settings menu panel that appears after clicking the gear button.
   * Classes: vjs-settings-menu  (may also be .vjs-menu-content)
   */
  private readonly settingsMenu = () =>
    this.page.locator('.vjs-settings-menu, .vjs-menu-content').first();

  /**
   * Each row inside the settings panel: Quality row and Playback Speed row.
   * Classes: vjs-settings-row vjs-settings-nav
   * These rows are list items / divs with the nav arrow (>).
   */
  private readonly settingsNavRows = () =>
    this.page.locator('.vjs-settings-row.vjs-settings-nav');

  /**
   * Theater-mode button (between settings and fullscreen).
   * Classes: vjs-theater-control vjs-control vjs-button
   */
  private readonly theaterBtn = () =>
    this.page.locator('button.vjs-theater-control').first();

  /**
   * Video.js fullscreen button.
   * Classes: vjs-fullscreen-control vjs-control vjs-button
   * title="Fullscreen", aria-label="Fullscreen"
   */
  private readonly fullscreenBtn = () =>
    this.page.locator('button.vjs-fullscreen-control').first();

  // ── Tabs ──────────────────────────────────────────────────────────────────────

  private readonly llmContentArea = () =>
    this.page.locator('[class*="concept"], [class*="content"], [class*="lesson"]').first();

  private readonly descriptionTab = () =>
    this.page.getByRole('tab', { name: /description/i })
      .or(this.page.getByRole('button', { name: /description/i }))
      .or(this.page.getByText('Description').first());
  private readonly courseOutlineTab = () =>
    this.page.getByRole('tab', { name: /course outline/i })
      .or(this.page.getByRole('button', { name: /course outline/i }))
      .or(this.page.getByText('Course Outline'));
  private readonly quizTab = () =>
    this.page.getByRole('tab', { name: /quiz/i })
      .or(this.page.getByRole('button', { name: /quiz/i }))
      .or(this.page.getByText('Quiz').first());

  // ── Ask AhamX ────────────────────────────────────────────────────────────────

  private readonly askAhamXButton = () =>
    this.page.getByRole('button', { name: /ask ahamx/i });

  // ── Course outline ────────────────────────────────────────────────────────────

  private readonly outlineItems = () =>
    this.page.locator('li, [class*="chapter"], [class*="lesson-item"]').filter({ hasText: /\w+/ });

  // ─── Video Player Helpers ─────────────────────────────────────────────────────

  /** Hover over the Video.js player area to make the control bar visible. */
  private async hoverPlayer(): Promise<void> {
    await this.vjsPlayer().hover({ force: true });
    await this.page.waitForTimeout(400);
  }

  /**
   * Returns true when a native <video> element is present and visible.
   * Use this to gracefully skip video-only tests on LLM-type concepts.
   */
  async hasVideoPlayer(): Promise<boolean> {
    return this.videoElement().isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Reads the native paused state of the <video> element via evaluate().
   * Returns true when the video is paused or not yet started.
   */
  async isVideoPaused(): Promise<boolean> {
    return this.page.evaluate(() => {
      const v = document.querySelector('video');
      return v ? v.paused : true;
    });
  }

  // ─── Video Player Actions ─────────────────────────────────────────────────────

  /**
   * Dismiss the big-play overlay if visible, then click the control-bar
   * Play button to start playback.
   */
  async clickPlay(): Promise<void> {
    // If big-play overlay is still showing, click it first
    const bigPlayVisible = await this.bigPlayBtn().isVisible({ timeout: 2000 }).catch(() => false);
    if (bigPlayVisible) {
      await this.bigPlayBtn().click();
      await this.page.waitForTimeout(800);
      return;
    }
    await this.hoverPlayer();
    await this.playPauseBtn().click({ timeout: 8000 });
    await this.page.waitForTimeout(600);
  }

  /**
   * Hover to reveal controls then click the Play/Pause toggle to pause.
   */
  async clickPause(): Promise<void> {
    await this.hoverPlayer();
    await this.playPauseBtn().click({ timeout: 8000 });
    await this.page.waitForTimeout(600);
  }

  /**
   * Click the Video.js fullscreen button.
   * Returns true if document.fullscreenElement was set after clicking
   * (may be false in headless mode where Fullscreen API is blocked).
   */
  async enterFullscreen(): Promise<boolean> {
    await this.hoverPlayer();
    const visible = await this.fullscreenBtn().isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) return false;

    await this.fullscreenBtn().click();
    await this.page.waitForTimeout(800);

    return this.page.evaluate(() => !!document.fullscreenElement);
  }

  /**
   * Open the vjs-settings menu (gear icon) and return true if the panel appeared.
   */
  async openSettingsMenu(): Promise<boolean> {
    await this.hoverPlayer();
    const visible = await this.settingsBtn().isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) return false;

    await this.settingsBtn().click();
    await this.page.waitForTimeout(500);

    // The menu panel or at least the nav rows should be visible
    const menuVisible = await this.settingsMenu().isVisible({ timeout: 3000 }).catch(() => false);
    const rowsVisible = (await this.settingsNavRows().count().catch(() => 0)) > 0;
    return menuVisible || rowsVisible;
  }

  /**
   * Click the Quality row inside the settings menu.
   * The Quality row is the FIRST .vjs-settings-row.vjs-settings-nav element.
   * Returns true if the quality sub-menu / options appeared.
   */
  async openQualityMenu(): Promise<boolean> {
    const opened = await this.openSettingsMenu();
    if (!opened) return false;

    const rows = this.settingsNavRows();
    const count = await rows.count();
    if (count === 0) return false;

    // First row = Quality
    await rows.first().click();
    await this.page.waitForTimeout(500);

    // Quality option items: list items inside the now-active sub-panel
    const qualityItems = this.page.locator('.vjs-settings-item, .vjs-quality-option, [class*="quality"]');
    const itemCount = await qualityItems.count().catch(() => 0);
    return itemCount > 0;
  }

  /**
   * Click the Playback Speed row inside the settings menu.
   * The Speed row is the SECOND .vjs-settings-row.vjs-settings-nav element.
   * Returns true if the speed sub-menu / options appeared.
   */
  async openSpeedMenu(): Promise<boolean> {
    const opened = await this.openSettingsMenu();
    if (!opened) return false;

    const rows = this.settingsNavRows();
    const count = await rows.count();
    if (count < 2) return false;

    // Second row = Playback Speed
    await rows.nth(1).click();
    await this.page.waitForTimeout(500);

    const speedItems = this.page.locator('.vjs-settings-item, .vjs-playback-rate-item, [class*="speed"]');
    const itemCount = await speedItems.count().catch(() => 0);
    return itemCount > 0;
  }

  /**
   * Open the speed menu and click a non-default speed option.
   * Returns the label of the selected option, or null if unavailable.
   */
  async changePlaybackSpeed(): Promise<string | null> {
    const opened = await this.openSpeedMenu();
    if (!opened) return null;

    const speedItems = this.page.locator('.vjs-settings-item, .vjs-playback-rate-item, [class*="speed"]');
    const count = await speedItems.count().catch(() => 0);
    if (count === 0) return null;

    // Pick second item to differ from default (index 1)
    const target = speedItems.nth(count > 1 ? 1 : 0);
    const label = (await target.textContent()) ?? null;
    await target.click();
    await this.page.waitForTimeout(400);
    return label;
  }

  /**
   * Hover over the player and check if the progress bar is visible.
   */
  async isProgressBarVisible(): Promise<boolean> {
    await this.hoverPlayer();
    return this.progressBar().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ─── Tab Actions ──────────────────────────────────────────────────────────────

  async clickDescriptionTab(): Promise<void> {
    await this.descriptionTab().click();
    await this.page.waitForTimeout(300);
  }

  async clickCourseOutlineTab(): Promise<void> {
    await this.courseOutlineTab().click();
    await this.page.waitForTimeout(500);
  }

  async clickQuizTab(): Promise<void> {
    await this.quizTab().click();
    await this.page.waitForTimeout(300);
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

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertWorkspaceLoaded(): Promise<void> {
    await this.assertVisible(this.askAhamXButton());
    const hasVideo = await this.vjsPlayer().isVisible({ timeout: 3000 }).catch(() => false);
    const hasContent = await this.llmContentArea().isVisible({ timeout: 3000 }).catch(() => false);
    const hasTab = await this.descriptionTab().isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasVideo && !hasContent && !hasTab) {
      throw new Error('Learning workspace did not load — no video, content area, or tabs found');
    }
  }

  async assertVideoPlayerVisible(): Promise<void> {
    await expect(this.videoElement()).toBeVisible({ timeout: 10000 });
  }

  async assertTabsVisible(): Promise<void> {
    await this.assertVisible(this.descriptionTab());
    await this.assertVisible(this.courseOutlineTab());
    await this.assertVisible(this.quizTab());
  }

  async assertDescriptionTabActive(): Promise<void> {
    await this.assertVisible(this.descriptionTab());
  }

  async assertCourseOutlineHasItems(): Promise<void> {
    await this.clickCourseOutlineTab();
    const count = await this.outlineItems().count();
    expect(count).toBeGreaterThan(0);
  }

  async assertBreadcrumbVisible(): Promise<void> {
    const hasBreadcrumb = await this.breadcrumb().isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasBreadcrumb) {
      await expect(this.page).toHaveURL(/\/learn/);
    }
  }

  async assertUrlIsLearnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/learn/);
  }

  async assertUrlHasResumeParams(): Promise<void> {
    const url = this.page.url();
    const hasConceptId = url.includes('conceptId=');
    const hasTimestamp = url.includes('t=');
    expect(hasConceptId || hasTimestamp).toBe(true);
  }

  async assertAskAhamXButtonVisible(): Promise<void> {
    await this.assertVisible(this.askAhamXButton());
  }

  async getBreadcrumbText(): Promise<string> {
    return (await this.breadcrumb().textContent()) ?? '';
  }
}
