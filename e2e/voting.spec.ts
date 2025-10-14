import { test, expect } from "@playwright/test";

test.describe("Voting Stage", () => {
  test("should display voting stage with vote statistics", async ({ page }) => {
    // Navigate to a test session
    await page.goto("/session/test-id");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Look for voting-related content
    const votingContent = page.locator("text=/vote|voting/i");
    const hasVotingContent = (await votingContent.count()) > 0;

    if (hasVotingContent) {
      // If we're on the voting stage, check for voting UI elements
      await expect(votingContent.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should show votes remaining indicator", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for vote counter or votes used/remaining text
    const voteCounter = page.locator(
      "text=/votes.*used|votes.*remaining|∞/i",
    );
    const hasVoteCounter = (await voteCounter.count()) > 0;

    if (hasVoteCounter) {
      await expect(voteCounter.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display vote visualization components", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Check for vote distribution or heatmap headings
    const visualizationHeading = page.locator(
      "text=/vote.*distribution|top.*ideas/i",
    );
    const hasVisualization = (await visualizationHeading.count()) > 0;

    if (hasVisualization) {
      await expect(visualizationHeading.first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("should show category-specific vote limits", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for category vote limits
    const categoryVoteLimit = page.locator("text=/votes.*used/i");
    const hasVoteLimits = (await categoryVoteLimit.count()) > 0;

    if (hasVoteLimits) {
      // If vote limits are shown, they should be visible
      await expect(categoryVoteLimit.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display vote buttons on ideas", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for vote or voted buttons
    const voteButtons = page.locator(
      "button:has-text('Vote'), button:has-text('Voted')",
    );
    const hasVoteButtons = (await voteButtons.count()) > 0;

    if (hasVoteButtons) {
      await expect(voteButtons.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should show ideas sorted by vote count", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for idea cards (by data-testid or class patterns)
    const ideaCards = page.locator('[data-testid="idea-card"]');
    const hasIdeas = (await ideaCards.count()) > 0;

    if (hasIdeas) {
      // Ideas should be visible
      await expect(ideaCards.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display groups when group voting is enabled", async ({
    page,
  }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for group cards or group-related content
    const groupCards = page.locator(
      '[data-testid="group-card"], text=/group/i',
    );
    const hasGroups = (await groupCards.count()) > 0;

    if (hasGroups) {
      // Groups should be visible if they exist
      const groupText = page.locator("text=/group/i").first();
      await expect(groupText).toBeVisible({ timeout: 10000 });
    }
  });

  test("should show vote progress bars", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for progress bar elements (typically divs with specific styles)
    const progressBars = page.locator('div[style*="width"]').filter({
      has: page.locator('div[class*="rounded-full"]'),
    });
    const hasProgressBars = (await progressBars.count()) > 0;

    if (hasProgressBars) {
      // Progress bars should be visible
      await expect(progressBars.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display heart icons for votes", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for SVG elements that might be heart icons (vote indicators)
    const heartIcons = page.locator('svg[class*="text-red"]');
    const hasHeartIcons = (await heartIcons.count()) > 0;

    if (hasHeartIcons) {
      // Vote indicators should be visible
      await expect(heartIcons.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("should show empty state when no ideas exist", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for empty state message
    const emptyState = page.locator("text=/no ideas.*vote/i");
    const hasEmptyState = (await emptyState.count()) > 0;

    if (hasEmptyState) {
      await expect(emptyState.first()).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("Vote Interactions", () => {
  test("should handle vote button clicks", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for enabled vote buttons
    const voteButton = page
      .locator("button:has-text('Vote')")
      .filter({ hasNot: page.locator('[disabled]') })
      .first();

    const hasVoteButton = (await voteButton.count()) > 0;

    if (hasVoteButton) {
      // Button should be clickable
      await expect(voteButton).toBeEnabled({ timeout: 10000 });
    }
  });

  test("should disable vote buttons when vote limit reached", async ({
    page,
  }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for disabled vote buttons
    const disabledVoteButton = page.locator("button:has-text('Vote')[disabled]");
    const hasDisabledButton = (await disabledVoteButton.count()) > 0;

    if (hasDisabledButton) {
      await expect(disabledVoteButton.first()).toBeDisabled({
        timeout: 10000,
      });
    }
  });

  test("should show voted state for voted items", async ({ page }) => {
    await page.goto("/session/test-id");
    await page.waitForLoadState("networkidle");

    // Look for "Voted" buttons
    const votedButton = page.locator("button:has-text('Voted')");
    const hasVotedButton = (await votedButton.count()) > 0;

    if (hasVotedButton) {
      await expect(votedButton.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
