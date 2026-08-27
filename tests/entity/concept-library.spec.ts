import { test, expect } from '../../src/fixtures/authenticated.fixture';
import { ENV } from '../../src/config/env.config';

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

  test('TC-ENT-CL-01: Concept Manager page loads correctly', async ({ bodhiDashboard, conceptManager, page }) => {
    await bodhiDashboard.clickConceptManager();
    await conceptManager.assertPageLoaded();
    await expect(page).toHaveURL(/concept-library/i);
  });

  test('TC-ENT-CL-02: Tabs "My Concepts" and "All Concepts" are visible and clickable', async ({ bodhiDashboard, conceptManager }) => {
    await bodhiDashboard.clickConceptManager();
    await conceptManager.assertTabsVisible();
    await conceptManager.clickAllConceptsTab();
    await conceptManager.clickMyConceptsTab();
  });

  test('TC-ENT-CL-03: Search input filters concept cards', async ({ bodhiDashboard, conceptManager, page }) => {
    await bodhiDashboard.clickConceptManager();
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
    await page.waitForTimeout(1000);
    
    // Verify at least one result is still visible
    const searchCount = await conceptManager.getConceptCardCount();
    expect(searchCount).toBeGreaterThan(0);
    // Search should filter — count should be <= initial (or same if all match)
    expect(searchCount).toBeLessThanOrEqual(initialCount);
  });

  test('TC-ENT-CL-04: "Add Concept" button opens creation flow', async ({ bodhiDashboard, conceptManager, page }) => {
    await bodhiDashboard.clickConceptManager();
    
    // Click Add Concept but do not submit
    await conceptManager.clickAddConcept();
    
    // Verify the modal/drawer opens by looking for specific fields
    const modalHeading = page.getByRole('heading', { name: /add concept|create concept|new concept/i });
    const nameInput = page.getByLabel(/name|title/i).first()
      .or(page.getByPlaceholder(/name|title/i).first());
      
    await expect(modalHeading.or(nameInput)).toBeVisible({ timeout: 10000 });
  });

  test('TC-ENT-CL-05: Concept cards display edit and delete buttons', async ({ bodhiDashboard, conceptManager, page }) => {
    await bodhiDashboard.clickConceptManager();
    await conceptManager.assertConceptCardsExist();
    
    // Check that at least one edit and one delete button exist
    const editBtn = page.getByRole('button', { name: /edit concept/i }).first();
    const deleteBtn = page.getByRole('button', { name: /delete concept/i }).first();
    
    await expect(editBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();
  });
});
