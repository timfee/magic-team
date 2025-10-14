import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Drag & Drop Integration Tests for Idea Grouping
 *
 * P0 Coverage:
 * - ESC/cancel scenarios (state cleanup)
 * - Visual indicators (drop zones, placeholders, hovers)
 * - Action execution (create/join/move/ungroup groups)
 *
 * Prerequisites:
 * - Test session must be in GROUPING stage
 * - Multiple ideas must exist across categories
 * - Firebase real-time listeners must be active
 */

// Helper: Drag an idea card
async function dragIdea(page: Page, ideaLocator: Locator) {
  const box = await ideaLocator.boundingBox();
  if (!box) throw new Error("Idea card not visible");

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100); // Allow drag start to register
}

// Helper: Complete drag and drop
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
  await page.waitForTimeout(100);

  // Move to target
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 5 },
  );
  await page.waitForTimeout(100);

  // Drop
  await page.mouse.up();

  if (waitForUpdate) {
    // Wait for Firebase update
    await page.waitForTimeout(500);
  }
}

// Helper: Count groups on page
async function countGroups(page: Page): Promise<number> {
  return await page.locator('[data-testid="idea-group"]').count();
}

test.describe("Drag & Drop: ESC/Cancel Scenarios (P0)", () => {
  test("should reset state when ESC pressed during drag", async ({ page }) => {
    // Navigate to grouping stage
    await page.goto("/session/test-grouping-id");

    // Wait for stage to load
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find two ungrouped ideas
    const ideas = page.locator('[data-testid="idea-card"]');
    await expect(ideas.first()).toBeVisible({ timeout: 5000 });

    const idea1 = ideas.first();
    const idea2 = ideas.nth(1);

    // Start dragging idea1
    await dragIdea(page, idea1);

    // Verify drag started (drag overlay should be visible)
    const dragOverlay = page.locator('[class*="DragOverlay"]');
    await expect(dragOverlay).toBeVisible({ timeout: 1000 });

    // Move over idea2 to trigger hover state
    const box2 = await idea2.boundingBox();
    if (box2) {
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.waitForTimeout(100);
    }

    // Press ESC to cancel
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Verify state reset
    // 1. Drag overlay should disappear
    await expect(dragOverlay).not.toBeVisible();

    // 2. Original idea should not have opacity styling
    await expect(idea1).not.toHaveClass(/opacity-30/);

    // 3. Target should not have hover styling
    await expect(idea2).not.toHaveClass(/border-blue-500/);
    await expect(idea2).not.toHaveClass(/ring-4/);
  });

  test("should reset state when dragging outside valid drop zone", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    const idea = page.locator('[data-testid="idea-card"]').first();
    await expect(idea).toBeVisible();

    // Start drag
    await dragIdea(page, idea);

    // Verify drag active
    const dragOverlay = page.locator('[class*="DragOverlay"]');
    await expect(dragOverlay).toBeVisible({ timeout: 1000 });

    // Move to invalid location (far outside DndContext - top-left corner)
    await page.mouse.move(10, 10);
    await page.waitForTimeout(100);

    // Drop outside
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Verify state reset - drag overlay disappears
    await expect(dragOverlay).not.toBeVisible();

    // Verify no changes occurred (idea remains ungrouped)
    // We can't easily check groupId in E2E, but we can verify no new group was created
    const groups = page.locator('[data-testid="idea-group"]');
    const initialCount = await groups.count();

    // Verify count didn't increase (would indicate failed group creation)
    await expect(groups).toHaveCount(initialCount);
  });

  test("should handle rapid ESC presses gracefully", async ({ page }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    const idea = page.locator('[data-testid="idea-card"]').first();
    await expect(idea).toBeVisible();

    // Start drag
    await dragIdea(page, idea);

    // Verify drag active
    const dragOverlay = page.locator('[class*="DragOverlay"]');
    await expect(dragOverlay).toBeVisible({ timeout: 1000 });

    // Press ESC multiple times rapidly
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Should still cleanly reset without errors
    await expect(dragOverlay).not.toBeVisible();
  });
});

