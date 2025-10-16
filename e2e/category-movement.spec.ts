import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Category Movement Tests - Testing cross-category drag and drop
 *
 * These tests cover the critical workflow of moving ideas between different categories,
 * which was previously broken and not tested.
 */

// Helper: Drag and drop with better error handling
async function dragAndDrop(
  page: Page,
  source: Locator,
  target: Locator,
  waitForUpdate = true,
) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Source or target not visible");
  }

  // Start drag
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.waitForTimeout(200); // Longer wait for drag to initialize

  // Move to target with steps for better simulation
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 10 },
  );
  await page.waitForTimeout(200);

  // Drop
  await page.mouse.up();

  if (waitForUpdate) {
    // Wait for Firebase update and refresh
    await page.waitForTimeout(1000);
  }
}

// Helper: Get category of an idea card by finding its parent category section
async function getIdeaCategory(
  page: Page,
  ideaLocator: Locator,
): Promise<string | null> {
  try {
    // Walk up to find the category section
    const categoryHeader = ideaLocator.locator(
      'xpath=ancestor::div[contains(@class, "flex-col")]//h3',
    );
    return await categoryHeader.first().textContent();
  } catch {
    return null;
  }
}

// Helper: Find empty category zone by category name
async function findEmptyCategoryZone(
  page: Page,
  categoryName: string,
): Promise<Locator> {
  // Find the category section by header text
  const categorySection = page
    .locator("div")
    .filter({ has: page.locator(`h3:text("${categoryName}")`) });

  // Find the ungrouped zone within that category
  return categorySection.locator('[data-testid="ungrouped-zone"]');
}

