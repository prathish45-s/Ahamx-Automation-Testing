import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

import { NavigationManager } from '../../src/utils/navigation-manager';

/**
 * Entity Profile (IIT Madras) — Concept Library Tests
 *
 * Tests the Concept Manager features while avoiding creation of new concepts
 * to prevent polluting the database.
 * Focuses on: Navigation, Rendering, Searching/Filtering, and Modal interactions.
 *
 * Project: entity
 */
test.describe('Entity Profile — Concept Library', () => {
  test.beforeEach(async ({ sharedPage }) => {
    await NavigationManager.recoverState(sharedPage);
    await NavigationManager.ensureConceptLibrary(sharedPage);
  });

  test('TC-ENT-CL-01: Concept Manager page loads correctly', async ({ conceptManager, sharedPage }) => {
    await conceptManager.assertPageLoaded();
    await expect(sharedPage).toHaveURL(/concept-library/i);
  });

  test('TC-ENT-CL-02: Tabs "My Concepts" and "All Concepts" are visible and clickable', async ({ conceptManager }) => {
    await conceptManager.assertTabsVisible();
    await conceptManager.clickAllConceptsTab();
    await conceptManager.clickMyConceptsTab();
  });

  test('TC-ENT-CL-03: Search input filters concept cards', async ({ conceptManager, sharedPage }) => {
    // Wait for initial load
    await conceptManager.assertConceptCardsExist();
    const initialCount = await conceptManager.getConceptCardCount();
    
    // Pick the first concept's title to search for
    const firstTitle = await conceptManager.getFirstConceptTitle();
    if (!firstTitle) {
      test.skip(true, 'No concepts found to search for.');
      return;
    }

    // Search for a portion of the title
    const query = firstTitle.substring(0, Math.min(firstTitle.length, 5));
    await conceptManager.searchConcept(query);
    
    // Wait for search results to update (debounce + re-render)
    await sharedPage.waitForTimeout(1000);
    
    // Verify at least one result is still visible
    const searchCount = await conceptManager.getConceptCardCount();
    expect(searchCount).toBeGreaterThan(0);
    // Search should filter — count should be <= initial (or same if all match)
    expect(searchCount).toBeLessThanOrEqual(initialCount);
  });

  test('TC-ENT-CL-04: "Add Concept" button opens creation flow', async ({ conceptManager, sharedPage }) => {
    // Click Add Concept but do not submit
    await conceptManager.clickAddConcept();
    
    // Verify the modal/drawer opens by looking for specific fields
    const modalHeading = sharedPage.getByRole('heading', { name: /add concept|create concept|new concept/i });
    const nameInput = sharedPage.getByLabel(/name|title/i).first()
      .or(sharedPage.getByPlaceholder(/name|title/i).first());
      
    await expect(modalHeading.or(nameInput)).toBeVisible({ timeout: 10000 });

    // Clean up: close the modal so subsequent tests aren't blocked
    const dialog = sharedPage.getByRole('dialog');
    const closeBtn = dialog.getByRole('button', { name: /cancel/i }).or(dialog.getByLabel(/close/i));
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await sharedPage.keyboard.press('Escape');
    }
    await expect(modalHeading).toBeHidden({ timeout: 5000 });
  });

  test('TC-ENT-CL-05: Concept cards display edit and delete buttons', async ({ conceptManager, sharedPage }) => {
    await conceptManager.assertConceptCardsExist();
    
    // Check that at least one edit and one delete button exist
    const editBtn = sharedPage.getByRole('button', { name: /edit concept/i }).first();
    const deleteBtn = sharedPage.getByRole('button', { name: /delete concept/i }).first();
    
    await expect(editBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();
  });

  test('TC-ENT-CL-06: Clearing search input restores the concept list', async ({ conceptManager, sharedPage }) => {
    // Wait for initial load
    await conceptManager.assertConceptCardsExist();
    
    // Ensure search is clear from previous tests
    await conceptManager.clearSearch();
    await sharedPage.waitForTimeout(1000); // debounce
    
    const initialCount = await conceptManager.getConceptCardCount();
    
    // Pick the first concept's title to search for
    const firstTitle = await conceptManager.getFirstConceptTitle();
    if (!firstTitle) {
      test.skip(true, 'No concepts found to search for.');
      return;
    }

    // Search for a portion of the title to filter results
    const query = firstTitle.substring(0, Math.min(firstTitle.length, 5));
    await conceptManager.searchConcept(query);
    await sharedPage.waitForTimeout(1000); // debounce

    // Clear the search
    await conceptManager.clearSearch();
    await sharedPage.waitForTimeout(1000); // debounce

    // Verify the list restores to original count
    const restoredCount = await conceptManager.getConceptCardCount();
    expect(restoredCount).toBe(initialCount);
  });

  test('TC-ENT-CL-07: Add Concept modal can be closed without saving', async ({ conceptManager, sharedPage }) => {
    // Open the creation flow
    await conceptManager.clickAddConcept();
    
    // Look for a close button inside the dialog
    const dialog = sharedPage.getByRole('dialog');
    const closeBtn = dialog.getByRole('button', { name: /cancel/i }).or(dialog.getByLabel(/close/i));
    
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      // Fallback if no specific button is found
      await sharedPage.keyboard.press('Escape');
    }
    
    // Verify modal is gone by checking the heading is no longer visible
    const modalHeading = sharedPage.getByRole('heading', { name: /add concept|create concept|new concept/i });
    await expect(modalHeading).toBeHidden({ timeout: 5000 });
  });
});
