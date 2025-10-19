/**
 * Multi-Window Test Helpers for E2E Testing
 *
 * Utilities for testing real-time synchronization across multiple browser
 * windows/contexts simulating different users.
 */

import { test as base, type Page, type BrowserContext } from "@playwright/test";

/**
 * Extended test context with multiple user sessions
 */
export interface MultiWindowContext {
  ownerPage: Page;
  ownerContext: BrowserContext;
  participant1Page: Page;
  participant1Context: BrowserContext;
  participant2Page: Page;
  participant2Context: BrowserContext;
  presenterPage: Page;
  presenterContext: BrowserContext;
}

/**
 * Custom test fixture with multiple browser contexts
 */
export const multiWindowTest = base.extend<MultiWindowContext>({
  ownerContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  ownerPage: async ({ ownerContext }, use) => {
    const page = await ownerContext.newPage();
    await use(page);
    await page.close();
  },

  participant1Context: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  participant1Page: async ({ participant1Context }, use) => {
    const page = await participant1Context.newPage();
    await use(page);
    await page.close();
  },

  participant2Context: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  participant2Page: async ({ participant2Context }, use) => {
    const page = await participant2Context.newPage();
    await use(page);
    await page.close();
  },

  presenterContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  presenterPage: async ({ presenterContext }, use) => {
    const page = await presenterContext.newPage();
    await use(page);
    await page.close();
  },
});

/**
 * Wait for real-time update to propagate across pages
 *
 * Polls multiple pages for expected content/state to appear
 */
export async function waitForRealtimeSync(
  pages: Page[],
  selector: string,
  options: {
    timeout?: number;
    checkInterval?: number;
    expectedCount?: number;
  } = {},
): Promise<void> {
  const timeout = options.timeout ?? 5000;
  const checkInterval = options.checkInterval ?? 200;
  const expectedCount = options.expectedCount ?? pages.length;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    let visibleCount = 0;

    for (const page of pages) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        const isVisible = await element.first().isVisible();
        if (isVisible) {
          visibleCount++;
        }
      }
    }

    if (visibleCount >= expectedCount) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  throw new Error(
    `Real-time sync timeout: Expected ${expectedCount} pages to show "${selector}", but only ${pages.length} did after ${timeout}ms`,
  );
}

/**
 * Wait for text content to appear in multiple pages
 */
export async function waitForTextInPages(
  pages: Page[],
  text: string | RegExp,
  options: {
    timeout?: number;
    checkInterval?: number;
    expectedCount?: number;
  } = {},
): Promise<void> {
  const timeout = options.timeout ?? 5000;
  const checkInterval = options.checkInterval ?? 200;
  const expectedCount = options.expectedCount ?? pages.length;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    let foundCount = 0;

    for (const page of pages) {
      const content = await page.content();
      const found =
        typeof text === "string"
          ? content.includes(text)
          : text.test(content);

      if (found) {
        foundCount++;
      }
    }

    if (foundCount >= expectedCount) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  throw new Error(
    `Text sync timeout: Expected ${expectedCount} pages to contain "${text}", but only found in fewer pages after ${timeout}ms`,
  );
}

/**
 * Verify element count matches across multiple pages
 */
export async function verifyCountAcrossPages(
  pages: Page[],
  selector: string,
  expectedCount: number,
  options: {
    timeout?: number;
    checkInterval?: number;
  } = {},
): Promise<void> {
  const timeout = options.timeout ?? 5000;
  const checkInterval = options.checkInterval ?? 200;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    let allMatch = true;

    for (const page of pages) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count !== expectedCount) {
        allMatch = false;
        break;
      }
    }

    if (allMatch) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  // Collect actual counts for error message
  const counts = await Promise.all(
    pages.map(async (page, i) => {
      const count = await page.locator(selector).count();
      return `Page ${i}: ${count}`;
    }),
  );

  throw new Error(
    `Count mismatch: Expected all pages to have ${expectedCount} "${selector}", but got: ${counts.join(", ")}`,
  );
}

/**
 * Navigate all pages to the same URL
 */
export async function navigateAllPages(
  pages: Page[],
  url: string,
): Promise<void> {
  await Promise.all(pages.map((page) => page.goto(url)));
}

/**
 * Wait for all pages to reach a specific stage
 */
export async function waitForStageInPages(
  pages: Page[],
  stageText: string | RegExp,
  options: {
    timeout?: number;
  } = {},
): Promise<void> {
  const timeout = options.timeout ?? 10000;

  await Promise.all(
    pages.map((page) =>
      page.waitForSelector(`text=${stageText}`, { timeout }),
    ),
  );
}

