import { test, expect } from "@playwright/test";

test.describe("Session Viewing", () => {
  test("should load session board page", async ({ page }) => {
    // Navigate to a test session
    await page.goto("/session/test-id");

    // Page should load (might show loading state or require auth)
    await expect(page).toHaveURL(/\/session\/test-id/);
  });

  test("should show session header with navigation", async ({ page }) => {
    await page.goto("/session/test-id");

    // Should have back to sessions link
    const backLink = page.getByRole("link", { name: /back to.*session/i });
    await expect(backLink).toBeVisible({ timeout: 10000 });
  });

  test("should display connection status", async ({ page }) => {
    await page.goto("/session/test-id");

    // Should show connection status (connected or disconnected)
    const statusText = page.getByText(/connected|disconnected/i);
    await expect(statusText).toBeVisible({ timeout: 10000 });
  });

  test("should show participant count", async ({ page }) => {
    await page.goto("/session/test-id");

    // Should display participant count
    const participantText = page.getByText(/participant/i);
    await expect(participantText).toBeVisible({ timeout: 10000 });
  });

  test("should display current stage", async ({ page }) => {
    await page.goto("/session/test-id");

    // Should show the current stage of the session
    // Possible stages: pre_session, green_room, idea_collection, etc.
    const stageElement = page.locator(
      "text=/pre.*session|green.*room|idea|voting/i",
    );
    await expect(stageElement.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show admin controls link", async ({ page }) => {
    await page.goto("/session/test-id");

    // Should have admin controls link
    const adminLink = page.getByRole("link", { name: /admin/i });
    await expect(adminLink).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to admin page", async ({ page }) => {
    await page.goto("/session/test-id");

    // Click admin controls link
    const adminLink = page.getByRole("link", { name: /admin.*control/i });
    await adminLink.click();

    // Should navigate to admin page
    await expect(page).toHaveURL(/\/session\/test-id\/admin/);

    // Admin page should load
    await expect(page.getByRole("heading", { name: /admin/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show authentication requirement for admin page", async ({
    page,
  }) => {
    await page.goto("/session/test-id/admin");

    // Should either show admin controls or authentication requirement
    const authRequired = page.getByText(/authentication required|sign in/i);
    const adminHeading = page.getByRole("heading", { name: /admin/i });

    // One of these should be visible
    await expect(authRequired.or(adminHeading).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
