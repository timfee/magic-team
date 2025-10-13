import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";

let testEnv: RulesTestEnvironment;

/**
 * Initialize Firebase test environment with emulators
 */
export async function setupFirebaseTest() {
  const projectId = "test-project";
  const firestoreRules = readFileSync(
    resolve(__dirname, "../../firestore.rules"),
    "utf8",
  );

  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: firestoreRules,
      host: "127.0.0.1",
      port: 8080,
    },
  });

  return testEnv;
}

/**
 * Get test environment
 */
export function getTestEnv(): RulesTestEnvironment {
  if (!testEnv) {
    throw new Error(
      "Test environment not initialized. Call setupFirebaseTest() first.",
    );
  }
  return testEnv;
}

/**
 * Cleanup test environment
 */
export async function cleanupFirebaseTest() {
  if (testEnv) {
    await testEnv.cleanup();
  }
}

/**
 * Clear Firestore data between tests
 */
export async function clearFirestoreData() {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
}

/**
 * Create an authenticated test context
 */
export function getAuthenticatedContext(userId: string, email?: string) {
  return getTestEnv().authenticatedContext(userId, { email });
}

/**
 * Create an unauthenticated test context
 */
export function getUnauthenticatedContext() {
  return getTestEnv().unauthenticatedContext();
}
