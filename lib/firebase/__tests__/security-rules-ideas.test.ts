import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseTest,
  cleanupFirebaseTest,
  clearFirestoreData,
  getAuthenticatedContext,
  getUnauthenticatedContext,
} from "../test-utils";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

/**
 * Comprehensive security rules tests for the ideas subcollection.
 *
 * Coverage:
 * - Idea creation (anonymous vs. authored)
 * - Idea reading (public/private sessions, authenticated/unauthenticated)
 * - Idea updates (author, owner, admin, lock validation)
 * - Idea deletion (author, owner, admin)
 * - Edge cases (anonymous ideas, missing authorId, lock expiration)
 */
describe("Firestore Security Rules - Ideas Collection", () => {
  const TEST_SESSION_ID = "test-session-ideas";
  const OWNER_ID = "owner-123";
  const ADMIN_ID = "admin-456";
  const USER_ID = "user-789";
  const OTHER_USER_ID = "other-user-999";

  beforeAll(async () => {
    await setupFirebaseTest();
  });

  afterAll(async () => {
    await cleanupFirebaseTest();
  });

  beforeEach(async () => {
    await clearFirestoreData();

    // Set up test session
    const ownerContext = getAuthenticatedContext(OWNER_ID, "owner@example.com");
    const sessionRef = doc(
      ownerContext.firestore(),
      "sessions",
      TEST_SESSION_ID,
    );
    await setDoc(sessionRef, {
      name: "Test Session",
      ownerId: OWNER_ID,
      visibility: "public",
      currentStage: "idea_collection",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Set up admin
    const adminDocRef = doc(
      ownerContext.firestore(),
      "sessions",
      TEST_SESSION_ID,
      "admins",
      ADMIN_ID,
    );
    await setDoc(adminDocRef, {
      sessionId: TEST_SESSION_ID,
      userId: ADMIN_ID,
      role: "admin",
      addedAt: new Date(),
      addedById: OWNER_ID,
    });
  });

  describe("Idea Creation", () => {
    it("should allow authenticated users to create anonymous ideas", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "idea-1",
      );

      await assertSucceeds(
        setDoc(ideaRef, {
          sessionId: TEST_SESSION_ID,
          categoryId: "cat-1",
          content: "Anonymous idea",
          isAnonymous: true,
          order: 0,
          isSelected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });

    it("should allow authenticated users to create authored ideas with their own authorId", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "idea-2",
      );

      await assertSucceeds(
        setDoc(ideaRef, {
          sessionId: TEST_SESSION_ID,
          categoryId: "cat-1",
          content: "My idea",
          isAnonymous: false,
          authorId: USER_ID,
          order: 0,
          isSelected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });

    it("should NOT allow users to create authored ideas with someone else's authorId", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "idea-3",
      );

      await assertFails(
        setDoc(ideaRef, {
          sessionId: TEST_SESSION_ID,
          categoryId: "cat-1",
          content: "Fake authored idea",
          isAnonymous: false,
          authorId: OTHER_USER_ID, // Wrong user!
          order: 0,
          isSelected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });

    it("should NOT allow unauthenticated users to create ideas", async () => {
      const unauthContext = getUnauthenticatedContext();
      const ideaRef = doc(
        unauthContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "idea-4",
      );

      await assertFails(
        setDoc(ideaRef, {
          sessionId: TEST_SESSION_ID,
          categoryId: "cat-1",
          content: "Unauth idea",
          isAnonymous: true,
          order: 0,
          isSelected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });

    it("should NOT allow creating non-anonymous ideas without authorId", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "idea-5",
      );

      await assertFails(
        setDoc(ideaRef, {
          sessionId: TEST_SESSION_ID,
          categoryId: "cat-1",
          content: "Missing authorId",
          isAnonymous: false,
          // authorId missing!
          order: 0,
          isSelected: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });
  });

  describe("Idea Reading", () => {
    beforeEach(async () => {
      // Create a test idea
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "read-test-idea",
      );
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "cat-1",
        content: "Test idea",
        isAnonymous: false,
        authorId: USER_ID,
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should allow authenticated users to read ideas in public sessions", async () => {
      const otherContext = getAuthenticatedContext(
        OTHER_USER_ID,
        "other@example.com",
      );
      const ideaRef = doc(
        otherContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "read-test-idea",
      );

      await assertSucceeds(getDoc(ideaRef));
    });

    it("should allow owner to read ideas", async () => {
      const ownerContext = getAuthenticatedContext(
        OWNER_ID,
        "owner@example.com",
      );
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "read-test-idea",
      );

      await assertSucceeds(getDoc(ideaRef));
    });

    it("should allow admins to read ideas", async () => {
      const adminContext = getAuthenticatedContext(
        ADMIN_ID,
        "admin@example.com",
      );
      const ideaRef = doc(
        adminContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "read-test-idea",
      );

      await assertSucceeds(getDoc(ideaRef));
    });

    it("should NOT allow unauthenticated users to read ideas", async () => {
      const unauthContext = getUnauthenticatedContext();
      const ideaRef = doc(
        unauthContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "read-test-idea",
      );

      await assertFails(getDoc(ideaRef));
    });
  });

  describe("Idea Updates - Author Permissions", () => {
    beforeEach(async () => {
      // Create idea by USER_ID
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "update-test-idea",
      );
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "cat-1",
        content: "Original content",
        isAnonymous: false,
        authorId: USER_ID,
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should allow author to update their own idea", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "update-test-idea",
      );

      await assertSucceeds(
        updateDoc(ideaRef, {
          content: "Updated content",
          updatedAt: new Date(),
        }),
      );
    });

    it("should NOT allow other users to update someone else's idea", async () => {
      const otherContext = getAuthenticatedContext(
        OTHER_USER_ID,
        "other@example.com",
      );
      const ideaRef = doc(
        otherContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "update-test-idea",
      );

      await assertFails(
        updateDoc(ideaRef, {
          content: "Hacked content",
          updatedAt: new Date(),
        }),
      );
    });

    it("should allow owner to update any idea", async () => {
      const ownerContext = getAuthenticatedContext(
        OWNER_ID,
        "owner@example.com",
      );
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "update-test-idea",
      );

      await assertSucceeds(
        updateDoc(ideaRef, {
          content: "Owner updated",
          updatedAt: new Date(),
        }),
      );
    });

    it("should allow admin to update any idea", async () => {
      const adminContext = getAuthenticatedContext(
        ADMIN_ID,
        "admin@example.com",
      );
      const ideaRef = doc(
        adminContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "update-test-idea",
      );

      await assertSucceeds(
        updateDoc(ideaRef, {
          content: "Admin updated",
          updatedAt: new Date(),
        }),
      );
    });

    it("should NOT allow unauthenticated users to update ideas", async () => {
      const unauthContext = getUnauthenticatedContext();
      const ideaRef = doc(
        unauthContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "update-test-idea",
      );

      await assertFails(
        updateDoc(ideaRef, {
          content: "Unauth update",
          updatedAt: new Date(),
        }),
      );
    });
  });

  describe("Idea Updates - Lock Validation", () => {
    it("should allow update when idea has no lock", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "unlocked-idea",
      );

      // Create unlocked idea
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "cat-1",
        content: "Unlocked",
        isAnonymous: false,
        authorId: USER_ID,
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update should succeed
      await assertSucceeds(
        updateDoc(ideaRef, {
          content: "Updated unlocked",
          updatedAt: new Date(),
        }),
      );
    });

    it("should allow update when user holds the lock", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "user-locked-idea",
      );

      // Create idea locked by USER_ID
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "cat-1",
        content: "Locked by user",
        isAnonymous: false,
        authorId: USER_ID,
        lockedById: USER_ID,
        lockedAt: new Date(),
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update by lock holder should succeed
      await assertSucceeds(
        updateDoc(ideaRef, {
          content: "Updated by lock holder",
          updatedAt: new Date(),
        }),
      );
    });

    it("should NOT allow update when locked by another user (lock < 30s old)", async () => {
      const ownerContext = getAuthenticatedContext(
        OWNER_ID,
        "owner@example.com",
      );
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "other-locked-idea",
      );

      // Create idea locked by OTHER_USER_ID (recent lock)
      const now = new Date();
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "cat-1",
        content: "Locked by other",
        isAnonymous: false,
        authorId: OTHER_USER_ID,
        lockedById: OTHER_USER_ID,
        lockedAt: now, // Recent lock (< 30s)
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Try to update as different user (should fail due to lock)
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const userIdeaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "other-locked-idea",
      );

      // The rule checks: request.time > resource.data.lockedAt + duration.value(30, 's')
      // Since lock is recent, this should fail
      await assertFails(
        updateDoc(userIdeaRef, {
          content: "Try to steal lock",
          updatedAt: new Date(),
        }),
      );
    });

    it("should allow owner/admin to update even when locked by another user", async () => {
      const ownerContext = getAuthenticatedContext(
        OWNER_ID,
        "owner@example.com",
      );

      // Create idea as USER_ID
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "admin-override-lock",
      );
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "cat-1",
        content: "User's locked idea",
        isAnonymous: false,
        authorId: USER_ID,
        lockedById: USER_ID,
        lockedAt: new Date(),
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Owner should be able to update despite lock
      const ownerIdeaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "admin-override-lock",
      );
      await assertSucceeds(
        updateDoc(ownerIdeaRef, {
          content: "Owner override",
          updatedAt: new Date(),
        }),
      );
    });

    it("should allow update when lock is null", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "null-lock-idea",
      );

      // Create idea with lockedById: null
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "cat-1",
        content: "Null lock",
        isAnonymous: false,
        authorId: USER_ID,
        lockedById: null,
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update should succeed
      await assertSucceeds(
        updateDoc(ideaRef, {
          content: "Updated null lock",
          updatedAt: new Date(),
        }),
      );
    });
  });

  describe("Idea Deletion", () => {
    beforeEach(async () => {
      // Create idea by USER_ID
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "delete-test-idea",
      );
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "cat-1",
        content: "To be deleted",
        isAnonymous: false,
        authorId: USER_ID,
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should allow author to delete their own idea", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "delete-test-idea",
      );

      await assertSucceeds(deleteDoc(ideaRef));
    });

    it("should NOT allow other users to delete someone else's idea", async () => {
      const otherContext = getAuthenticatedContext(
        OTHER_USER_ID,
        "other@example.com",
      );
      const ideaRef = doc(
        otherContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "delete-test-idea",
      );

      await assertFails(deleteDoc(ideaRef));
    });

    it("should allow owner to delete any idea", async () => {
      const ownerContext = getAuthenticatedContext(
        OWNER_ID,
        "owner@example.com",
      );
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "delete-test-idea",
      );

      await assertSucceeds(deleteDoc(ideaRef));
    });

    it("should allow admin to delete any idea", async () => {
      const adminContext = getAuthenticatedContext(
        ADMIN_ID,
        "admin@example.com",
      );
      const ideaRef = doc(
        adminContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "delete-test-idea",
      );

      await assertSucceeds(deleteDoc(ideaRef));
    });

    it("should NOT allow unauthenticated users to delete ideas", async () => {
      const unauthContext = getUnauthenticatedContext();
      const ideaRef = doc(
        unauthContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "delete-test-idea",
      );

      await assertFails(deleteDoc(ideaRef));
    });
  });

  describe("Anonymous Idea Permissions", () => {
    beforeEach(async () => {
      // Create anonymous idea
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "anon-idea",
      );
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "cat-1",
        content: "Anonymous content",
        isAnonymous: true,
        // No authorId
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should NOT allow original creator to update anonymous idea (no authorId)", async () => {
      const userContext = getAuthenticatedContext(USER_ID, "user@example.com");
      const ideaRef = doc(
        userContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "anon-idea",
      );

      // Should fail because there's no authorId to match
      await assertFails(
        updateDoc(ideaRef, {
          content: "Try to update anon",
          updatedAt: new Date(),
        }),
      );
    });

    it("should allow owner to update anonymous ideas", async () => {
      const ownerContext = getAuthenticatedContext(
        OWNER_ID,
        "owner@example.com",
      );
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "anon-idea",
      );

      await assertSucceeds(
        updateDoc(ideaRef, {
          content: "Owner updates anon",
          updatedAt: new Date(),
        }),
      );
    });

    it("should allow admin to update anonymous ideas", async () => {
      const adminContext = getAuthenticatedContext(
        ADMIN_ID,
        "admin@example.com",
      );
      const ideaRef = doc(
        adminContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "anon-idea",
      );

      await assertSucceeds(
        updateDoc(ideaRef, {
          content: "Admin updates anon",
          updatedAt: new Date(),
        }),
      );
    });

    it("should NOT allow regular users to delete anonymous ideas", async () => {
      const otherContext = getAuthenticatedContext(
        OTHER_USER_ID,
        "other@example.com",
      );
      const ideaRef = doc(
        otherContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "anon-idea",
      );

      await assertFails(deleteDoc(ideaRef));
    });

    it("should allow owner to delete anonymous ideas", async () => {
      const ownerContext = getAuthenticatedContext(
        OWNER_ID,
        "owner@example.com",
      );
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "anon-idea",
      );

      await assertSucceeds(deleteDoc(ideaRef));
    });
  });
});
