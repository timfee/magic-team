/**
 * Full Session Flow E2E Tests
 *
 * CRITICAL: These tests validate the COMPLETE user journey through a retrospective
 * session from creation to finalization. These are the most important E2E tests
 * in the entire suite.
 *
 * Test Flow:
 * 1. Create session with categories
 * 2. GREEN_ROOM: Users join and see each other
 * 3. IDEA_COLLECTION: Multiple users submit ideas
 * 4. VOTING: Users allocate votes
 * 5. GROUPING: Drag-drop ideas into groups
 * 6. FINALIZATION: Select top ideas, export
 * 7. POST_SESSION: Archive session
 *
 * Prerequisites:
 * - Firebase emulators must be running
 * - Dev server must be running on localhost:3000
 */

import { test, expect } from "@playwright/test";
import { authenticatePage } from "./helpers/auth";

test.describe("Full Session Flow - Single User", () => {
  test("should complete entire session lifecycle", async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds
    // ========================================================================
    // SETUP: Authenticate user
    // ========================================================================

    // Capture console messages (all types)
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const consoleLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('[Browser Error]', text);
      } else if (msg.type() === 'warning' || msg.type() === 'warn') {
        consoleWarnings.push(text);
        console.log('[Browser Warn]', text);
      } else if (text.includes('[E2E]') || text.includes('[Firebase]')) {
        consoleLogs.push(text);
        console.log('[Browser Log]', text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log('[Page Error]', error.message);
      consoleErrors.push(error.message);
    });

    await authenticatePage(page);

    // ========================================================================
    // 1. CREATE SESSION
    // ========================================================================
    await page.goto("/");

    // Wait for auth to initialize (check for Create Session link in header)
    await expect(page.getByRole('link', { name: 'Create Session' }).first()).toBeVisible({
      timeout: 10000,
    });

    // Close Next.js dev overlay if present
    const devOverlayClose = page.locator('button:has-text("Collapse issues badge")');
    if (await devOverlayClose.isVisible().catch(() => false)) {
      await devOverlayClose.click();
      await page.waitForTimeout(300);
    }

    // Navigate to create session page
    await page.getByRole('link', { name: 'Create Session' }).first().click();
    await expect(page).toHaveURL(/\/session\/create/);

    // Wait for page to be fully hydrated - Next.js 15 + React 19 issue
    // Wait for network to be idle (hydration complete)
    await page.waitForLoadState('networkidle');
    console.log("[DEBUG] Page hydration complete (networkidle)");

    // Wait for Firebase Auth to complete - look for form to be ready
    // The form should not show "Sign In Required" message if auth worked
    await page.waitForTimeout(2000); // Give Firebase auth time to complete
    console.log("[DEBUG] Waited for auth to complete");

    // Check if the form rendered (not the Sign In Required message)
    const hasSignInMessage = await page.locator('text=/sign in required|must be signed in/i').isVisible().catch(() => false);
    if (hasSignInMessage) {
      console.log("[DEBUG] ERROR: Still showing 'Sign In Required' - auth failed!");
      throw new Error("Authentication failed - Sign In Required message still showing");
    }

    console.log("[DEBUG] Form is visible - auth succeeded");

    // Fill session details - wait between fills to avoid hydration issues
    await page.fill('input#name', "E2E Full Flow Test Session");
    await page.waitForTimeout(100);

    await page.fill(
      'textarea#description',
      "Testing complete session flow from creation to archive",
    );
    await page.waitForTimeout(100);

    // Verify default categories exist
    const categoryInputs = page.locator('input[placeholder*="Category"]');
    await expect(categoryInputs).toHaveCount(3, { timeout: 5000 });

    // Customize categories - wait between each fill
    await categoryInputs.nth(0).fill("What Went Well");
    await page.waitForTimeout(100);

    await categoryInputs.nth(1).fill("What Could Improve");
    await page.waitForTimeout(100);

    await categoryInputs.nth(2).fill("Action Items");
    await page.waitForTimeout(100);

    // Wait for form to stabilize after fills
    await page.waitForTimeout(1000);
    console.log("[DEBUG] Form filled, waiting for stabilization");

    // Debug: Check if any error messages are showing
    const errorMessage = await page.locator('.bg-red-50, [class*="error"]').textContent().catch(() => null);
    if (errorMessage) {
      console.log("[DEBUG] Error message on form:", errorMessage);
    }

    // Monitor Firestore requests
    const firestoreRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('127.0.0.1:8080') || url.includes('firestore')) {
        firestoreRequests.push(`${request.method()} ${url}`);
        console.log('[Firestore Request]', request.method(), url.substring(0, 100));
      }
    });

    // Check form validity before submitting
    const formDebugInfo = await page.evaluate(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (!form) return { found: false };

      const sessionName = (form.querySelector('input#name') as HTMLInputElement)?.value;
      const categoryInputs = Array.from(form.querySelectorAll('input[placeholder="Category name"]')) as HTMLInputElement[];
      const categories = categoryInputs.map(input => input.value);

      return {
        found: true,
        validity: form.checkValidity(),
        sessionName,
        categories,
        formAction: form.action,
        formMethod: form.method,
      };
    });

    console.log("[DEBUG] Form before submit:", JSON.stringify(formDebugInfo, null, 2));

    if (formDebugInfo.found && !formDebugInfo.validity) {
      console.log("[DEBUG] FORM IS INVALID - HTML5 validation will prevent submission!");
    }

    // Create session - submit the form programmatically
    console.log("[DEBUG] Submitting form...");

    try {
      // Submit form and wait for navigation
      await Promise.all([
        page.waitForURL(/\/session\/[a-f0-9-]{20,}$/, { timeout: 15000 }),
        page.evaluate(() => {
          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          } else {
            throw new Error('Form not found');
          }
        }),
      ]);

      console.log("[DEBUG] Successfully navigated to session page");
    } catch (error) {
      // If navigation fails, capture debug info
      console.log("[DEBUG] Failed to navigate after form submit");
      console.log("[DEBUG] Current URL:", page.url());

      const submitError = await page.locator('.bg-red-50').textContent().catch(() => null);
      console.log("[DEBUG] Error on page:", submitError || "No error shown");

      // Check console errors
      console.log("[DEBUG] Console errors captured:", consoleErrors.join(", "));
      console.log("[DEBUG] Firestore requests made:", firestoreRequests.length);

      // Try to take screenshot (may fail if page crashed)
      try {
        await page.screenshot({ path: 'debug-form-submit-failure.png' });
      } catch (screenshotError) {
        console.log("[DEBUG] Failed to take screenshot - page may have crashed");
      }

      throw error;
    }
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split("/").pop();
    expect(sessionId).toBeTruthy();
    expect(sessionId).not.toBe("create");

    console.log(`[Flow Test] Created session: ${sessionId}`);

    // ========================================================================
    // 2. GREEN ROOM STAGE
    // ========================================================================

    // Should start in GREEN_ROOM stage
    await expect(page.locator("text=/waiting.*facilitator/i")).toBeVisible({
      timeout: 10000,
    });

    // Verify participant count shows 1 (the owner)
    await expect(page.locator("text=/1.*participant/i")).toBeVisible({
      timeout: 5000,
    });

    // Navigate to admin panel
    await page.goto(`/session/${sessionId}/admin`);
    await expect(
      page.locator('button:has-text("Start Idea Collection")'),
    ).toBeVisible();

    // Advance to IDEA_COLLECTION stage
    await page.click('button:has-text("Start Idea Collection")');
    await page.waitForTimeout(500);

    // ========================================================================
    // 3. IDEA COLLECTION STAGE
    // ========================================================================

    // Return to participant view
    await page.goto(`/session/${sessionId}`);

    // Verify stage changed
    await expect(
      page.locator("text=/submit.*idea|add.*idea|idea collection/i"),
    ).toBeVisible({ timeout: 10000 });

    // Submit 3 ideas across different categories
    const ideas = [
      {
        category: "What Went Well",
        content: "Great team collaboration during sprint planning",
      },
      {
        category: "What Could Improve",
        content: "Need better documentation for API endpoints",
      },
      {
        category: "Action Items",
        content: "Schedule knowledge sharing session next week",
      },
    ];

    for (const idea of ideas) {
      // Fill idea content
      const textarea = page.locator('textarea[placeholder*="idea"]');
      await textarea.fill(idea.content);

      // Select category
      const categorySelector = page.locator(
        `select[name="categoryId"], button:has-text("${idea.category}")`,
      );
      if ((await categorySelector.count()) > 0) {
        await categorySelector.first().click();
      }

      // Submit
      await page.click('button:has-text("Submit")');
      await page.waitForTimeout(800);

      // Verify idea appears
      await expect(page.locator(`text=${idea.content.slice(0, 20)}`)).toBeVisible({
        timeout: 5000,
      });
    }

    console.log(`[Flow Test] Submitted ${ideas.length} ideas`);

    // Verify all ideas visible
    for (const idea of ideas) {
      await expect(page.locator(`text=${idea.content.slice(0, 20)}`)).toBeVisible();
    }

    // ========================================================================
    // 4. VOTING STAGE
    // ========================================================================

    // Advance to VOTING stage
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Voting")');
    await page.waitForTimeout(500);

    // Return to participant view
    await page.goto(`/session/${sessionId}`);

    // Verify voting UI appears
    await expect(
      page.locator(
        "text=/vote|cast.*vote|votes remaining|allocate.*votes/i",
      ),
    ).toBeVisible({ timeout: 10000 });

    // Verify votes remaining indicator
    await expect(page.locator("text=/5.*votes?.*remaining/i")).toBeVisible({
      timeout: 5000,
    });

    // Vote on the first 3 ideas
    const voteButtons = page.locator('button:has-text("Vote"), button[aria-label*="Vote"]');
    const voteCount = await voteButtons.count();
    const votesToCast = Math.min(3, voteCount);

    for (let i = 0; i < votesToCast; i++) {
      await voteButtons.nth(i).click();
      await page.waitForTimeout(500);
    }

    console.log(`[Flow Test] Cast ${votesToCast} votes`);

    // Verify votes remaining updated
    await expect(page.locator("text=/2.*votes?.*remaining/i")).toBeVisible({
      timeout: 5000,
    });

    // Verify vote count displayed on ideas
    await expect(page.locator('[data-testid="vote-count"]').first()).toBeVisible({
      timeout: 3000,
    });

    // ========================================================================
    // 5. GROUPING STAGE
    // ========================================================================

    // Advance to GROUPING stage
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Grouping")');
    await page.waitForTimeout(500);

    // Return to participant view
    await page.goto(`/session/${sessionId}`);

    // Verify grouping UI appears
    await expect(page.locator("text=/group ideas|drag.*group/i")).toBeVisible({
      timeout: 10000,
    });

    // Find ungrouped ideas
    const ideaCards = page.locator('[data-testid="idea-card"]');
    const ideaCount = await ideaCards.count();
    expect(ideaCount).toBeGreaterThanOrEqual(3);

    // Create a group by dragging idea 1 onto idea 2
    const idea1 = ideaCards.nth(0);
    const idea2 = ideaCards.nth(1);

    await expect(idea1).toBeVisible();
    await expect(idea2).toBeVisible();

    // Get bounding boxes
    const box1 = await idea1.boundingBox();
    const box2 = await idea2.boundingBox();

    if (box1 && box2) {
      // Drag idea1 to idea2
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2, {
        steps: 5,
      });
      await page.waitForTimeout(200);
      await page.mouse.up();

      // Wait for group creation
      await page.waitForTimeout(1000);

      // Verify group was created
      await expect(page.locator('[data-testid="idea-group"]')).toHaveCount(1, {
        timeout: 5000,
      });

      console.log("[Flow Test] Created idea group");
    }

    // ========================================================================
    // 6. FINALIZATION STAGE
    // ========================================================================

    // Advance to FINALIZATION stage
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Finalization")');
    await page.waitForTimeout(500);

    // Return to participant view
    await page.goto(`/session/${sessionId}`);

    // Verify finalization UI appears
    await expect(
      page.locator("text=/finalize|top ideas|export|priority/i"),
    ).toBeVisible({ timeout: 10000 });

    // Select top ideas (click checkboxes or selection UI)
    const selectButtons = page.locator(
      'button:has-text("Select"), input[type="checkbox"]',
    );
    const selectCount = await selectButtons.count();

    if (selectCount > 0) {
      // Select first 2 ideas
      for (let i = 0; i < Math.min(2, selectCount); i++) {
        await selectButtons.nth(i).click();
        await page.waitForTimeout(300);
      }

      console.log("[Flow Test] Selected top ideas");
    }

    // Verify export buttons available
    await expect(
      page.locator('button:has-text("Export"), button:has-text("Download")'),
    ).toHaveCount(1, { timeout: 5000 });

    // ========================================================================
    // 7. POST SESSION / ARCHIVE
    // ========================================================================

    // Advance to POST_SESSION stage
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Complete Session"), button:has-text("End Session")');
    await page.waitForTimeout(500);

    // Return to participant view
    await page.goto(`/session/${sessionId}`);

    // Verify post-session view
    await expect(
      page.locator("text=/session complete|results|summary/i"),
    ).toBeVisible({ timeout: 10000 });

    // Archive session (owner action)
    await page.goto(`/session/${sessionId}/admin`);
    const archiveButton = page.locator('button:has-text("Archive")');
    if ((await archiveButton.count()) > 0) {
      await archiveButton.click();
      await page.waitForTimeout(500);

      console.log("[Flow Test] Archived session");
    }

    // ========================================================================
    // VERIFICATION: Session Complete
    // ========================================================================

    // Navigate to homepage
    await page.goto("/");

    // Verify session appears in archived list
    await expect(
      page.locator('[data-testid="archived-sessions"], a[href*="archived"]'),
    ).toBeVisible({ timeout: 5000 });

    console.log("[Flow Test] ✅ COMPLETE: Full session flow test passed");
  });

  test("should handle incomplete session gracefully", async ({ page }) => {
    // Setup: Authenticate
    await authenticatePage(page);

    // Create session
    await page.goto("/session/create");
    await page.fill('input#name', "Incomplete Session Test");

    // Wait for form validation
    await page.waitForTimeout(300);

    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/[a-f0-9-]{20,}$/);

    const sessionId = page.url().split("/").pop();

    // Advance to IDEA_COLLECTION
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Idea Collection")');
    await page.waitForTimeout(300);

    // Go to participant view but DON'T submit ideas
    await page.goto(`/session/${sessionId}`);

    // Advance to VOTING (should work even with no ideas)
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Voting")');
    await page.waitForTimeout(300);

    await page.goto(`/session/${sessionId}`);

    // Verify empty state displayed
    await expect(
      page.locator("text=/no ideas|no votes|empty/i"),
    ).toBeVisible({ timeout: 10000 });

    console.log("[Flow Test] ✅ Handled empty session gracefully");
  });

  test("should preserve data across stage transitions", async ({ page }) => {
    // Setup: Authenticate
    await authenticatePage(page);

    // Create session and add ideas
    await page.goto("/session/create");
    await page.fill('input#name', "Data Persistence Test");

    // Wait for form validation
    await page.waitForTimeout(300);

    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/[a-f0-9-]{20,}$/);

    const sessionId = page.url().split("/").pop();

    // Advance to IDEA_COLLECTION
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Idea Collection")');
    await page.waitForTimeout(300);

    // Submit an idea
    await page.goto(`/session/${sessionId}`);
    const testContent = `Unique idea ${Date.now()}`;
    await page.fill('textarea[placeholder*="idea"]', testContent);
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(800);

    // Verify idea appears
    await expect(page.locator(`text=${testContent.slice(0, 20)}`)).toBeVisible();

    // Advance through multiple stages
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Voting")');
    await page.waitForTimeout(300);

    await page.goto(`/session/${sessionId}`);
    await expect(page.locator(`text=${testContent.slice(0, 20)}`)).toBeVisible();

    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Grouping")');
    await page.waitForTimeout(300);

    await page.goto(`/session/${sessionId}`);
    await expect(page.locator(`text=${testContent.slice(0, 20)}`)).toBeVisible();

    console.log(
      "[Flow Test] ✅ Data persisted across IDEA_COLLECTION → VOTING → GROUPING",
    );
  });
});