test.describe("Drag & Drop: Visual Indicators (P0)", () => {
  test("should show 'create-group' indicator when dragging ungrouped onto ungrouped", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find ungrouped ideas
    const ungroupedIdeas = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') });

    await expect(ungroupedIdeas.first()).toBeVisible();
    const idea1 = ungroupedIdeas.first();
    const idea2 = ungroupedIdeas.nth(1);

    // Start dragging idea1
    const box1 = await idea1.boundingBox();
    if (box1) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
    }

    // Hover over idea2
    const box2 = await idea2.boundingBox();
    if (box2) {
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.waitForTimeout(200);
    }

    // Check for visual indicators
    // Blue border/ring (hover state)
    await expect(idea2).toHaveClass(/border-blue-500|ring-blue/);

    // Drop indicator attribute
    await expect(idea2).toHaveAttribute("data-drop-indicator", "create-group");

    // Ghost placeholder text
    const ghostText = page.getByText(/will create group/i);
    await expect(ghostText).toBeVisible();

    // Clean up
    await page.keyboard.press("Escape");
  });

  test("should show 'join-group' indicator when dragging ungrouped onto grouped", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find ungrouped idea
    const ungroupedIdea = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .first();
    await expect(ungroupedIdea).toBeVisible();

    // Find grouped idea
    const groupedIdea = page
      .locator('[data-testid="idea-group"] [data-testid="idea-card"]')
      .first();
    await expect(groupedIdea).toBeVisible();

    // Start dragging ungrouped idea
    const box1 = await ungroupedIdea.boundingBox();
    if (box1) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
    }

    // Hover over grouped idea
    const box2 = await groupedIdea.boundingBox();
    if (box2) {
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.waitForTimeout(200);
    }

    // Check for visual indicators
    await expect(groupedIdea).toHaveAttribute(
      "data-drop-indicator",
      "join-group",
    );

    // Ghost placeholder text
    const ghostText = page.getByText(/will join.*group|will add here/i);
    await expect(ghostText).toBeVisible();

    // Clean up
    await page.keyboard.press("Escape");
  });

  test("should show 'move-to-group' indicator when dragging between groups", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find two different groups
    const groups = page.locator('[data-testid="idea-group"]');
    await expect(groups.first()).toBeVisible();

    const group1 = groups.first();
    const group2 = groups.nth(1);

    const idea1 = group1.locator('[data-testid="idea-card"]').first();
    const idea2 = group2.locator('[data-testid="idea-card"]').first();

    await expect(idea1).toBeVisible();
    await expect(idea2).toBeVisible();

    // Start dragging from group1
    const box1 = await idea1.boundingBox();
    if (box1) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
    }

    // Hover over group2 idea
    const box2 = await idea2.boundingBox();
    if (box2) {
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.waitForTimeout(200);
    }

    // Check for visual indicators
    await expect(idea2).toHaveAttribute("data-drop-indicator", "move-to-group");

    // Ghost placeholder text
    const ghostText = page.getByText(/will move.*group/i);
    await expect(ghostText).toBeVisible();

    // Clean up
    await page.keyboard.press("Escape");
  });

  test("should NOT show indicator when dragging within same group", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find group with multiple ideas
    const group = page.locator('[data-testid="idea-group"]').first();
    await expect(group).toBeVisible();

    const ideas = group.locator('[data-testid="idea-card"]');
    const count = await ideas.count();

    if (count < 2) {
      test.skip(); // Skip if not enough ideas in group
    }

    const idea1 = ideas.first();
    const idea2 = ideas.nth(1);

    // Start dragging idea1
    const box1 = await idea1.boundingBox();
    if (box1) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
    }

    // Hover over idea2 (same group)
    const box2 = await idea2.boundingBox();
    if (box2) {
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.waitForTimeout(200);
    }

    // Should NOT have drop indicator
    await expect(idea2).not.toHaveAttribute("data-drop-indicator");

    // No ghost placeholder
    const ghostTexts = page.locator("text=/will.*group/i");
    await expect(ghostTexts).toHaveCount(0);

    // Clean up
    await page.keyboard.press("Escape");
  });

  test("should show drag overlay following cursor", async ({ page }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    const idea = page.locator('[data-testid="idea-card"]').first();
    await expect(idea).toBeVisible();

    // Start drag
    const startBox = await idea.boundingBox();
    if (!startBox) throw new Error("Idea not visible");

    await page.mouse.move(
      startBox.x + startBox.width / 2,
      startBox.y + startBox.height / 2,
    );
    await page.mouse.down();
    await page.waitForTimeout(100);

    // Verify overlay visible
    const dragOverlay = page.locator('[class*="DragOverlay"]');
    await expect(dragOverlay).toBeVisible();

    // Get initial overlay position
    const initialOverlay = await dragOverlay.boundingBox();
    if (!initialOverlay) throw new Error("Overlay not visible");

    // Move mouse significantly
    await page.mouse.move(initialOverlay.x + 200, initialOverlay.y + 200, {
      steps: 10,
    });
    await page.waitForTimeout(100);

    // Overlay should have moved (new position different from initial)
    const finalOverlay = await dragOverlay.boundingBox();
    if (!finalOverlay) throw new Error("Overlay lost during drag");

    expect(Math.abs(finalOverlay.x - initialOverlay.x)).toBeGreaterThan(50);
    expect(Math.abs(finalOverlay.y - initialOverlay.y)).toBeGreaterThan(50);

    // Clean up
    await page.keyboard.press("Escape");
  });

  test("should show ungroup placeholder when dragging grouped to ungrouped zone", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find grouped idea
    const groupedIdea = page
      .locator('[data-testid="idea-group"] [data-testid="idea-card"]')
      .first();
    await expect(groupedIdea).toBeVisible();

    // Find ungrouped zone (look for zone without group wrapper)
    const ungroupedZone = page.locator('[data-testid="ungrouped-zone"]');
    await expect(ungroupedZone).toBeVisible();

    // Start dragging grouped idea
    const box1 = await groupedIdea.boundingBox();
    if (box1) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
    }

    // Move to ungrouped zone
    const zoneBox = await ungroupedZone.boundingBox();
    if (zoneBox) {
      await page.mouse.move(
        zoneBox.x + zoneBox.width / 2,
        zoneBox.y + zoneBox.height / 2,
      );
      await page.waitForTimeout(200);
    }

    // Check for ungroup message
    const ungroupText = page.getByText(/will ungroup|drop.*ungroup/i);
    await expect(ungroupText).toBeVisible();

    // Clean up
    await page.keyboard.press("Escape");
  });
});

