import { test, expect } from "@playwright/test";

test.describe("Comments System", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto("/");
  });

  test("should post a comment on an idea", async ({ page }) => {
    // Create a new session first
    await page.click('a[href="/session/create"]');
    await page.fill('input[name="sessionName"]', "Test Session for Comments");
    await page.fill('input[name="categoryName"]', "Test Category");
    await page.click('button[type="submit"]');

    // Wait for redirect to session page
    await page.waitForURL(/\/session\/[^/]+$/);

    // Navigate to admin page to progress stages
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split("/").pop();
    await page.goto(`/session/${sessionId}/admin`);

    // Progress to idea collection stage
    await page.click('button:has-text("Start Green Room")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Start Idea Collection")');

    // Go back to participant view
    await page.goto(`/session/${sessionId}`);

    // Submit an idea
    await page.fill(
      'textarea[placeholder*="idea"]',
      "Test idea for commenting",
    );
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(1000);

    // Progress to grouping stage via admin
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Grouping")');

    // Go back to participant view
    await page.goto(`/session/${sessionId}`);
    await page.waitForTimeout(500);

    // Find and click comment button on the idea
    const commentButton = page.locator('[aria-label="View comments"]').first();
    await expect(commentButton).toBeVisible({ timeout: 10000 });
    await commentButton.click();

    // Wait for comment dialog
    await expect(page.locator('[data-testid="comment-thread"]')).toBeVisible();

    // Post a comment
    await page.fill('[data-testid="comment-input"]', "This is a test comment");
    await page.click('[data-testid="post-comment-button"]');

    // Verify comment appears
    await expect(
      page.locator('[data-testid="comment"]', {
        hasText: "This is a test comment",
      }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should reply to a comment", async ({ page }) => {
    // Create session and add idea with comment (reuse previous flow)
    await page.click('a[href="/session/create"]');
    await page.fill('input[name="sessionName"]', "Test Session for Replies");
    await page.fill('input[name="categoryName"]', "Test Category");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/session\/[^/]+$/);

    const sessionUrl = page.url();
    const sessionId = sessionUrl.split("/").pop();

    // Progress to grouping stage quickly
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Green Room")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Start Idea Collection")');
    await page.goto(`/session/${sessionId}`);
    await page.fill('textarea[placeholder*="idea"]', "Idea for reply test");
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(800);
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Grouping")');
    await page.goto(`/session/${sessionId}`);
    await page.waitForTimeout(500);

    // Open comments and post initial comment
    const commentButton = page.locator('[aria-label="View comments"]').first();
    await commentButton.click();
    await page.fill('[data-testid="comment-input"]', "Parent comment");
    await page.click('[data-testid="post-comment-button"]');
    await page.waitForTimeout(1000);

    // Click reply button
    await page.click('[data-testid="reply-button"]');

    // Verify "Replying to" indicator appears
    await expect(page.locator("text=Replying to")).toBeVisible();

    // Post reply
    await page.fill('[data-testid="comment-input"]', "This is a reply");
    await page.click('[data-testid="post-comment-button"]');

    // Verify reply appears nested
    await expect(
      page.locator('[data-testid="comment"]', { hasText: "This is a reply" }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should edit own comment", async ({ page }) => {
    // Setup: Create session with idea and comment
    await page.click('a[href="/session/create"]');
    await page.fill('input[name="sessionName"]', "Test Session for Editing");
    await page.fill('input[name="categoryName"]', "Test Category");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/session\/[^/]+$/);

    const sessionUrl = page.url();
    const sessionId = sessionUrl.split("/").pop();

    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Green Room")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Start Idea Collection")');
    await page.goto(`/session/${sessionId}`);
    await page.fill('textarea[placeholder*="idea"]', "Idea for edit test");
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(800);
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Grouping")');
    await page.goto(`/session/${sessionId}`);
    await page.waitForTimeout(500);

    const commentButton = page.locator('[aria-label="View comments"]').first();
    await commentButton.click();
    await page.fill('[data-testid="comment-input"]', "Original comment text");
    await page.click('[data-testid="post-comment-button"]');
    await page.waitForTimeout(1000);

    // Click edit button
    await page.click('[data-testid="edit-button"]');

    // Edit the comment
    const textarea = page.locator("textarea").last();
    await textarea.clear();
    await textarea.fill("Edited comment text");
    await page.locator('button:has-text("Save")').click();

    // Verify edited text appears with "edited" indicator
    await expect(
      page.locator('[data-testid="comment"]', {
        hasText: "Edited comment text",
      }),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=(edited)")).toBeVisible();
  });

  test("should delete own comment", async ({ page }) => {
    // Setup: Create session with idea and comment
    await page.click('a[href="/session/create"]');
    await page.fill('input[name="sessionName"]', "Test Session for Deleting");
    await page.fill('input[name="categoryName"]', "Test Category");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/session\/[^/]+$/);

    const sessionUrl = page.url();
    const sessionId = sessionUrl.split("/").pop();

    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Green Room")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Start Idea Collection")');
    await page.goto(`/session/${sessionId}`);
    await page.fill('textarea[placeholder*="idea"]', "Idea for delete test");
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(800);
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Grouping")');
    await page.goto(`/session/${sessionId}`);
    await page.waitForTimeout(500);

    const commentButton = page.locator('[aria-label="View comments"]').first();
    await commentButton.click();
    await page.fill('[data-testid="comment-input"]', "Comment to be deleted");
    await page.click('[data-testid="post-comment-button"]');
    await page.waitForTimeout(1000);

    // Click delete button and confirm
    page.on("dialog", (dialog) => dialog.accept());
    await page.click('[data-testid="delete-button"]');

    // Verify comment is removed
    await expect(
      page.locator('[data-testid="comment"]', {
        hasText: "Comment to be deleted",
      }),
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("should show comment count in real-time", async ({ page }) => {
    // Create session and navigate to grouping
    await page.click('a[href="/session/create"]');
    await page.fill('input[name="sessionName"]', "Test Session for Count");
    await page.fill('input[name="categoryName"]', "Test Category");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/session\/[^/]+$/);

    const sessionUrl = page.url();
    const sessionId = sessionUrl.split("/").pop();

    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Green Room")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Start Idea Collection")');
    await page.goto(`/session/${sessionId}`);
    await page.fill('textarea[placeholder*="idea"]', "Idea for count test");
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(800);
    await page.goto(`/session/${sessionId}/admin`);
    await page.click('button:has-text("Start Grouping")');
    await page.goto(`/session/${sessionId}`);
    await page.waitForTimeout(500);

    // Verify initial count is 0
    const commentButton = page.locator('[aria-label="View comments"]').first();
    await expect(commentButton).toContainText("0");

    // Add a comment
    await commentButton.click();
    await page.fill('[data-testid="comment-input"]', "First comment");
    await page.click('[data-testid="post-comment-button"]');
    await page.waitForTimeout(1000);

    // Close dialog
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Verify count updated to 1
    await expect(commentButton).toContainText("1", { timeout: 5000 });
  });
});
