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
 *
 * Usage in spec files:
 *   import { test } from '@fixtures/authenticated.fixture';
 *   test('...', async ({ bodhiDashboard, chatPage }) => { ... });
 */
export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  bodhiDashboard: async ({ page }, use) => {
    await use(new BodhiDashboardPage(page));
  },
  profileSwitcher: async ({ page }, use) => {
    await use(new ProfileSwitcherPage(page));
  },
  chatPage: async ({ page }, use) => {
    await use(new AskAhamXChatPage(page));
  },
  conceptManager: async ({ page }, use) => {
    await use(new ConceptManagerPage(page));
  },
  courseLibrary: async ({ page }, use) => {
    await use(new CourseLibraryPage(page));
  },
  cohortManager: async ({ page }, use) => {
    await use(new CohortManagerPage(page));
  },
  cohortDetail: async ({ page }, use) => {
    await use(new CohortDetailPage(page));
  },
  learningWorkspace: async ({ page }, use) => {
    await use(new LearningWorkspacePage(page));
  },
});

export { expect } from '@playwright/test';