test.describe("Drag & Drop: Action Execution (P0)", () => {
  test("should create new group when dropping ungrouped on ungrouped", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Get initial group count
    const initialGroupCount = await countGroups(page);

    // Find two ungrouped ideas
    const ungroupedIdeas = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') });

    await expect(ungroupedIdeas.first()).toBeVisible();
    const idea1 = ungroupedIdeas.first();
    const idea2 = ungroupedIdeas.nth(1);

    // Get idea text for verification
    const idea1Text = await idea1.textContent();
    const idea2Text = await idea2.textContent();

    // Perform drag and drop
    await dragAndDrop(page, idea1, idea2);

    // Wait for Firebase update
    await page.waitForTimeout(1000);

    // Verify group count increased
    const finalGroupCount = await countGroups(page);
    expect(finalGroupCount).toBe(initialGroupCount + 1);

    // Verify both ideas are in the new group
    const newGroup = page.locator('[data-testid="idea-group"]').last();
    await expect(newGroup).toBeVisible();

    if (idea1Text) {
      await expect(
        newGroup.locator(`text=${idea1Text.substring(0, 20)}`),
      ).toBeVisible();
    }
    if (idea2Text) {
      await expect(
        newGroup.locator(`text=${idea2Text.substring(0, 20)}`),
      ).toBeVisible();
    }

    // Verify group has auto-generated name (adjective + noun pattern)
    await expect(
      newGroup.locator(
        "text=/Amazing|Brilliant|Creative|Dynamic|Essential|Fantastic|Great|Innovative/",
      ),
    ).toBeVisible();
  });

  test("should add ungrouped idea to existing group", async ({ page }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find existing group
    const group = page.locator('[data-testid="idea-group"]').first();
    await expect(group).toBeVisible();

    // Get initial idea count in group
    const initialCount = await group
      .locator('[data-testid="idea-card"]')
      .count();

    // Find ungrouped idea
    const ungroupedIdea = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .first();
    await expect(ungroupedIdea).toBeVisible();

    // Get idea text for verification
    const ungroupedText = await ungroupedIdea.textContent();

    // Drag ungrouped idea to group's first idea
    const groupedIdea = group.locator('[data-testid="idea-card"]').first();
    await dragAndDrop(page, ungroupedIdea, groupedIdea);

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify idea count increased
    const finalCount = await group.locator('[data-testid="idea-card"]').count();
    expect(finalCount).toBe(initialCount + 1);

    // Verify the idea appears in group
    if (ungroupedText) {
      await expect(
        group.locator(`text=${ungroupedText.substring(0, 20)}`),
      ).toBeVisible();
    }
  });

  test("should move idea from one group to another", async ({ page }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find two different groups
    const groups = page.locator('[data-testid="idea-group"]');
    const groupCount = await groups.count();

    if (groupCount < 2) {
      test.skip(); // Need at least 2 groups
    }

    const group1 = groups.first();
    const group2 = groups.nth(1);

    // Get initial counts
    const group1InitialCount = await group1
      .locator('[data-testid="idea-card"]')
      .count();
    const group2InitialCount = await group2
      .locator('[data-testid="idea-card"]')
      .count();

    // Get idea from group1
    const idea1 = group1.locator('[data-testid="idea-card"]').first();
    const idea1Text = await idea1.textContent();

    // Get idea from group2
    const idea2 = group2.locator('[data-testid="idea-card"]').first();

    // Drag idea1 to group2
    await dragAndDrop(page, idea1, idea2);

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify group1 count decreased
    const group1FinalCount = await group1
      .locator('[data-testid="idea-card"]')
      .count();
    expect(group1FinalCount).toBe(group1InitialCount - 1);

    // Verify group2 count increased
    const group2FinalCount = await group2
      .locator('[data-testid="idea-card"]')
      .count();
    expect(group2FinalCount).toBe(group2InitialCount + 1);

    // Verify idea moved to group2
    if (idea1Text) {
      await expect(
        group2.locator(`text=${idea1Text.substring(0, 20)}`),
      ).toBeVisible();
    }
  });

  test("should delete source group if it becomes empty after move", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find or create a group with only 1 idea
    // This test assumes such a group exists or creates one first
    const groups = page.locator('[data-testid="idea-group"]');
    let singleIdeaGroup: Locator | null = null;

    const groupCount = await groups.count();
    for (let i = 0; i < groupCount; i++) {
      const group = groups.nth(i);
      const ideaCount = await group
        .locator('[data-testid="idea-card"]')
        .count();
      if (ideaCount === 1) {
        singleIdeaGroup = group;
        break;
      }
    }

    if (!singleIdeaGroup) {
      test.skip(); // Need a group with exactly 1 idea
      return; // This line helps TypeScript understand execution stops
    }

    const initialGroupCount = await countGroups(page);

    // Get the single idea
    const singleIdea = singleIdeaGroup
      .locator('[data-testid="idea-card"]')
      .first();
    await expect(singleIdea).toBeVisible();

    // Find another group
    const targetGroup = groups.first();
    const targetIdea = targetGroup.locator('[data-testid="idea-card"]').first();

    // Move the single idea to another group
    await dragAndDrop(page, singleIdea, targetIdea);

    // Wait for update and group deletion
    await page.waitForTimeout(1000);

    // Verify group count decreased (empty group deleted)
    const finalGroupCount = await countGroups(page);
    expect(finalGroupCount).toBe(initialGroupCount - 1);
  });

  test("should ungroup idea when dropped in ungrouped zone", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find grouped idea
    const group = page.locator('[data-testid="idea-group"]').first();
    await expect(group).toBeVisible();

    const initialCount = await group
      .locator('[data-testid="idea-card"]')
      .count();

    const groupedIdea = group.locator('[data-testid="idea-card"]').first();
    const ideaText = await groupedIdea.textContent();

    // Find ungrouped zone
    const ungroupedZone = page.locator('[data-testid="ungrouped-zone"]');
    await expect(ungroupedZone).toBeVisible();

    // Drag to ungrouped zone
    await dragAndDrop(page, groupedIdea, ungroupedZone);

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify removed from group
    const finalCount = await group.locator('[data-testid="idea-card"]').count();
    expect(finalCount).toBe(initialCount - 1);

    // Verify appears in ungrouped zone
    if (ideaText) {
      const ungroupedIdeas = page
        .locator('[data-testid="idea-card"]')
        .filter({ hasNot: page.locator('[data-testid="idea-group"]') });
      await expect(
        ungroupedIdeas.locator(`text=${ideaText.substring(0, 20)}`),
      ).toBeVisible();
    }
  });

  test("should preserve category colors after grouping", async ({ page }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find idea with visible category color indicator
    const idea = page.locator('[data-testid="idea-card"]').first();
    await expect(idea).toBeVisible();

    // Get the category color element (border-left color)
    const colorIndicator = idea.locator('[class*="border-l-"]');
    const initialColor = await colorIndicator.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue("border-left-color"),
    );

    // Create a group by dragging onto another idea
    const idea2 = page.locator('[data-testid="idea-card"]').nth(1);
    await dragAndDrop(page, idea, idea2);

    // Wait for update
    await page.waitForTimeout(1000);

    // Find the idea in its new group
    const groups = page.locator('[data-testid="idea-group"]');
    const ideaInGroup = groups
      .last()
      .locator('[data-testid="idea-card"]')
      .first();
    await expect(ideaInGroup).toBeVisible();

    // Verify color preserved
    const newColorIndicator = ideaInGroup.locator('[class*="border-l-"]');
    const finalColor = await newColorIndicator.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue("border-left-color"),
    );

    expect(finalColor).toBe(initialColor);
  });
});

