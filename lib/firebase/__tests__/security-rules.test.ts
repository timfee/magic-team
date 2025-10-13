import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseTest,
  cleanupFirebaseTest,
  clearFirestoreData,
  getAuthenticatedContext,
  getUnauthenticatedContext,
} from "../test-utils";
import {
  assertFails,
  assertSucceeds,
  type RulesTestContext,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

describe("Firestore Security Rules", () => {
  beforeAll(async () => {
    await setupFirebaseTest();
  });

  afterAll(async () => {
    await cleanupFirebaseTest();
  });

  beforeEach(async () => {
    await clearFirestoreData();
  });

  describe("Session Creation", () => {
    it("should allow authenticated users to create sessions", async () => {
      const userId = "test-user-123";
      const context = getAuthenticatedContext(userId, "test@example.com");
      const sessionRef = doc(context.firestore(), "sessions", "test-session-1");

      await assertSucceeds(
        setDoc(sessionRef, {
          name: "Test Session",
          ownerId: userId,
          visibility: "public",
          currentStage: "pre_session",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });

    it("should not allow unauthenticated users to create sessions", async () => {
      const context = getUnauthenticatedContext();
      const sessionRef = doc(context.firestore(), "sessions", "test-session-2");

      await assertFails(
        setDoc(sessionRef, {
          name: "Test Session",
          ownerId: "some-user",
          visibility: "public",
          currentStage: "pre_session",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });

    it("should not allow users to create sessions with mismatched ownerId", async () => {
      const context = getAuthenticatedContext("user-123", "user@example.com");
      const sessionRef = doc(context.firestore(), "sessions", "test-session-3");

      await assertFails(
        setDoc(sessionRef, {
          name: "Test Session",
          ownerId: "different-user",
          visibility: "public",
          currentStage: "pre_session",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });
  });

  describe("Session Updates", () => {
    it("should allow session owner to update session", async () => {
      const ownerId = "owner-123";
      const ownerContext = getAuthenticatedContext(ownerId, "owner@example.com");
      const sessionRef = doc(ownerContext.firestore(), "sessions", "test-session-4");

      // Create session as owner
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId,
        visibility: "public",
        currentStage: "pre_session",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update as owner
      await assertSucceeds(
        updateDoc(sessionRef, {
          currentStage: "green_room",
        }),
      );
    });

    it("should not allow non-owner to update session", async () => {
      const ownerId = "owner-123";
      const otherUserId = "other-user-456";

      // Create session as owner
      const ownerContext = getAuthenticatedContext(ownerId, "owner@example.com");
      const sessionRef = doc(ownerContext.firestore(), "sessions", "test-session-5");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId,
        visibility: "public",
        currentStage: "pre_session",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Try to update as different user
      const otherContext = getAuthenticatedContext(otherUserId, "other@example.com");
      const otherSessionRef = doc(
        otherContext.firestore(),
        "sessions",
        "test-session-5",
      );

      await assertFails(
        updateDoc(otherSessionRef, {
          currentStage: "green_room",
        }),
      );
    });
  });

  describe("Session Reading", () => {
    it("should allow anyone to read public sessions", async () => {
      const ownerId = "owner-123";
      const ownerContext = getAuthenticatedContext(ownerId, "owner@example.com");
      const sessionRef = doc(ownerContext.firestore(), "sessions", "test-session-6");

      // Create public session
      await setDoc(sessionRef, {
        name: "Public Session",
        ownerId,
        visibility: "public",
        currentStage: "pre_session",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Read as unauthenticated user
      const unauthContext = getUnauthenticatedContext();
      const unauthSessionRef = doc(
        unauthContext.firestore(),
        "sessions",
        "test-session-6",
      );

      await assertSucceeds(getDoc(unauthSessionRef));
    });

    it("should allow anyone to read private sessions (with link)", async () => {
      const ownerId = "owner-123";
      const ownerContext = getAuthenticatedContext(ownerId, "owner@example.com");
      const sessionRef = doc(ownerContext.firestore(), "sessions", "test-session-7");

      // Create private session
      await setDoc(sessionRef, {
        name: "Private Session",
        ownerId,
        visibility: "private",
        currentStage: "pre_session",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Read as unauthenticated user (anyone with link)
      const unauthContext = getUnauthenticatedContext();
      const unauthSessionRef = doc(
        unauthContext.firestore(),
        "sessions",
        "test-session-7",
      );

      await assertSucceeds(getDoc(unauthSessionRef));
    });
  });

  describe("Presence Tracking", () => {
    it("should allow authenticated users to write their own presence", async () => {
      const userId = "user-123";
      const context = getAuthenticatedContext(userId, "user@example.com");

      // First create a session
      const sessionRef = doc(context.firestore(), "sessions", "test-session-8");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId: userId,
        visibility: "public",
        currentStage: "pre_session",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Write presence
      const presenceRef = doc(
        context.firestore(),
        "sessions",
        "test-session-8",
        "presence",
        userId,
      );

      await assertSucceeds(
        setDoc(presenceRef, {
          userId,
          userName: "Test User",
          isActive: true,
          lastSeenAt: new Date(),
        }),
      );
    });

    it("should not allow users to write other users' presence", async () => {
      const userId = "user-123";
      const otherUserId = "other-user-456";
      const context = getAuthenticatedContext(userId, "user@example.com");

      // First create a session
      const sessionRef = doc(context.firestore(), "sessions", "test-session-9");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId: userId,
        visibility: "public",
        currentStage: "pre_session",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Try to write another user's presence
      const presenceRef = doc(
        context.firestore(),
        "sessions",
        "test-session-9",
        "presence",
        otherUserId,
      );

      await assertFails(
        setDoc(presenceRef, {
          userId: otherUserId,
          userName: "Other User",
          isActive: true,
          lastSeenAt: new Date(),
        }),
      );
    });
  });
});
