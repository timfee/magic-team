# Testing Guide

This project uses Vitest for unit testing with Firebase emulators for integration tests.

## Quick Start

```bash
# Run all tests (unit tests pass without emulators, Firebase tests need emulators)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Coverage

Current test coverage:
- **8 test files** with **57 total tests**
- **40 passing unit tests** (run without emulators)
- **17 Firebase integration tests** (require emulators)

### Test Files:
- `lib/utils/__tests__/` - Utility functions (cn, permissions)
- `lib/actions/__tests__/` - Server actions (session, ideas)
- `components/__tests__/` - React components (IdeaCard)
- `lib/contexts/__tests__/` - React contexts (AuthContext)
- `lib/firebase/__tests__/` - Firebase security rules (requires emulators)

## Running Tests with Firebase Emulators

### Option 1: Automatic (Recommended)

This will start emulators, run tests, and stop emulators:

```bash
npm run test:emulators
```

### Option 2: Manual Control

If you want to keep emulators running between test runs:

```bash
# Terminal 1: Start Firebase emulators
npm run emulators

# Terminal 2: Run tests (while emulators are running)
npm test
```

## Test Structure

### Unit Tests
Located in `__tests__` folders next to the code they test:
- `lib/utils/__tests__/` - Utility function tests
- No Firebase emulator needed

### Integration Tests
Tests that interact with Firebase services:
- `lib/firebase/__tests__/` - Firebase security rules and data tests
- **Requires Firebase emulators to be running**

## Firebase Emulator Ports

- Firestore: `127.0.0.1:8080`
- Authentication: `127.0.0.1:9099`
- Emulator UI: `http://localhost:4000`

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "../my-module";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });
});
```

### Firebase Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseTest,
  cleanupFirebaseTest,
  clearFirestoreData,
  getAuthenticatedContext,
} from "../test-utils";
import { assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

describe("Firestore Rules", () => {
  beforeAll(async () => {
    await setupFirebaseTest();
  });

  afterAll(async () => {
    await cleanupFirebaseTest();
  });

  beforeEach(async () => {
    await clearFirestoreData();
  });

  it("should allow authenticated users to write", async () => {
    const context = getAuthenticatedContext("user-123", "user@example.com");
    const ref = doc(context.firestore(), "sessions", "session-1");

    await assertSucceeds(
      setDoc(ref, { data: "value" })
    );
  });
});
```

## Test Coverage

Generate coverage report:

```bash
npm run test:coverage
```

View coverage report at `coverage/index.html`

## Continuous Integration

For CI environments, use the `test:emulators` command which handles starting/stopping emulators automatically.

## Troubleshooting

### "Cannot find module" errors
Make sure you're running tests from the project root and all dependencies are installed:
```bash
npm install
```

### Emulator connection errors
1. Check that emulators are running: `npm run emulators`
2. Verify ports are not in use
3. Check `firebase.json` emulator configuration

### Test timeouts
Firebase emulator tests may take longer. Increase timeout in `vitest.config.ts` if needed:
```typescript
test: {
  testTimeout: 10000, // 10 seconds
}
```
