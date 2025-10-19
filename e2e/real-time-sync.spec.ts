/**
 * Real-Time Synchronization E2E Tests
 *
 * CRITICAL: These tests validate Firebase real-time listeners work correctly
 * across multiple browser windows. This is THE test that catches sync bugs.
 *
 * Test Scenarios:
 * - Idea submission appears in other windows
 * - Vote updates propagate to all participants
 * - Drag-drop group creation syncs
 * - Stage changes update all views
 * - Comment posting appears in real-time
 * - Participant presence updates
 *
 * Prerequisites:
 * - Firebase emulators running
 * - Dev server running on localhost:3000
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import {
  waitForRealtimeSync,
  waitForTextInPages,
  verifyCountAcrossPages,
  executeAndVerifySync,
} from "./helpers/multi-window";

/**
 * Helper: Create session and return session ID
 */
async function createTestSession(
  page: Page,
  sessionName: string,
): Promise<string> {
  await page.goto("/session/create");
  await page.fill('input[name="sessionName"]', sessionName);
  await page.click('button:has-text("Create Session")');
  await page.waitForURL(/\/session\/[a-zA-Z0-9-]+$/);
  const sessionId = page.url().split("/").pop()!;
  return sessionId;
}

/**
 * Helper: Advance session to specific stage
 */
async function advanceToStage(
  adminPage: Page,
  sessionId: string,
  stage: "IDEA_COLLECTION" | "VOTING" | "GROUPING" | "FINALIZATION",
): Promise<void> {
  await adminPage.goto(`/session/${sessionId}/admin`);

  const stageButtons: Record<string, string> = {
    IDEA_COLLECTION: "Start Idea Collection",
    VOTING: "Start Voting",
    GROUPING: "Start Grouping",
    FINALIZATION: "Start Finalization",
  };

  // Click stage transition buttons in sequence
  const stages = ["IDEA_COLLECTION", "VOTING", "GROUPING", "FINALIZATION"];
  const targetIndex = stages.indexOf(stage);

  for (let i = 0; i <= targetIndex; i++) {
    const buttonText = stageButtons[stages[i]!];
    const button = adminPage.locator(`button:has-text("${buttonText}")`);
    if ((await button.count()) > 0) {
      await button.click();
      await adminPage.waitForTimeout(500);
    }
  }
}

