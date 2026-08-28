import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

import { NavigationManager } from '../../src/utils/navigation-manager';

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
  test.beforeEach(async ({ sharedPage }) => {
    await NavigationManager.recoverState(sharedPage);
    await NavigationManager.ensureCourseLibrary(sharedPage);
  });

  test('TC-ENT-COURSE-01: Course Library page loads correctly', async ({ courseLibrary, sharedPage }) => {
    await courseLibrary.assertPageLoaded();
    await expect(sharedPage).toHaveURL(/course-library/i);
  });

  test('TC-ENT-COURSE-02: Course Library shows list of course cards', async ({ courseLibrary }) => {
    await courseLibrary.assertCourseCardsExist();
  });

  test('TC-ENT-COURSE-03: Search input filters course cards', async ({ courseLibrary, sharedPage }) => {
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
    await sharedPage.waitForTimeout(1000);
    
    // Verify at least one result is still visible
    const searchCount = await courseLibrary.getCourseCount();
    expect(searchCount).toBeGreaterThan(0);
    expect(searchCount).toBeLessThanOrEqual(initialCount);
  });

  test('TC-ENT-COURSE-04: "Create Course" button is visible', async ({ courseLibrary }) => {
    await courseLibrary.assertCreateCourseButtonVisible();
  });

  test('TC-ENT-COURSE-05: Course cards display management actions (edit/delete)', async ({ courseLibrary, sharedPage }) => {
    await courseLibrary.assertCourseCardsExist();
    
    // Check for edit and delete buttons on cards
    const editBtn = sharedPage.getByRole('button', { name: /edit course/i }).first();
    const deleteBtn = sharedPage.getByRole('button', { name: /delete course/i }).first();
    
    await expect(editBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();
  });

  test('TC-ENT-COURSE-06: Clearing search input restores the course list', async ({ courseLibrary, sharedPage }) => {
    await courseLibrary.assertCourseCardsExist();
    
    // Ensure search is clear from previous tests
    await courseLibrary.clearSearch();
    await sharedPage.waitForTimeout(1000); // debounce
    
    const initialCount = await courseLibrary.getCourseCount();
    
    const firstTitle = await courseLibrary.getFirstCourseTitle();
    if (!firstTitle) {
      test.skip(true, 'No courses found to search for.');
      return;
    }

    const query = firstTitle.substring(0, Math.min(firstTitle.length, 5));
    await courseLibrary.searchCourse(query);
    await sharedPage.waitForTimeout(1000); // debounce

    await courseLibrary.clearSearch();
    await sharedPage.waitForTimeout(1000); // debounce

    const restoredCount = await courseLibrary.getCourseCount();
    expect(restoredCount).toBe(initialCount);
  });

  test('TC-ENT-COURSE-07: Course library has functional tabs (My Courses, All Courses)', async ({ courseLibrary }) => {
    await courseLibrary.assertTabsVisible();
    await courseLibrary.clickAllCoursesTab();
    await courseLibrary.clickMyCoursesTab();
  });

  test('TC-ENT-COURSE-08: "Create Course" modal can be opened and cancelled', async ({ courseLibrary, sharedPage }) => {
    await courseLibrary.clickCreateCourse();
    
    // Look for a close button inside the dialog
    const dialog = sharedPage.getByRole('dialog');
    const closeBtn = dialog.getByRole('button', { name: /cancel/i }).or(dialog.getByLabel(/close/i));
    
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await sharedPage.keyboard.press('Escape');
    }
    
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });
});
