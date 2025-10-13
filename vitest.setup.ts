import "@testing-library/jest-dom/vitest";
import { afterAll, beforeAll } from "vitest";

// Setup Firebase emulators before tests
beforeAll(() => {
  // Set environment variables for Firebase emulators
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
});

afterAll(() => {
  // Cleanup
});