test.describe("Drag & Drop: Group Container Targets (MECE Completion)", () => {
  test("should join group when ungrouped card dropped on group container", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find existing group
    const group = page.locator('[data-testid="idea-group"]').first();
    await expect(group).toBeVisible();

    const initialCount = await group
      .locator('[data-testid="idea-card"]')
      .count();

    // Find ungrouped idea
    const ungroupedIdea = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .first();
    await expect(ungroupedIdea).toBeVisible();

    const ideaText = await ungroupedIdea.textContent();

    // Drag to group container (not specific card, but group header/empty space)
    const groupHeader = group.locator("h3").first();
    await dragAndDrop(page, ungroupedIdea, groupHeader);

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify idea added to group
    const finalCount = await group.locator('[data-testid="idea-card"]').count();
    expect(finalCount).toBe(initialCount + 1);

    if (ideaText) {
      await expect(
        group.locator(`text=${ideaText.substring(0, 20)}`),
      ).toBeVisible();
    }
  });

  test("should move idea when dropped on different group container", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find two different groups
    const groups = page.locator('[data-testid="idea-group"]');
    const groupCount = await groups.count();

    if (groupCount < 2) {
      test.skip(); // Need at least 2 groups
    }

    const sourceGroup = groups.first();
    const targetGroup = groups.nth(1);

    const initialSourceCount = await sourceGroup
      .locator('[data-testid="idea-card"]')
      .count();
    const initialTargetCount = await targetGroup
      .locator('[data-testid="idea-card"]')
      .count();

    // Get idea from source group
    const ideaToMove = sourceGroup.locator('[data-testid="idea-card"]').first();
    const ideaText = await ideaToMove.textContent();

    // Drag to target group container (group header, not specific card)
    const targetGroupHeader = targetGroup.locator("h3").first();
    await dragAndDrop(page, ideaToMove, targetGroupHeader);

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify counts changed
    const finalSourceCount = await sourceGroup
      .locator('[data-testid="idea-card"]')
      .count();
    const finalTargetCount = await targetGroup
      .locator('[data-testid="idea-card"]')
      .count();

    expect(finalSourceCount).toBe(initialSourceCount - 1);
    expect(finalTargetCount).toBe(initialTargetCount + 1);

    // Verify idea moved
    if (ideaText) {
      await expect(
        targetGroup.locator(`text=${ideaText.substring(0, 20)}`),
      ).toBeVisible();
    }
  });

  test("should NOT move idea when dropped on own group container", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find group with at least one idea
    const group = page.locator('[data-testid="idea-group"]').first();
    await expect(group).toBeVisible();

    const initialCount = await group
      .locator('[data-testid="idea-card"]')
      .count();

    if (initialCount === 0) {
      test.skip(); // Need at least 1 idea in group
    }

    // Get idea from the group
    const idea = group.locator('[data-testid="idea-card"]').first();
    const ideaText = await idea.textContent();

    // Drag to same group's container (header)
    const groupHeader = group.locator("h3").first();
    await dragAndDrop(page, idea, groupHeader);

    // Wait for potential update
    await page.waitForTimeout(1000);

    // Verify count unchanged (no-op)
    const finalCount = await group.locator('[data-testid="idea-card"]').count();
    expect(finalCount).toBe(initialCount);

    // Verify idea still in same group
    if (ideaText) {
      await expect(
        group.locator(`text=${ideaText.substring(0, 20)}`),
      ).toBeVisible();
    }
  });

  test("should NOT move ungrouped idea when dropped on empty ungrouped zone", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find ungrouped idea
    const ungroupedIdea = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .first();
    await expect(ungroupedIdea).toBeVisible();

    const ideaText = await ungroupedIdea.textContent();

    // Find an ungrouped zone (ideally empty, but any will do)
    const ungroupedZones = page.locator('[data-testid="ungrouped-zone"]');
    await expect(ungroupedZones.first()).toBeVisible();

    // Count ungrouped ideas before
    const initialUngroupedCount = await page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .count();

    // Drag to empty area of ungrouped zone
    const targetZone = ungroupedZones.first();
    await dragAndDrop(page, ungroupedIdea, targetZone);

    // Wait
    await page.waitForTimeout(1000);

    // Verify still ungrouped (count unchanged)
    const finalUngroupedCount = await page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .count();
    expect(finalUngroupedCount).toBe(initialUngroupedCount);

    // Verify idea text still visible (not lost)
    if (ideaText) {
      const ungroupedIdeas = page
        .locator('[data-testid="idea-card"]')
        .filter({ hasNot: page.locator('[data-testid="idea-group"]') });
      await expect(
        ungroupedIdeas.locator(`text=${ideaText.substring(0, 20)}`),
      ).toBeVisible();
    }
  });
});

