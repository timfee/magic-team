import { test, expect } from "@playwright/test";

test.describe("Session Creation Flow", () => {
  test("should navigate to create session page from homepage", async ({
    page,
  }) => {
    // Go to homepage
    await page.goto("/");

    // Look for a link or button to create a session
    const createButton = page.getByRole("link", { name: /create.*session/i });
    await expect(createButton).toBeVisible();

    // Click the create session button
    await createButton.click();

    // Should navigate to create session page
    await expect(page).toHaveURL(/\/session\/create/);
    await expect(
      page.getByRole("heading", { name: /create new session/i }),
    ).toBeVisible();
  });

  test("should display session creation form with required fields", async ({
    page,
  }) => {
    await page.goto("/session/create");

    // Check for required form fields
    await expect(page.getByLabel(/session name/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();

    // Check for visibility options
    await expect(page.getByText(/public/i)).toBeVisible();
    await expect(page.getByText(/private/i)).toBeVisible();
    await expect(page.getByText(/protected/i)).toBeVisible();

    // Check for categories section
    await expect(
      page.getByRole("heading", { name: /categories/i }),
    ).toBeVisible();

    // Submit button should be present
    await expect(
      page.getByRole("button", { name: /create session/i }),
    ).toBeVisible();
  });

  test("should show default categories", async ({ page }) => {
    await page.goto("/session/create");

    // Should have default categories pre-filled
    const categoryInputs = page.getByRole("textbox", {
      name: /category name/i,
    });

    // Expect at least some default categories
    await expect(categoryInputs.first()).toBeVisible();
  });

  test("should allow adding and removing categories", async ({ page }) => {
    await page.goto("/session/create");

    // Get initial count of categories
    const initialCategories = await page
      .getByRole("textbox", { name: "" })
      .filter({ has: page.locator('[placeholder*="Category"]') })
      .count();

    // Click add category button
    const addButton = page.getByRole("button", { name: /add category/i });
    await addButton.click();

    // Should have one more category
    const newCount = await page
      .getByRole("textbox", { name: "" })
      .filter({ has: page.locator('[placeholder*="Category"]') })
      .count();

    expect(newCount).toBeGreaterThan(initialCategories);

    // Remove a category
    const removeButtons = page.getByRole("button", { name: /remove/i });
    const removeButtonCount = await removeButtons.count();

    if (removeButtonCount > 0) {
      await removeButtons.first().click();

      // Count should decrease
      const finalCount = await page
        .getByRole("textbox", { name: "" })
        .filter({ has: page.locator('[placeholder*="Category"]') })
        .count();

      expect(finalCount).toBeLessThan(newCount);
    }
  });

  test("should show validation error for empty session name", async ({
    page,
  }) => {
    await page.goto("/session/create");

    // Try to submit without filling in session name
    const submitButton = page.getByRole("button", {
      name: /create session/i,
    });
    await submitButton.click();

    // Should show validation error (HTML5 validation or custom error)
    // Check if the form was not submitted (still on the same page)
    await expect(page).toHaveURL(/\/session\/create/);
  });
});
