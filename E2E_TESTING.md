# End-to-End Testing Guide

This project uses Playwright for E2E testing to validate user workflows and ensure the application works correctly from a user's perspective.

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

## Test Structure

E2E tests are located in the `e2e/` directory:

```
e2e/
├── navigation.spec.ts          # Navigation and routing tests
├── session-creation.spec.ts    # Session creation workflow
└── session-viewing.spec.ts     # Session viewing and interaction
```

## Test Coverage

### 1. Navigation Tests (`e2e/navigation.spec.ts`)
- ✅ Homepage loading
- ✅ Navigation to create session page
- ✅ Back navigation
- ✅ 404 page handling
- ✅ Session detail page navigation

### 2. Session Creation Tests (`e2e/session-creation.spec.ts`)
- ✅ Navigate to create session from homepage
- ✅ Display of session creation form
- ✅ Default categories
- ✅ Adding and removing categories
- ✅ Form validation

### 3. Session Viewing Tests (`e2e/session-viewing.spec.ts`)
- ✅ Session board page loading
- ✅ Header with navigation
- ✅ Connection status display
- ✅ Participant count display
- ✅ Current stage display
- ✅ Admin controls access
- ✅ Authentication requirements

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    // Navigate to page
    await page.goto("/your-page");

    // Interact with elements
    await page.getByRole("button", { name: /click me/i }).click();

    // Assert expectations
    await expect(page).toHaveURL(/expected-url/);
    await expect(page.getByText("Success")).toBeVisible();
  });
});
```

### Best Practices

1. **Use Semantic Selectors**
   - Prefer `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors
   - These are more resilient to UI changes

2. **Wait for Elements**
   - Use `await expect(element).toBeVisible()` instead of arbitrary waits
   - Playwright automatically waits for elements to be actionable

3. **Isolation**
   - Each test should be independent
   - Don't rely on the state from previous tests

4. **Descriptive Names**
   - Test names should clearly describe what they test
   - Use "should" statements: "should display error message"

### Common Patterns

**Navigating and Checking URL:**
```typescript
await page.goto("/session/create");
await expect(page).toHaveURL(/\/session\/create/);
```

**Interacting with Forms:**
```typescript
await page.getByLabel(/session name/i).fill("My Session");
await page.getByRole("button", { name: /submit/i }).click();
```

**Checking for Elements:**
```typescript
await expect(page.getByText("Success")).toBeVisible();
await expect(page.getByRole("heading")).toContainText("Welcome");
```

**Handling Authentication:**
```typescript
// Check if auth is required
const authButton = page.getByText(/sign in/i);
if (await authButton.isVisible()) {
  // Handle sign in flow
}
```

## Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Workers**: Parallel on local, sequential on CI
- **Browsers**: Chromium (Firefox and WebKit available)

### Web Server

Playwright automatically starts your Next.js dev server before running tests:

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}
```

## Running with Firebase Emulators

For tests that require Firebase (authentication, database):

1. **Terminal 1**: Start Firebase emulators
   ```bash
   npm run emulators
   ```

2. **Terminal 2**: Run E2E tests
   ```bash
   npm run test:e2e
   ```

## Debugging Tests

### UI Mode (Recommended)
```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- Run tests step by step
- See the browser in real-time
- Inspect element locators
- View traces and screenshots

### Debug Mode
```bash
npm run test:e2e:debug
```

This runs tests with the Playwright Inspector for debugging.

### VS Code Extension

Install the [Playwright VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) for:
- Running tests from the editor
- Setting breakpoints
- Seeing test results inline

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Test Reports

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

The report includes:
- Test results summary
- Screenshots of failures
- Step-by-step traces
- Video recordings (if configured)

## Troubleshooting

### Tests Timing Out

Increase timeout in `playwright.config.ts`:
```typescript
use: {
  timeout: 60000, // 60 seconds
}
```

### Element Not Found

Use Playwright's locator debugging:
```bash
npx playwright test --debug
```

### Flaky Tests

- Avoid `page.waitForTimeout()` - use proper waits
- Use `await expect(element).toBeVisible()` instead
- Check for race conditions

### Port Already in Use

If port 3000 is busy:
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