/**
 * Get Firestore data from page context (requires Firebase to be initialized)
 */
export async function getFirestoreData<T>(
  page: Page,
  path: string,
): Promise<T | null> {
  return await page.evaluate(async (docPath: string) => {
    // @ts-expect-error - Accessing window.firebase from page context
    const { getDoc, doc } = window.firebase;
    // @ts-expect-error - Accessing window.db from page context
    const db = window.db;

    if (!db) {
      throw new Error("Firestore not initialized in page context");
    }

    const docRef = doc(db, docPath);
    const docSnap = await getDoc(docRef);

    return docSnap.exists() ? docSnap.data() : null;
  }, path);
}

/**
 * Execute action in one page and verify it appears in others
 */
export async function executeAndVerifySync<T>(
  sourcePage: Page,
  otherPages: Page[],
  action: (page: Page) => Promise<T>,
  verification: {
    selector?: string;
    text?: string | RegExp;
    timeout?: number;
  },
): Promise<T> {
  // Execute action
  const result = await action(sourcePage);

  // Verify sync
  if (verification.selector) {
    await waitForRealtimeSync(
      [sourcePage, ...otherPages],
      verification.selector,
      {
        timeout: verification.timeout,
      },
    );
  }

  if (verification.text) {
    await waitForTextInPages([sourcePage, ...otherPages], verification.text, {
      timeout: verification.timeout,
    });
  }

  return result;
}

/**
 * Simulate user actions in parallel across multiple pages
 */
export async function executeInParallel<T>(
  actions: Array<(page: Page) => Promise<T>>,
  pages: Page[],
): Promise<T[]> {
  if (actions.length !== pages.length) {
    throw new Error(
      `Action count (${actions.length}) must match page count (${pages.length})`,
    );
  }

  return await Promise.all(
    actions.map((action, i) => action(pages[i]!)),
  );
}

/**
 * Wait for Firebase real-time listener to update
 * (generic wait for Firebase to propagate changes)
 */
export async function waitForFirebaseSync(
  duration: number = 500,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * Helper to verify data consistency across pages
 */
export interface DataConsistencyCheck {
  selector: string;
  attribute?: string;
  expectedValue?: string | number;
  extractText?: boolean;
}

export async function verifyDataConsistency(
  pages: Page[],
  checks: DataConsistencyCheck[],
  options: {
    timeout?: number;
  } = {},
): Promise<void> {
  const timeout = options.timeout ?? 5000;
  const startTime = Date.now();

  for (const check of checks) {
    while (Date.now() - startTime < timeout) {
      const values = await Promise.all(
        pages.map(async (page) => {
          const element = page.locator(check.selector).first();
          const exists = (await element.count()) > 0;
          if (!exists) return null;

          if (check.attribute) {
            return await element.getAttribute(check.attribute);
          } else if (check.extractText) {
            return await element.textContent();
          } else {
            return await element.isVisible();
          }
        }),
      );

      // Check if all values match
      const firstValue = values[0];
      const allMatch = values.every((v) => v === firstValue);

      if (allMatch) {
        if (check.expectedValue !== undefined) {
          if (firstValue !== check.expectedValue) {
            throw new Error(
              `Data mismatch for "${check.selector}": Expected ${check.expectedValue}, got ${firstValue}`,
            );
          }
        }
        break; // Move to next check
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}

/**
 * Helper to mock authentication state in browser context
 *
 * NOTE: This is a placeholder - actual implementation depends on NextAuth setup
 */
export async function mockAuthInContext(
  context: BrowserContext,
  user: {
    uid: string;
    email: string;
    displayName: string;
  },
): Promise<void> {
  // Add authentication cookies/session storage
  // This will need to be customized based on your NextAuth configuration
  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: `mock-token-${user.uid}`,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Date.now() / 1000 + 86400, // 1 day
    },
  ]);

  // Optionally set session storage
  await context.addInitScript(
    (userData) => {
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
        }),
      );
    },
    user,
  );
}

/**
 * Debug helper: Take screenshots of all pages
 */
export async function screenshotAllPages(
  pages: Page[],
  prefix: string = "debug",
): Promise<void> {
  await Promise.all(
    pages.map((page, i) =>
      page.screenshot({ path: `${prefix}-page-${i}.png` }),
    ),
  );
}

/**
 * Debug helper: Log console messages from all pages
 */
export function logConsoleFromPages(pages: Page[]): void {
  pages.forEach((page, i) => {
    page.on("console", (msg) => {
      console.log(`[Page ${i}] ${msg.type()}: ${msg.text()}`);
    });
  });
}
