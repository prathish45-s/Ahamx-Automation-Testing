import { test as base, Page } from '@playwright/test';
import { ENV } from '../config/env.config';
import { LoginPage } from '../pages/login.page';
import { BodhiDashboardPage } from '../pages/bodhi-dashboard.page';
import { ProfileSwitcherPage } from '../pages/profile-switcher.page';
import { AskAhamXChatPage } from '../pages/ask-ahamx-chat.page';
import { ConceptManagerPage } from '../pages/concept-manager.page';
import { CourseLibraryPage } from '../pages/course-library.page';
import { CohortManagerPage } from '../pages/cohort-manager.page';
import { CohortDetailPage } from '../pages/cohort-detail.page';
import { LearningWorkspacePage } from '../pages/learning-workspace.page';

/**
 * All Page Object instances bundled together.
 * Extended test fixtures inject these into every test function.
 */
export type PageObjects = {
  sharedPage: Page;
  loginPage: LoginPage;
  bodhiDashboard: BodhiDashboardPage;
  profileSwitcher: ProfileSwitcherPage;
  chatPage: AskAhamXChatPage;
  conceptManager: ConceptManagerPage;
  courseLibrary: CourseLibraryPage;
  cohortManager: CohortManagerPage;
  cohortDetail: CohortDetailPage;
  learningWorkspace: LearningWorkspacePage;
};

/**
 * `test` extended with all Page Objects injected automatically.
 * Uses a worker-scoped `sharedPage` for optimized state reuse.
 */
export const test = base.extend<PageObjects, { sharedPage: Page }>({
  // Worker-scoped page fixture: opens once per worker, stays open across tests
  sharedPage: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await page.close();
    await context.close();
  }, { scope: 'worker' }],

  // Note: we pass `sharedPage` instead of the default test-scoped `page` to the POMs
  loginPage: async ({ sharedPage }, use) => {
    await use(new LoginPage(sharedPage));
  },
  bodhiDashboard: async ({ sharedPage }, use) => {
    await use(new BodhiDashboardPage(sharedPage));
  },
  profileSwitcher: async ({ sharedPage }, use) => {
    await use(new ProfileSwitcherPage(sharedPage));
  },
  chatPage: async ({ sharedPage }, use) => {
    await use(new AskAhamXChatPage(sharedPage));
  },
  conceptManager: async ({ sharedPage }, use) => {
    await use(new ConceptManagerPage(sharedPage));
  },
  courseLibrary: async ({ sharedPage }, use) => {
    await use(new CourseLibraryPage(sharedPage));
  },
  cohortManager: async ({ sharedPage }, use) => {
    await use(new CohortManagerPage(sharedPage));
  },
  cohortDetail: async ({ sharedPage }, use) => {
    await use(new CohortDetailPage(sharedPage));
  },
  learningWorkspace: async ({ sharedPage }, use) => {
    await use(new LearningWorkspacePage(sharedPage));
  },
});

export { expect } from '@playwright/test';
