import { Page } from '@playwright/test';
import { ENV } from '../config/env.config';
import { ProfileSwitcherPage } from '../pages/profile-switcher.page';
import { BodhiDashboardPage } from '../pages/bodhi-dashboard.page';

/**
 * State-aware navigation manager.
 * 
 * Used to eliminate redundant UI navigation across tests that share a worker-scoped page.
 * It checks the current URL and DOM state, and only performs navigation if the browser
 * is not already at the desired state.
 */
export class NavigationManager {
  
  /**
   * Ensures the browser is on the Bodhi Dashboard under the Student Profile.
   */
  static async ensureStudentDashboard(page: Page): Promise<void> {
    const url = page.url();
    
    // Check if we are already on the dashboard
    if (url.includes('/home/bodhi') && !url.includes('/learn') && !url.match(/\/home\/bodhi\/.+/)) {
      // We might be on the dashboard. Let's ensure the profile is student.
      // But checking UI profile switcher is slow. If the URL is exactly /home/bodhi, 
      // we can assume the profile is correct if it was set in a previous test, 
      // BUT if we want to be safe, we can do a quick check.
      // For maximum efficiency, we'll assume the URL implies correct state unless proven otherwise,
      // but to be safe we'll do a quick verify.
      
      const dashboard = new BodhiDashboardPage(page);
      try {
        await dashboard.dismissTourIfPresent();
        // Quick check for something unique to student dashboard (e.g. Continue Learning)
        const isStudent = await page.getByText(/continue learning|my enrolled cohorts/i).first().isVisible({ timeout: 1000 }).catch(() => false);
        if (isStudent) {
          return; // State is perfectly intact
        }
      } catch {
        // Fallback to full navigation
      }
    }

    // Full navigation / recovery
    await page.goto('/home/bodhi', { waitUntil: 'domcontentloaded' });
    const dashboard = new BodhiDashboardPage(page);
    await dashboard.dismissTourIfPresent();
    
    const profileSwitcher = new ProfileSwitcherPage(page);
    try {
      await profileSwitcher.switchToStudentProfile(ENV.STUDENT_PROFILE_NAME);
    } catch {
      // Already in student profile or failed to switch, ignore
    }
    
    await page.goto('/home/bodhi', { waitUntil: 'domcontentloaded' });
    await dashboard.dismissTourIfPresent();
  }

  /**
   * Ensures the browser is on the Entity Dashboard (IIT Madras).
   */
  static async ensureEntityDashboard(page: Page): Promise<void> {
    const url = page.url();
    
    if (url.includes('/home/bodhi') && !url.includes('/learn') && !url.match(/\/home\/bodhi\/.+/)) {
      const dashboard = new BodhiDashboardPage(page);
      try {
        await dashboard.dismissTourIfPresent();
        // Quick check for entity dashboard (e.g. Entity Studio)
        const isEntity = await page.getByText(/entity studio/i).first().isVisible({ timeout: 1000 }).catch(() => false);
        if (isEntity) {
          return;
        }
      } catch {
        // Fallback to full navigation
      }
    }

    await page.goto('/home/bodhi', { waitUntil: 'domcontentloaded' });
    const dashboard = new BodhiDashboardPage(page);
    await dashboard.dismissTourIfPresent();
    
    const profileSwitcher = new ProfileSwitcherPage(page);
    try {
      await profileSwitcher.switchToEntityProfile(ENV.ENTITY_PROFILE_NAME);
    } catch {
      // Already in entity profile
    }
    
    await page.goto('/home/bodhi', { waitUntil: 'domcontentloaded' });
    await dashboard.dismissTourIfPresent();
  }

  /**
   * Recovers from any stuck modal or LLM chat by forcing a reload if necessary.
   * Called before ensuring state if we suspect the page might be dirty.
   */
  static async recoverState(page: Page): Promise<void> {
    // Check if there is an error toast, modal, or anything that blocks interaction
    const isBlocked = await page.locator('[role="dialog"], [class*="modal"], [class*="overlay"]').isVisible({ timeout: 500 }).catch(() => false);
    if (isBlocked) {
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }

  /**
   * Ensures the browser is on the Cohort Detail page.
   * Uses bodhiDashboard to navigate there if not already there.
   */
  static async ensureEnrolledCohortDetail(page: Page, index: number = 0): Promise<void> {
    const url = page.url();
    // If we are already on a cohort detail page (assuming it's the right one for this basic test)
    if (url.match(/\/home\/bodhi\/.+/) && !url.includes('/learn')) {
      return; // Already there
    }
    
    // Otherwise, go to dashboard and click it
    await this.ensureStudentDashboard(page);
    const bodhiDashboard = new BodhiDashboardPage(page);
    await bodhiDashboard.clickEnrolledCohortCard(index);
  }

  /**
   * Ensures the browser is in the Learning Workspace (Course Player)
   * navigating from the "Continue Learning" section on the dashboard.
   */
  static async ensureCoursePlayerFromContinueLearning(page: Page): Promise<string> {
    const url = page.url();
    if (url.includes('/learn')) {
      return url; // Already there
    }

    await this.ensureStudentDashboard(page);
    const bodhiDashboard = new BodhiDashboardPage(page);
    const links = bodhiDashboard.getContinueLearningLearnLinks();
    await links.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    const learnUrl = (await links.first().getAttribute('href')) ?? '';
    if (learnUrl) {
      await page.goto(learnUrl, { waitUntil: 'domcontentloaded' });
    }
    return learnUrl;
  }

  /**
   * Ensures the browser is on the Cohort Manager page in Entity profile.
   */
  static async ensureCohortManager(page: Page): Promise<void> {
    const url = page.url();
    if (url.match(/cohort-builder|cohort/i) && !url.match(/\/home\/bodhi\/.+/)) {
      return; // Likely already there
    }

    await this.ensureEntityDashboard(page);
    const bodhiDashboard = new BodhiDashboardPage(page);
    await bodhiDashboard.clickCohortManager();
  }

  /**
   * Ensures the browser is on the Concept Library page in Entity profile.
   */
  static async ensureConceptLibrary(page: Page): Promise<void> {
    const url = page.url();
    if (url.match(/concept-library/i)) {
      return; // Already there
    }

    await this.ensureEntityDashboard(page);
    const bodhiDashboard = new BodhiDashboardPage(page);
    await bodhiDashboard.clickConceptManager(); // This links to Concept Library
  }

  /**
   * Ensures the browser is on the Course Library page in Entity profile.
   */
  static async ensureCourseLibrary(page: Page): Promise<void> {
    const url = page.url();
    if (url.match(/course-library/i)) {
      return; // Already there
    }

    await this.ensureEntityDashboard(page);
    const bodhiDashboard = new BodhiDashboardPage(page);
    await bodhiDashboard.clickCourseLibrary();
  }
}