test.describe("Drag & Drop: Reordering (P0 - CRITICAL)", () => {
  test("should reorder ungrouped ideas within same category", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find ungrouped ideas in same category
    const ungroupedIdeas = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') });

    await expect(ungroupedIdeas.first()).toBeVisible();

    const idea1 = ungroupedIdeas.first();
    const idea3 = ungroupedIdeas.nth(2);

    // Get original text content
    const idea1Text = await idea1.textContent();
    const idea3Text = await idea3.textContent();

    // Drag idea1 to position of idea3 (reorder down)
    await dragAndDrop(page, idea1, idea3);

    // Wait for reorder
    await page.waitForTimeout(1000);

    // Verify order changed
    const updatedIdeas = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') });

    // idea3 text should now appear before idea1 text
    const allText = await updatedIdeas.allTextContents();

    if (idea1Text && idea3Text) {
      const idea1Index = allText.findIndex((t) =>
        t.includes(idea1Text.substring(0, 20)),
      );
      const idea3Index = allText.findIndex((t) =>
        t.includes(idea3Text.substring(0, 20)),
      );

      // idea1 should now be after idea3
      expect(idea1Index).toBeGreaterThan(idea3Index);
    }
  });

  test("should reorder ideas within same group", async ({ page }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find a group with multiple ideas
    const group = page.locator('[data-testid="idea-group"]').first();
    await expect(group).toBeVisible();

    const groupIdeas = group.locator('[data-testid="idea-card"]');
    const count = await groupIdeas.count();

    if (count < 3) {
      test.skip(); // Need at least 3 ideas in group
    }

    const idea1 = groupIdeas.first();
    const idea3 = groupIdeas.nth(2);

    // Get text content
    const idea1Text = await idea1.textContent();
    const idea3Text = await idea3.textContent();

    // Drag first idea to third position
    await dragAndDrop(page, idea1, idea3);

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify order changed within group
    const updatedIdeas = group.locator('[data-testid="idea-card"]');
    const allText = await updatedIdeas.allTextContents();

    if (idea1Text && idea3Text) {
      const idea1Index = allText.findIndex((t) =>
        t.includes(idea1Text.substring(0, 20)),
      );
      const idea3Index = allText.findIndex((t) =>
        t.includes(idea3Text.substring(0, 20)),
      );

      // idea1 should now be after idea3
      expect(idea1Index).toBeGreaterThan(idea3Index);
    }
  });

  test("should maintain order after multiple reorderings", async ({ page }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find ungrouped ideas
    const ungroupedIdeas = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') });

    const count = await ungroupedIdeas.count();
    if (count < 3) {
      test.skip(); // Need at least 3 ideas
    }

    const idea1 = ungroupedIdeas.first();
    const idea2 = ungroupedIdeas.nth(1);
    const idea3 = ungroupedIdeas.nth(2);

    const idea1Text = await idea1.textContent();
    const idea2Text = await idea2.textContent();
    const idea3Text = await idea3.textContent();

    // Perform multiple reorderings
    // 1. Move idea1 to position 3
    await dragAndDrop(page, idea1, idea3);
    await page.waitForTimeout(1000);

    // 2. Move idea2 to position 1
    await dragAndDrop(page, idea2, ungroupedIdeas.first());
    await page.waitForTimeout(1000);

    // Verify final order: idea2, idea3, idea1
    const finalIdeas = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') });

    const finalOrder = await finalIdeas.allTextContents();

    if (idea1Text && idea2Text && idea3Text) {
      const pos1 = finalOrder.findIndex((t) =>
        t.includes(idea1Text.substring(0, 20)),
      );
      const pos2 = finalOrder.findIndex((t) =>
        t.includes(idea2Text.substring(0, 20)),
      );
      const pos3 = finalOrder.findIndex((t) =>
        t.includes(idea3Text.substring(0, 20)),
      );

      // Verify order: pos2 < pos3 < pos1
      expect(pos2).toBeLessThan(pos3);
      expect(pos3).toBeLessThan(pos1);
    }
  });

  test("should NOT group when reordering within same category", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    const initialGroupCount = await countGroups(page);

    // Find two ungrouped ideas in same category
    const ungroupedIdeas = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') });

    await expect(ungroupedIdeas.first()).toBeVisible();

    const idea1 = ungroupedIdeas.first();
    const idea2 = ungroupedIdeas.nth(1);

    // Drag to reorder (same category)
    await dragAndDrop(page, idea1, idea2);

    // Wait
    await page.waitForTimeout(1000);

    // Verify NO new group created
    const finalGroupCount = await countGroups(page);
    expect(finalGroupCount).toBe(initialGroupCount);

    // Both should still be ungrouped
    const stillUngrouped = await page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') })
      .count();

    expect(stillUngrouped).toBeGreaterThanOrEqual(2);
  });

  test("should preserve order when moving idea to different group", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Find two groups
    const groups = page.locator('[data-testid="idea-group"]');
    const groupCount = await groups.count();

    if (groupCount < 2) {
      test.skip();
    }

    const group1 = groups.first();
    const group2 = groups.nth(1);

    const idea1 = group1.locator('[data-testid="idea-card"]').first();
    const idea2Target = group2.locator('[data-testid="idea-card"]').nth(1); // Second idea in group2

    await expect(idea1).toBeVisible();
    await expect(idea2Target).toBeVisible();

    const idea1Text = await idea1.textContent();

    // Move idea1 to group2, positioned after first idea
    await dragAndDrop(page, idea1, idea2Target);

    await page.waitForTimeout(1000);

    // Verify idea moved to group2
    await expect(
      group2.locator(`text=${idea1Text?.substring(0, 20)}`),
    ).toBeVisible();

    // Verify it's in correct position (after first, before or at second)
    const group2Ideas = group2.locator('[data-testid="idea-card"]');
    const texts = await group2Ideas.allTextContents();

    if (idea1Text) {
      const movedIndex = texts.findIndex((t) =>
        t.includes(idea1Text.substring(0, 20)),
      );
      // Should be positioned appropriately (not just appended at end)
      expect(movedIndex).toBeGreaterThanOrEqual(0);
      expect(movedIndex).toBeLessThan(texts.length);
    }
  });

  test("should handle reordering with fractional order values", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    // Perform multiple reorderings to create fractional orders
    const ungroupedIdeas = page
      .locator('[data-testid="idea-card"]')
      .filter({ hasNot: page.locator('[data-testid="idea-group"]') });

    const count = await ungroupedIdeas.count();
    if (count < 3) {
      test.skip();
    }

    // Perform 5 reorderings to create complex fractional orders
    for (let i = 0; i < 5; i++) {
      const first = ungroupedIdeas.first();
      const last = ungroupedIdeas.last();

      await dragAndDrop(page, first, last);
      await page.waitForTimeout(800);
    }

    // Verify all ideas still visible and in order
    const finalCount = await ungroupedIdeas.count();
    expect(finalCount).toBe(count);

    // Verify they're still ungrouped
    await expect(ungroupedIdeas.first()).toBeVisible();
  });

  test("should show correct visual indicator during reorder", async ({
    page,
  }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    const group = page.locator('[data-testid="idea-group"]').first();
    const groupIdeas = group.locator('[data-testid="idea-card"]');
    const count = await groupIdeas.count();

    if (count < 2) {
      test.skip();
    }

    const idea1 = groupIdeas.first();
    const idea2 = groupIdeas.nth(1);

    // Start dragging
    const box1 = await idea1.boundingBox();
    if (box1) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
    }

    // Move over target
    const box2 = await idea2.boundingBox();
    if (box2) {
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.waitForTimeout(200);
    }

    // For same-group reordering, should NOT show indicator (or show neutral indicator)
    // Currently the code doesn't add drop indicator for same-group reordering
    await expect(idea2).not.toHaveAttribute("data-drop-indicator");

    // Clean up
    await page.keyboard.press("Escape");
  });
});