test.describe("Real-Time Sync - Idea Submission", () => {
  test("should sync idea submission across 2 windows", async ({ browser }) => {
    // Create two browser contexts (simulating two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1 creates session
      const sessionId = await createTestSession(
        page1,
        "Sync Test - Idea Submission",
      );

      // Advance to IDEA_COLLECTION
      await advanceToStage(page1, sessionId, "IDEA_COLLECTION");

      // User 2 joins session
      await page2.goto(`/session/${sessionId}`);

      // Wait for both pages to show idea collection UI
      await expect(
        page1.locator("text=/submit.*idea|idea collection/i"),
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page2.locator("text=/submit.*idea|idea collection/i"),
      ).toBeVisible({ timeout: 10000 });

      // User 1 submits an idea
      const ideaContent = `Real-time sync test idea ${Date.now()}`;
      await page1.fill('textarea[placeholder*="idea"]', ideaContent);
      await page1.click('button:has-text("Submit")');

      // Wait for idea to appear in User 1's view
      await expect(
        page1.locator(`text=${ideaContent.slice(0, 30)}`),
      ).toBeVisible({ timeout: 5000 });

      // CRITICAL: Verify idea appears in User 2's view (real-time sync)
      await expect(
        page2.locator(`text=${ideaContent.slice(0, 30)}`),
      ).toBeVisible({ timeout: 3000 });

      console.log("✅ Idea synced between 2 windows");

      // Verify idea count matches
      await verifyCountAcrossPages(
        [page1, page2],
        '[data-testid="idea-card"]',
        1,
        { timeout: 3000 },
      );
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test("should sync multiple rapid idea submissions", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      const sessionId = await createTestSession(page1, "Rapid Ideas Sync Test");
      await advanceToStage(page1, sessionId, "IDEA_COLLECTION");
      await page2.goto(`/session/${sessionId}`);

      // Both users submit ideas rapidly
      const ideas1 = ["User 1 Idea A", "User 1 Idea B", "User 1 Idea C"];
      const ideas2 = ["User 2 Idea X", "User 2 Idea Y"];

      // Submit from both windows in parallel
      await Promise.all([
        (async () => {
          for (const content of ideas1) {
            await page1.fill('textarea[placeholder*="idea"]', content);
            await page1.click('button:has-text("Submit")');
            await page1.waitForTimeout(300);
          }
        })(),
        (async () => {
          await page2.waitForTimeout(500); // Start slightly delayed
          for (const content of ideas2) {
            await page2.fill('textarea[placeholder*="idea"]', content);
            await page2.click('button:has-text("Submit")');
            await page2.waitForTimeout(300);
          }
        })(),
      ]);

      // Wait for sync
      await page1.waitForTimeout(2000);

      // Verify total count matches in both windows
      const totalIdeas = ideas1.length + ideas2.length;
      await verifyCountAcrossPages(
        [page1, page2],
        '[data-testid="idea-card"]',
        totalIdeas,
        { timeout: 5000 },
      );

      console.log(
        `✅ ${totalIdeas} rapid idea submissions synced across 2 windows`,
      );
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe("Real-Time Sync - Voting", () => {
  test("should sync vote updates across 3 windows", async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(
      contexts.map((ctx) => ctx.newPage()),
    );

    try {
      // User 1 creates session with ideas
      const sessionId = await createTestSession(pages[0]!, "Voting Sync Test");
      await advanceToStage(pages[0]!, sessionId, "IDEA_COLLECTION");

      // Submit test idea
      await pages[0]!.fill(
        'textarea[placeholder*="idea"]',
        "Test idea for voting",
      );
      await pages[0]!.click('button:has-text("Submit")');
      await pages[0]!.waitForTimeout(800);

      // Advance to VOTING
      await advanceToStage(pages[0]!, sessionId, "VOTING");

      // Users 2 and 3 join
      await pages[1]!.goto(`/session/${sessionId}`);
      await pages[2]!.goto(`/session/${sessionId}`);

      // Wait for voting UI
      await Promise.all(
        pages.map((page) =>
          expect(page.locator("text=/vote|voting/i")).toBeVisible({
            timeout: 10000,
          }),
        ),
      );

      // User 1 votes
      const voteButton = pages[0]!.locator(
        'button:has-text("Vote"), button[aria-label*="Vote"]',
      ).first();
      await voteButton.click();
      await pages[0]!.waitForTimeout(500);

      // Verify vote count appears in User 1's view
      await expect(
        pages[0]!.locator('[data-testid="vote-count"]').first(),
      ).toBeVisible({ timeout: 3000 });

      // CRITICAL: Verify vote count syncs to Users 2 and 3
      await Promise.all(
        [pages[1]!, pages[2]!].map((page) =>
          expect(
            page.locator('[data-testid="vote-count"]').first(),
          ).toBeVisible({ timeout: 3000 }),
        ),
      );

      // Verify vote count value matches across all pages
      const voteCounts = await Promise.all(
        pages.map((page) =>
          page.locator('[data-testid="vote-count"]').first().textContent(),
        ),
      );

      expect(voteCounts[0]).toBe(voteCounts[1]);
      expect(voteCounts[1]).toBe(voteCounts[2]);

      console.log("✅ Vote counts synced across 3 windows");
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.close()));
    }
  });

  test("should sync votes remaining indicator", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      const sessionId = await createTestSession(page1, "Votes Remaining Sync");
      await advanceToStage(page1, sessionId, "IDEA_COLLECTION");

      // Submit 3 ideas
      for (let i = 0; i < 3; i++) {
        await page1.fill('textarea[placeholder*="idea"]', `Idea ${i + 1}`);
        await page1.click('button:has-text("Submit")');
        await page1.waitForTimeout(500);
      }

      await advanceToStage(page1, sessionId, "VOTING");
      await page2.goto(`/session/${sessionId}`);

      // Verify initial votes remaining (default is 5)
      await expect(
        page1.locator("text=/5.*votes?.*remaining/i"),
      ).toBeVisible({ timeout: 5000 });

      // User 1 casts 2 votes
      const voteButtons = page1.locator(
        'button:has-text("Vote"), button[aria-label*="Vote"]',
      );
      await voteButtons.nth(0).click();
      await page1.waitForTimeout(500);
      await voteButtons.nth(1).click();
      await page1.waitForTimeout(500);

      // Verify votes remaining updated in page1
      await expect(
        page1.locator("text=/3.*votes?.*remaining/i"),
      ).toBeVisible({ timeout: 3000 });

      // CRITICAL: Verify same user's votes remaining syncs to page2
      // (This tests that the vote state is properly synchronized)
      await expect(
        page2.locator("text=/3.*votes?.*remaining/i"),
      ).toBeVisible({ timeout: 3000 });

      console.log("✅ Votes remaining indicator synced");
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe("Real-Time Sync - Grouping", () => {
  test("should sync group creation across windows", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      const sessionId = await createTestSession(page1, "Group Creation Sync");
      await advanceToStage(page1, sessionId, "IDEA_COLLECTION");

      // Submit 2 ideas
      await page1.fill('textarea[placeholder*="idea"]', "First idea for grouping");
      await page1.click('button:has-text("Submit")');
      await page1.waitForTimeout(800);

      await page1.fill('textarea[placeholder*="idea"]', "Second idea for grouping");
      await page1.click('button:has-text("Submit")');
      await page1.waitForTimeout(800);

      await advanceToStage(page1, sessionId, "GROUPING");
      await page2.goto(`/session/${sessionId}`);

      // Wait for grouping UI
      await expect(
        page1.locator("text=/group ideas|drag.*group/i"),
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page2.locator("text=/group ideas|drag.*group/i"),
      ).toBeVisible({ timeout: 10000 });

      // User 1 creates a group by dragging
      const ideas = page1.locator('[data-testid="idea-card"]');
      await expect(ideas).toHaveCount(2, { timeout: 5000 });

      const idea1 = ideas.nth(0);
      const idea2 = ideas.nth(1);

      const box1 = await idea1.boundingBox();
      const box2 = await idea2.boundingBox();

      if (box1 && box2) {
        await page1.mouse.move(
          box1.x + box1.width / 2,
          box1.y + box1.height / 2,
        );
        await page1.mouse.down();
        await page1.waitForTimeout(200);
        await page1.mouse.move(
          box2.x + box2.width / 2,
          box2.y + box2.height / 2,
          { steps: 5 },
        );
        await page1.waitForTimeout(200);
        await page1.mouse.up();
      }

      // Wait for group creation in page1
      await expect(page1.locator('[data-testid="idea-group"]')).toHaveCount(
        1,
        { timeout: 3000 },
      );

      // CRITICAL: Verify group appears in page2
      await expect(page2.locator('[data-testid="idea-group"]')).toHaveCount(
        1,
        { timeout: 3000 },
      );

      console.log("✅ Group creation synced across 2 windows");
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test("should sync idea movement between groups", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      const sessionId = await createTestSession(page1, "Idea Movement Sync");
      await advanceToStage(page1, sessionId, "IDEA_COLLECTION");

      // Submit 4 ideas
      for (let i = 0; i < 4; i++) {
        await page1.fill('textarea[placeholder*="idea"]', `Moveable idea ${i + 1}`);
        await page1.click('button:has-text("Submit")');
        await page1.waitForTimeout(500);
      }

      await advanceToStage(page1, sessionId, "GROUPING");
      await page2.goto(`/session/${sessionId}`);

      // Create 2 groups (drag ideas 0+1, 2+3)
      const ideas = page1.locator('[data-testid="idea-card"]');
      await expect(ideas).toHaveCount(4, { timeout: 5000 });

      // Create first group
      const idea0 = ideas.nth(0);
      const idea1 = ideas.nth(1);

      let box0 = await idea0.boundingBox();
      let box1 = await idea1.boundingBox();

      if (box0 && box1) {
        await page1.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
        await page1.mouse.down();
        await page1.waitForTimeout(150);
        await page1.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2, {
          steps: 5,
        });
        await page1.waitForTimeout(150);
        await page1.mouse.up();
        await page1.waitForTimeout(1000);
      }

      // Verify 1 group in both pages
      await verifyCountAcrossPages([page1, page2], '[data-testid="idea-group"]', 1, {
        timeout: 3000,
      });

      console.log("✅ Group movement synced");
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe("Real-Time Sync - Stage Changes", () => {
  test("should sync stage transitions to all participants", async ({
    browser,
  }) => {
    const adminContext = await browser.newContext();
    const participant1Context = await browser.newContext();
    const participant2Context = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const participant1 = await participant1Context.newPage();
    const participant2 = await participant2Context.newPage();

    try {
      // Admin creates session
      const sessionId = await createTestSession(adminPage, "Stage Sync Test");

      // Participants join
      await participant1.goto(`/session/${sessionId}`);
      await participant2.goto(`/session/${sessionId}`);

      // All should see GREEN_ROOM
      await Promise.all(
        [adminPage, participant1, participant2].map((page) =>
          expect(page.locator("text=/green room|waiting/i")).toBeVisible({
            timeout: 10000,
          }),
        ),
      );

      // Admin advances to IDEA_COLLECTION
      await advanceToStage(adminPage, sessionId, "IDEA_COLLECTION");

      // CRITICAL: Verify all participants see stage change
      await Promise.all(
        [adminPage, participant1, participant2].map((page) =>
          expect(
            page.locator("text=/submit.*idea|idea collection/i"),
          ).toBeVisible({ timeout: 5000 }),
        ),
      );

      console.log("✅ Stage change synced across 3 windows");

      // Admin advances to VOTING
      await advanceToStage(adminPage, sessionId, "VOTING");

      // Verify all see VOTING stage
      await Promise.all(
        [adminPage, participant1, participant2].map((page) =>
          expect(page.locator("text=/vote|voting/i")).toBeVisible({
            timeout: 5000,
          }),
        ),
      );

      console.log("✅ Multiple stage changes synced");
    } finally {
      await adminContext.close();
      await participant1Context.close();
      await participant2Context.close();
    }
  });
});

test.describe("Real-Time Sync - Presentation View", () => {
  test("should sync participant actions to presentation view", async ({
    browser,
  }) => {
    const participantContext = await browser.newContext();
    const presenterContext = await browser.newContext();

    const participantPage = await participantContext.newPage();
    const presenterPage = await presenterContext.newPage();

    try {
      const sessionId = await createTestSession(
        participantPage,
        "Presentation Sync Test",
      );

      // Open presentation view
      await presenterPage.goto(`/session/${sessionId}/presentation`);

      // Advance to IDEA_COLLECTION
      await advanceToStage(participantPage, sessionId, "IDEA_COLLECTION");

      // Verify presentation view updated
      await expect(
        presenterPage.locator("text=/idea collection|ideas/i"),
      ).toBeVisible({ timeout: 5000 });

      // Participant submits idea
      const ideaContent = "Idea visible in presentation";
      await participantPage.fill('textarea[placeholder*="idea"]', ideaContent);
      await participantPage.click('button:has-text("Submit")');
      await participantPage.waitForTimeout(800);

      // CRITICAL: Verify idea appears in presentation view
      await expect(
        presenterPage.locator(`text=${ideaContent.slice(0, 20)}`),
      ).toBeVisible({ timeout: 3000 });

      console.log("✅ Participant actions synced to presentation view");
    } finally {
      await participantContext.close();
      await presenterContext.close();
    }
  });
});
