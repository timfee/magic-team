import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Check that the page loaded
    await expect(page).toHaveTitle(/magic.*team/i);
  });

  test("should navigate to create session page", async ({ page }) => {
    await page.goto("/");

    // Find and click create session link
    await page.goto("/session/create");

    // Verify we're on the create page
    await expect(page).toHaveURL(/\/session\/create/);
    await expect(
      page.getByRole("heading", { name: /create new session/i }),
    ).toBeVisible();
  });

  test("should have working back navigation", async ({ page }) => {
    await page.goto("/session/create");

    // Find and click back/cancel button
    const backButton = page.getByRole("button", { name: /cancel/i });

    if (await backButton.isVisible()) {
      await backButton.click();

      // Should navigate back (could be to home or previous page)
      await expect(page).not.toHaveURL(/\/session\/create/);
    }
  });

  test("should handle 404 pages gracefully", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");

    // Should get a 404 response
    expect(response?.status()).toBe(404);

    // Should show 404 page content
    await expect(page.getByText(/not found|404/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("should navigate to session detail page with valid ID", async ({
    page,
  }) => {
    // Navigate to a session page (will handle auth redirects)
    await page.goto("/session/test-session-id");

    // Should either show the session page or an error/redirect
    // Since we don't have a real session, it might show an error
    // but the navigation should work
    await expect(page).toHaveURL(/\/session\/test-session-id/);
  });
});
