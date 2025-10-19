/**
 * E2E Authentication Helpers
 *
 * For E2E tests, we use Firebase Auth Emulator which allows signing in
 * without actual OAuth. Tests should run with emulators active.
 *
 * IMPORTANT: Start emulators before running E2E tests:
 * `npm run emulators` in a separate terminal
 */

import { type Page, type BrowserContext } from "@playwright/test";

export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

/**
 * Mock Firebase Auth user for E2E tests
 */
export const E2E_TEST_USER: MockUser = {
  uid: "test-e2e-user-12345",
  email: "e2e-test@example.com",
  displayName: "E2E Test User",
  photoURL: "https://i.pravatar.cc/150?img=10",
};

/**
 * Firebase emulator auth endpoint
 */
const AUTH_EMULATOR_URL = "http://localhost:9099";

/**
 * Authenticate a page by enabling E2E test mode
 *
 * This sets a flag that the AuthProvider checks to bypass Google OAuth
 * and use a mock user instead.
 */
export async function authenticatePage(
  page: Page,
  user: MockUser = E2E_TEST_USER,
): Promise<void> {
  await page.addInitScript(
    (mockUser) => {
      // Enable E2E test mode
      (window as any).__E2E_TEST_MODE = true;
      (window as any).__E2E_MOCK_USER = mockUser;
      console.log('[E2E] Test mode enabled with user:', mockUser.email);
    },
    user,
  );
}

/**
 * Authenticate a browser context (applies to all pages in context)
 */
export async function authenticateContext(
  context: BrowserContext,
  user: MockUser = E2E_TEST_USER,
): Promise<void> {
  await context.addInitScript(
    (mockUser) => {
      (window as any).__E2E_TEST_MODE = true;
      (window as any).__E2E_MOCK_USER = mockUser;
      console.log('[E2E] Test mode enabled for context with user:', mockUser.email);
    },
    user,
  );
}

/**
 * Clear authentication from a page
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clear all Firebase auth keys from localStorage
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("firebase:authUser:")) {
        localStorage.removeItem(key);
      }
    }
    localStorage.removeItem("__e2e_auth_injected");
    localStorage.removeItem("__e2e_user_id");
  });
}

/**
 * Check if page is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return localStorage.getItem("__e2e_auth_injected") === "true";
  });
}

/**
 * Get current mock user ID from page
 */
export async function getCurrentUserId(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem("__e2e_user_id");
  });
}