test.describe("Full Session Flow - Presentation View Sync", () => {
  test("should sync presentation view with session stages", async ({ page }) => {
    // Setup: Authenticate
    await authenticatePage(page);

    // Create session
    await page.goto("/session/create");
    await page.fill('input#name', "Presentation Sync Test");

    // Wait for form validation
    await page.waitForTimeout(300);

    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/[a-f0-9-]{20,}$/);

    const sessionId = page.url().split("/").pop();

    // Open presentation view in new tab
    const presentationPage = await page.context().newPage();
    await presentationPage.goto(`/session/${sessionId}/presentation`);

    // Verify GREEN_ROOM presentation view
    await expect(
      presentationPage.locator("text=/green room|waiting/i"),
    ).toBeVisible({ timeout: 10000 });

    // Advance to IDEA_COLLECTION in admin
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Idea Collection")');
    await page.waitForTimeout(500);

    // Verify presentation view updated
    await expect(
      presentationPage.locator("text=/idea collection|submit ideas/i"),
    ).toBeVisible({ timeout: 5000 });

    // Advance to VOTING
    await page.click('button:has-text("Start Voting")');
    await page.waitForTimeout(500);

    // Verify presentation view updated
    await expect(
      presentationPage.locator("text=/voting|cast votes/i"),
    ).toBeVisible({ timeout: 5000 });

    await presentationPage.close();

    console.log("[Flow Test] ✅ Presentation view synced with session stages");
  });
});
