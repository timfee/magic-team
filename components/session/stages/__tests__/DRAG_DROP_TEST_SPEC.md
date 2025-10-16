# Drag & Drop Comprehensive Test Specification

## CRITICAL: State Machine Coverage

### ✓ Unit Tests (Completed)

Located in: `lib/utils/__tests__/drag-drop-matrix.test.ts`

**State Transitions Covered (48 tests):**

- Self-drop (can't drop on same idea): 3 tests
- Create group (both ungrouped): 4 tests
- Join group (one grouped, one not): 5 tests
- Move between groups (both grouped, different): 4 tests
- No action (both in same group): 3 tests
- Edge cases & validation: 29 tests

## ⚠️ MISSING: Browser-Based Integration Tests

### Event Lifecycle Tests (REQUIRED)

#### 1. Mouse Drag Lifecycle

**Status: NOT TESTED**

```typescript
// Required test sequence:
test("should handle complete mouse drag lifecycle", async ({ page }) => {
  // 1. Mouse down on idea card
  await idea.hover();
  await page.mouse.down();

  // 2. Verify drag start state
  await expect(dragOverlay).toBeVisible();
  await expect(idea).toHaveClass(/opacity-30/); // Original faded

  // 3. Mouse move over target
  await target.hover();

  // 4. Verify drag over state (frame-by-frame critical!)
  await expect(target).toHaveClass(/border-blue-500/);
  await expect(ghostPlaceholder).toContainText("Will create group");

  // 5. Mouse up (drop)
  await page.mouse.up();

  // 6. Verify final state
  await expect(dragOverlay).not.toBeVisible();
  await expect(newGroup).toBeVisible();
});
```

#### 2. Cancel Scenarios (CRITICAL - Just fixed bug!)

**Status: NOT TESTED**

```typescript
test("should reset state when ESC pressed during drag", async ({ page }) => {
  await dragIdea(idea1);
  await page.hover(target);

  // Verify drag active
  await expect(dragOverlay).toBeVisible();

  // Press ESC
  await page.keyboard.press("Escape");

  // Verify state reset
  await expect(dragOverlay).not.toBeVisible();
  await expect(idea1).not.toHaveClass(/opacity-30/);
  await expect(target).not.toHaveClass(/border-blue-500/);
});

test("should reset state when dragging outside container", async ({ page }) => {
  await dragIdea(idea1);

  // Drag to invalid location (outside DndContext)
  await page.mouse.move(0, 0);
  await page.mouse.up();

  // Verify no changes occurred
  await expect(idea1.groupId).toBeNull();
  await expect(dragOverlay).not.toBeVisible();
});
```

#### 3. Keyboard Accessibility (REQUIRED)

**Status: NOT TESTED**

```typescript
test("should support keyboard navigation for drag/drop", async ({ page }) => {
  // Focus on idea
  await idea1.focus();

  // Activate keyboard dragging (Space/Enter)
  await page.keyboard.press("Space");

  // Navigate with arrow keys
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");

  // Confirm drop
  await page.keyboard.press("Space");

  // Verify group created
  await expect(newGroup).toBeVisible();
});

test("should announce drag state to screen readers", async ({ page }) => {
  await idea1.focus();
  await page.keyboard.press("Space");

  // Check ARIA live region announcements
  const announcement = await page.locator('[aria-live="assertive"]');
  await expect(announcement).toContainText("Idea 1 is being moved");
});
```

### Visual Feedback Tests (Frame-by-Frame Critical!)

#### 4. Drop Indicators

**Status: NOT TESTED**

```typescript
test("should show correct drop indicator: create-group", async ({ page }) => {
  // Both ungrouped
  await dragIdea(ungroupedIdea1);
  await page.hover(ungroupedIdea2);

  // Verify visual indicator
  await expect(ungroupedIdea2).toHaveAttribute(
    "data-drop-indicator",
    "create-group",
  );
  await expect(page.locator("text=Will create group")).toBeVisible();
  await expect(ungroupedIdea2).toHaveClass(/ring-4 ring-blue-200/);
});

test("should show correct drop indicator: join-group", async ({ page }) => {
  // Ungrouped onto grouped
  await dragIdea(ungroupedIdea);
  await page.hover(groupedIdea);

  await expect(groupedIdea).toHaveAttribute(
    "data-drop-indicator",
    "join-group",
  );
  await expect(page.locator("text=Will join this group")).toBeVisible();
});

test("should show correct drop indicator: move-to-group", async ({ page }) => {
  // Grouped onto different group
  await dragIdea(group1Idea);
  await page.hover(group2Idea);

  await expect(group2Idea).toHaveAttribute(
    "data-drop-indicator",
    "move-to-group",
  );
  await expect(page.locator("text=Will move to this group")).toBeVisible();
});

test("should NOT show indicator for same group", async ({ page }) => {
  await dragIdea(group1IdeaA);
  await page.hover(group1IdeaB); // Same group!

  await expect(page.locator("[data-drop-indicator]")).not.toBeVisible();
});
```

#### 5. Ghost Placeholders

**Status: NOT TESTED**

```typescript
test("should show ghost placeholder when hovering over group", async ({
  page,
}) => {
  await dragIdea(idea);
  await page.hover(groupContainer);

  await expect(page.locator("text=Will add here")).toBeVisible();
  await expect(ghostPlaceholder).toHaveClass(/border-dashed border-blue-500/);
});

test("should show ungroup placeholder in ungrouped zone", async ({ page }) => {
  await dragIdea(groupedIdea);
  await page.hover(ungroupedZone);

  await expect(page.locator("text=Will ungroup here")).toBeVisible();
});
```

#### 6. Drag Overlay

**Status: NOT TESTED**

```typescript
test("should render drag overlay following cursor", async ({ page }) => {
  await idea.hover();
  await page.mouse.down();

  // Get initial position
  const box1 = await dragOverlay.boundingBox();

  // Move mouse
  await page.mouse.move(box1.x + 100, box1.y + 100);

  // Verify overlay followed
  const box2 = await dragOverlay.boundingBox();
  expect(box2.x).toBeGreaterThan(box1.x);
  expect(box2.y).toBeGreaterThan(box1.y);
});

test("should style overlay with shadow and correct colors", async ({
  page,
}) => {
  await dragIdea(idea);

  await expect(dragOverlay).toHaveClass(/shadow-2xl/);
  await expect(dragOverlay).toHaveCSS("border-left-color", categoryColor);
});
```

### Action Execution Tests

#### 7. Create Group Action

**Status: NOT TESTED**

```typescript
test("should create new group when dropping ungrouped on ungrouped", async ({
  page,
}) => {
  const initialGroups = await countGroups();

  await dragAndDrop(ungroupedIdea1, ungroupedIdea2);

  // Wait for group creation
  await page.waitForFunction(
    (count) =>
      document.querySelectorAll('[data-testid="idea-group"]').length
      === count + 1,
    initialGroups,
  );

  // Verify both ideas are in new group
  const newGroup = await page.locator('[data-testid="idea-group"]').last();
  await expect(newGroup).toContainText(ungroupedIdea1.content);
  await expect(newGroup).toContainText(ungroupedIdea2.content);

  // Verify group has auto-generated name
  await expect(newGroup).toContainText(/(Amazing|Brilliant|Creative)/);
});
```

#### 8. Join Group Action

**Status: NOT TESTED**

```typescript
test("should add ungrouped idea to existing group", async ({ page }) => {
  const groupIdeaCount = await group
    .locator('[data-testid="idea-card"]')
    .count();

  await dragAndDrop(ungroupedIdea, groupedIdea);

  // Verify idea moved to group
  await expect(group.locator('[data-testid="idea-card"]')).toHaveCount(
    groupIdeaCount + 1,
  );
  await expect(group).toContainText(ungroupedIdea.content);
});

test("should add target to dragged idea group", async ({ page }) => {
  await dragAndDrop(groupedIdea, ungroupedIdea);

  // Target should join active's group
  await expect(group).toContainText(ungroupedIdea.content);
});
```

#### 9. Move Between Groups Action

**Status: NOT TESTED**

```typescript
test("should move idea from one group to another", async ({ page }) => {
  const group1Count = await group1.locator('[data-testid="idea-card"]').count();
  const group2Count = await group2.locator('[data-testid="idea-card"]').count();

  await dragAndDrop(group1Idea, group2Idea);

  // Verify counts changed
  await expect(group1.locator('[data-testid="idea-card"]')).toHaveCount(
    group1Count - 1,
  );
  await expect(group2.locator('[data-testid="idea-card"]')).toHaveCount(
    group2Count + 1,
  );

  // Verify idea moved
  await expect(group1).not.toContainText(group1Idea.content);
  await expect(group2).toContainText(group1Idea.content);
});

test("should delete source group if it becomes empty", async ({ page }) => {
  // Group with only 1 idea
  const singleIdeaGroup = await findGroupWithOneIdea();

  await dragAndDrop(singleIdeaGroup.idea, otherGroup.idea);

  // Verify source group deleted
  await expect(singleIdeaGroup).not.toBeVisible();
});
```

#### 10. Ungroup Action (Drop on Ungrouped Zone)

**Status: NOT TESTED**

```typescript
test("should ungroup idea when dropped in ungrouped zone", async ({ page }) => {
  const groupCount = await group.locator('[data-testid="idea-card"]').count();

  await dragAndDrop(groupedIdea, ungroupedZone);

  // Verify removed from group
  await expect(group.locator('[data-testid="idea-card"]')).toHaveCount(
    groupCount - 1,
  );

  // Verify appears in ungrouped area
  await expect(ungroupedZone).toContainText(groupedIdea.content);
});
```

### Edge Cases & Error Scenarios

#### 11. Rapid Operations

**Status: NOT TESTED**

```typescript
test("should handle rapid sequential drags", async ({ page }) => {
  // Perform 5 drags quickly
  for (let i = 0; i < 5; i++) {
    await dragAndDrop(ideas[i], ideas[i + 1]);
    await page.waitForTimeout(100); // Minimal delay
  }

  // Verify all operations completed
  // (Exact expectations depend on your business logic)
});

test("should prevent concurrent drags", async ({ page }) => {
  await idea1.hover();
  await page.mouse.down();

  // Try to start second drag (should be impossible)
  await idea2.hover();
  await expect(idea2).not.toHaveClass(/cursor-grabbing/);
});
```

#### 12. Error Handling

**Status: NOT TESTED**

```typescript
test("should handle network failure gracefully", async ({ page }) => {
  // Simulate network failure
  await page.route("**/api/**", (route) => route.abort());

  await dragAndDrop(idea1, idea2);

  // Should show error state
  await expect(page.locator('[role="alert"]')).toBeVisible();

  // Should not optimistically update UI
  await expect(idea1.groupId).toBeNull();
});
```

### Collision Detection Tests

#### 13. Closest Corners Algorithm

**Status: NOT TESTED**

```typescript
test("should detect drop target using closest corners", async ({ page }) => {
  // Position ideas close together
  await dragIdea(idea1);

  // Move cursor to corner of target
  const box = await idea2.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 5); // Top-left corner

  // Should recognize as over target
  await expect(idea2).toHaveClass(/border-blue-500/);
});
```

### Accessibility Tests

#### 14. Screen Reader Support

**Status: NOT TESTED**

```typescript
test("should provide proper ARIA labels", async ({ page }) => {
  await expect(idea).toHaveAttribute("role", "button");
  await expect(idea).toHaveAttribute("aria-roledescription", "draggable");
  await expect(idea).toHaveAttribute("aria-label");
});

test("should announce drop zones to screen readers", async ({ page }) => {
  await expect(ungroupedZone).toHaveAttribute("role", "region");
  await expect(ungroupedZone).toHaveAttribute("aria-label", /drop zone/i);
});
```

## Test Execution Priority

### P0 - Critical (Must have before production)

1. ✓ State machine unit tests (DONE)
2. ⚠️ Cancel/ESC scenarios (JUST FIXED - NEEDS TESTS)
3. ⚠️ All 4 drop actions (create, join, move, ungroup)
4. ⚠️ Visual indicators match state

### P1 - High (Should have)

5. ⚠️ Keyboard accessibility
6. ⚠️ Drag overlay behavior
7. ⚠️ Error handling

### P2 - Medium (Nice to have)

8. ⚠️ Rapid operations
9. ⚠️ Collision detection edge cases
10. ⚠️ Screen reader announcements

## Coverage Summary

| Category        | Unit Tests | Integration Tests | E2E Tests | Status             |
| --------------- | ---------- | ----------------- | --------- | ------------------ |
| State Machine   | 48/48 ✓    | -                 | -         | COMPLETE           |
| Event Lifecycle | -          | 0/3 ✗             | 0/3 ✗     | MISSING            |
| Visual Feedback | -          | 0/8 ✗             | 0/8 ✗     | MISSING            |
| Actions         | -          | 0/5 ✗             | 0/5 ✗     | MISSING            |
| Cancel/ESC      | -          | 0/2 ✗             | 0/2 ✗     | CRITICAL BUG FIXED |
| Keyboard        | -          | 0/2 ✗             | 0/2 ✗     | MISSING            |
| Errors          | -          | 0/2 ✗             | 0/2 ✗     | MISSING            |

**Total: 48/96 tests (50% coverage)**
**Critical gap: No browser-based tests for actual drag/drop interactions**