test.describe("Category Movement - Cross-Category Drag & Drop", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test session in grouping stage
    await page.goto("/session/test-grouping-id");

    // Wait for the grouping interface to load
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Ensure we have multiple categories visible
    const categoryHeaders = page.locator("h3").filter({ hasText: /^[A-Za-z]/ });
    await expect(categoryHeaders).toHaveCount(3, { timeout: 5000 });
  });

  test("should move ungrouped idea to empty category column", async ({
    page,
  }) => {
    // Find an ungrouped idea in the first category
    const sourceIdea = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .first();

    await expect(sourceIdea).toBeVisible();

    // Get the idea's text content for verification
    const ideaText = await sourceIdea.textContent();
    expect(ideaText).toBeTruthy();

    // Get the source category
    const sourceCategory = await getIdeaCategory(page, sourceIdea);
    expect(sourceCategory).toBeTruthy();

    // Find a different category that's empty or has space
    const categoryHeaders = page.locator("h3").filter({ hasText: /^[A-Za-z]/ });
    const categoryCount = await categoryHeaders.count();

    let targetCategory = null;
    let targetZone = null;

    // Find a different category
    for (let i = 0; i < categoryCount; i++) {
      const categoryText = await categoryHeaders.nth(i).textContent();
      if (categoryText && categoryText !== sourceCategory) {
        targetCategory = categoryText;
        targetZone = await findEmptyCategoryZone(page, categoryText);
        break;
      }
    }

    expect(targetCategory).toBeTruthy();
    expect(targetZone).toBeTruthy();

    // Perform the drag and drop
    await dragAndDrop(page, sourceIdea, targetZone!);

    // Verify the idea moved to the target category
    // The idea should now be in the target category section
    const targetCategorySection = page
      .locator("div")
      .filter({ has: page.locator(`h3:text("${targetCategory}")`) });

    // Check if the idea text now appears in the target category
    await expect(
      targetCategorySection.locator(`text=${ideaText?.substring(0, 20)}`),
    ).toBeVisible({ timeout: 3000 });

    // Verify it's no longer in the source category
    const sourceCategorySection = page
      .locator("div")
      .filter({ has: page.locator(`h3:text("${sourceCategory}")`) });

    await expect(
      sourceCategorySection.locator(`text=${ideaText?.substring(0, 20)}`),
    ).not.toBeVisible();
  });

  test("should move grouped idea to different category and ungroup", async ({
    page,
  }) => {
    // First create a group by dragging two ideas together
    const ungroupedIdeas = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') });

    await expect(ungroupedIdeas.first()).toBeVisible();
    await expect(ungroupedIdeas.nth(1)).toBeVisible();

    // Create a group first
    await dragAndDrop(page, ungroupedIdeas.first(), ungroupedIdeas.nth(1));

    // Wait for group to be created
    await page.waitForTimeout(1000);

    // Find the newly created group
    const ideaGroups = page.locator('[data-testid="idea-group"]');
    await expect(ideaGroups.first()).toBeVisible();

    // Get an idea from the group
    const groupedIdea = ideaGroups
      .first()
      .locator('[data-testid="idea-card"]')
      .first();
    await expect(groupedIdea).toBeVisible();

    const ideaText = await groupedIdea.textContent();
    expect(ideaText).toBeTruthy();

    // Get source category of the group
    const sourceCategory = await getIdeaCategory(page, groupedIdea);
    expect(sourceCategory).toBeTruthy();

    // Find a different category
    const categoryHeaders = page.locator("h3").filter({ hasText: /^[A-Za-z]/ });
    const categoryCount = await categoryHeaders.count();

    let targetCategory = null;
    let targetZone = null;

    for (let i = 0; i < categoryCount; i++) {
      const categoryText = await categoryHeaders.nth(i).textContent();
      if (categoryText && categoryText !== sourceCategory) {
        targetCategory = categoryText;
        targetZone = await findEmptyCategoryZone(page, categoryText);
        break;
      }
    }

    expect(targetCategory).toBeTruthy();
    expect(targetZone).toBeTruthy();

    // Drag the grouped idea to different category
    await dragAndDrop(page, groupedIdea, targetZone!);

    // Verify the idea moved and was ungrouped
    const targetCategorySection = page
      .locator("div")
      .filter({ has: page.locator(`h3:text("${targetCategory}")`) });

    // Should appear as ungrouped idea in target category
    await expect(
      targetCategorySection
        .locator('[data-testid="ungrouped-zone"]')
        .locator(`text=${ideaText?.substring(0, 20)}`),
    ).toBeVisible({ timeout: 3000 });
  });

  test("should maintain visual feedback during cross-category drag", async ({
    page,
  }) => {
    // Find an ungrouped idea
    const sourceIdea = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .first();

    await expect(sourceIdea).toBeVisible();

    // Start dragging
    const sourceBox = await sourceIdea.boundingBox();
    expect(sourceBox).toBeTruthy();

    await page.mouse.move(
      sourceBox!.x + sourceBox!.width / 2,
      sourceBox!.y + sourceBox!.height / 2,
    );
    await page.mouse.down();
    await page.waitForTimeout(200);

    // Verify drag overlay appears
    const dragOverlay = page.locator('[class*="DragOverlay"]');
    await expect(dragOverlay).toBeVisible({ timeout: 1000 });

    // Move over a different category's ungrouped zone
    const categoryHeaders = page.locator("h3").filter({ hasText: /^[A-Za-z]/ });
    const secondCategory = categoryHeaders.nth(1);
    const secondCategoryText = await secondCategory.textContent();

    if (secondCategoryText) {
      const targetZone = await findEmptyCategoryZone(page, secondCategoryText);
      const targetBox = await targetZone.boundingBox();

      if (targetBox) {
        await page.mouse.move(
          targetBox.x + targetBox.width / 2,
          targetBox.y + targetBox.height / 2,
          { steps: 5 },
        );
        await page.waitForTimeout(200);

        // Verify drop zone highlights (should show visual feedback)
        await expect(targetZone).toHaveClass(/border-blue-500|bg-blue-50/);
      }
    }

    // Cancel the drag
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Verify overlay disappears
    await expect(dragOverlay).not.toBeVisible();
  });

  test("should handle rapid cross-category movements", async ({ page }) => {
    // Test for race conditions and state consistency
    const sourceIdea = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .first();

    await expect(sourceIdea).toBeVisible();
    const ideaText = await sourceIdea.textContent();

    // Get category names
    const categoryHeaders = page.locator("h3").filter({ hasText: /^[A-Za-z]/ });
    const category1 = await categoryHeaders.nth(0).textContent();
    const category2 = await categoryHeaders.nth(1).textContent();
    const category3 = await categoryHeaders.nth(2).textContent();

    expect(category1).toBeTruthy();
    expect(category2).toBeTruthy();
    expect(category3).toBeTruthy();

    // Move between categories rapidly
    if (category2) {
      const zone2 = await findEmptyCategoryZone(page, category2);
      await dragAndDrop(page, sourceIdea, zone2, false); // Don't wait
      await page.waitForTimeout(500);
    }

    // Find idea in new location
    const movedIdea = page
      .locator(`text=${ideaText?.substring(0, 20)}`)
      .first();

    if (category3) {
      const zone3 = await findEmptyCategoryZone(page, category3);
      await dragAndDrop(page, movedIdea, zone3);
    }

    // Verify final state is consistent
    const finalCategorySection = page
      .locator("div")
      .filter({ has: page.locator(`h3:text("${category3}")`) });

    await expect(
      finalCategorySection.locator(`text=${ideaText?.substring(0, 20)}`),
    ).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Category Movement - Error Scenarios", () => {
  test("should handle network failure during category move gracefully", async ({
    page,
  }) => {
    // Navigate to session
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find idea to move
    const sourceIdea = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .first();

    await expect(sourceIdea).toBeVisible();
    const ideaText = await sourceIdea.textContent();

    // Simulate network failure by blocking requests
    await page.route("**/ideas/**", (route) => route.abort());

    // Try to move to different category
    const categoryHeaders = page.locator("h3").filter({ hasText: /^[A-Za-z]/ });
    const targetCategoryText = await categoryHeaders.nth(1).textContent();

    if (targetCategoryText) {
      const targetZone = await findEmptyCategoryZone(page, targetCategoryText);
      await dragAndDrop(page, sourceIdea, targetZone);
    }

    // Should show error state or revert
    // Check console for errors (basic check)
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    // At minimum, the UI should not be broken
    await expect(page.getByText(/group ideas/i)).toBeVisible();

    // Restore network
    await page.unroute("**/ideas/**");
  });
});
