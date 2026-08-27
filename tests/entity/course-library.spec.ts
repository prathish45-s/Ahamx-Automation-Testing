import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

/**
 * Entity Profile (IIT Madras) — Course Library Tests
 *
 * Tests the Course Library features while avoiding creation of new courses
 * to prevent polluting the database.
 * Focuses on: Navigation, Rendering, Searching/Filtering, and Modal interactions.
 *
 * Project: entity
 */
test.describe('Entity Profile — Course Library', () => {
  test.beforeEach(async ({ page, bodhiDashboard, profileSwitcher }) => {
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
    try {
      await profileSwitcher.switchToEntityProfile(ENV.ENTITY_PROFILE_NAME);
    } catch {
      // Already in entity profile
    }
    await bodhiDashboard.goto();
    await bodhiDashboard.dismissTourIfPresent();
  });

  test('TC-ENT-COURSE-01: Course Library page loads correctly', async ({ bodhiDashboard, courseLibrary, page }) => {
    await bodhiDashboard.clickCourseLibrary();
    await courseLibrary.assertPageLoaded();
    await expect(page).toHaveURL(/course-library/i);
  });

  test('TC-ENT-COURSE-02: Course Library shows list of course cards', async ({ bodhiDashboard, courseLibrary }) => {
    await bodhiDashboard.clickCourseLibrary();
    await courseLibrary.assertCourseCardsExist();
  });

  test('TC-ENT-COURSE-03: Search input filters course cards', async ({ bodhiDashboard, courseLibrary, page }) => {
    await bodhiDashboard.clickCourseLibrary();
    await courseLibrary.assertCourseCardsExist();
    const initialCount = await courseLibrary.getCourseCount();
    
    // Pick the first course's title to search for
    const firstTitle = await courseLibrary.getFirstCourseTitle();
    if (!firstTitle) {
      test.skip(true, 'No courses found to search for.');
      return;
    }

    // Search for a portion of the title
    const query = firstTitle.substring(0, Math.min(firstTitle.length, 5));
    await courseLibrary.searchCourse(query);
    
    // Wait for search results to update
    await page.waitForTimeout(1000);
    
    // Verify at least one result is still visible
    const searchCount = await courseLibrary.getCourseCount();
    expect(searchCount).toBeGreaterThan(0);
    expect(searchCount).toBeLessThanOrEqual(initialCount);
  });

  test('TC-ENT-COURSE-04: "Create Course" button is visible', async ({ bodhiDashboard, courseLibrary }) => {
    await bodhiDashboard.clickCourseLibrary();
    await courseLibrary.assertCreateCourseButtonVisible();
  });

  test('TC-ENT-COURSE-05: Course cards display management actions (edit/delete)', async ({ bodhiDashboard, courseLibrary, page }) => {
    await bodhiDashboard.clickCourseLibrary();
    await courseLibrary.assertCourseCardsExist();
    
    // Check for edit and delete buttons on cards
    const editBtn = page.getByRole('button', { name: /edit course/i }).first();
    const deleteBtn = page.getByRole('button', { name: /delete course/i }).first();
    
    await expect(editBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();
  });
});