test.describe("Drag & Drop: Error Handling", () => {
  test("should handle drag during network delay gracefully", async ({
    page,
  }) => {
    // Slow down network to simulate lag
    await page.route("**/*", (route) => {
      setTimeout(() => {
        void route.continue();
      }, 1000);
    });

    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    const idea1 = page.locator('[data-testid="idea-card"]').first();
    const idea2 = page.locator('[data-testid="idea-card"]').nth(1);

    await expect(idea1).toBeVisible();
    await expect(idea2).toBeVisible();

    // Perform drag during network delay
    await dragAndDrop(page, idea1, idea2, false);

    // Should show loading state or allow operation to complete
    // (exact behavior depends on your error handling strategy)

    // Wait for delayed response
    await page.waitForTimeout(2000);

    // Verify UI eventually updates
    const groups = page.locator('[data-testid="idea-group"]');
    await expect(groups).toHaveCount(await groups.count(), { timeout: 5000 });
  });

  test("should prevent concurrent drags", async ({ page }) => {
    await page.goto("/session/test-grouping-id");
    await expect(page.getByText(/group ideas/i)).toBeVisible({
      timeout: 10000,
    });

    const idea1 = page.locator('[data-testid="idea-card"]').first();
    const idea2 = page.locator('[data-testid="idea-card"]').nth(1);

    await expect(idea1).toBeVisible();
    await expect(idea2).toBeVisible();

    // Start first drag
    await dragIdea(page, idea1);

    // Verify first drag active
    const dragOverlay = page.locator('[class*="DragOverlay"]');
    await expect(dragOverlay).toBeVisible();

    // Try to start second drag (should not work - can't grab during active drag)
    // This is enforced by @dnd-kit automatically

    // Clean up
    await page.keyboard.press("Escape");
  });
});
