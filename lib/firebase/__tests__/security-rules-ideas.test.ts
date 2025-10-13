import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
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
} from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

describe("Firestore Security Rules - Ideas", () => {
  beforeAll(async () => {
    await setupFirebaseTest();
  });

  afterAll(async () => {
    await cleanupFirebaseTest();
  });

  beforeEach(async () => {
    await clearFirestoreData();
  });

  describe("Idea Creation", () => {
    it("should allow authenticated users to create ideas with their authorId", async () => {
      const userId = "user-123";
      const context = getAuthenticatedContext(userId, "user@example.com");

      // First create a session
      const sessionRef = doc(context.firestore(), "sessions", "session-1");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId: userId,
        visibility: "public",
        currentStage: "idea_collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create idea
      const ideaRef = doc(context.firestore(), "sessions", "session-1", "ideas", "idea-1");
      await assertSucceeds(
        setDoc(ideaRef, {
          sessionId: "session-1",
          categoryId: "category-1",
          content: "Test idea",
          authorId: userId,
          isAnonymous: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });

    it("should allow anonymous ideas in public sessions", async () => {
      const ownerId = "owner-123";
      const ownerContext = getAuthenticatedContext(ownerId, "owner@example.com");

      // Create session
      const sessionRef = doc(ownerContext.firestore(), "sessions", "session-2");
      await setDoc(sessionRef, {
        name: "Public Session",
        ownerId,
        visibility: "public",
        currentStage: "idea_collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create anonymous idea (unauthenticated)
      const unauthContext = getUnauthenticatedContext();
      const ideaRef = doc(unauthContext.firestore(), "sessions", "session-2", "ideas", "idea-2");

      await assertSucceeds(
        setDoc(ideaRef, {
          sessionId: "session-2",
          categoryId: "category-1",
          content: "Anonymous idea",
          isAnonymous: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });

    it("should not allow users to create ideas with mismatched authorId", async () => {
      const userId = "user-123";
      const context = getAuthenticatedContext(userId, "user@example.com");

      // Create session
      const sessionRef = doc(context.firestore(), "sessions", "session-3");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId: userId,
        visibility: "public",
        currentStage: "idea_collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Try to create idea with different authorId
      const ideaRef = doc(context.firestore(), "sessions", "session-3", "ideas", "idea-3");
      await assertFails(
        setDoc(ideaRef, {
          sessionId: "session-3",
          categoryId: "category-1",
          content: "Test idea",
          authorId: "different-user",
          isAnonymous: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });
  });

  describe("Idea Updates", () => {
    it("should allow idea author to update their own idea", async () => {
      const userId = "user-123";
      const context = getAuthenticatedContext(userId, "user@example.com");

      // Create session and idea
      const sessionRef = doc(context.firestore(), "sessions", "session-4");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId: userId,
        visibility: "public",
        currentStage: "idea_collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const ideaRef = doc(context.firestore(), "sessions", "session-4", "ideas", "idea-4");
      await setDoc(ideaRef, {
        sessionId: "session-4",
        categoryId: "category-1",
        content: "Original content",
        authorId: userId,
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update idea
      await assertSucceeds(
        updateDoc(ideaRef, {
          content: "Updated content",
        }),
      );
    });

    it("should allow session owner to update any idea", async () => {
      const ownerId = "owner-123";
      const authorId = "author-456";

      // Owner creates session
      const ownerContext = getAuthenticatedContext(ownerId, "owner@example.com");
      const sessionRef = doc(ownerContext.firestore(), "sessions", "session-5");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId,
        visibility: "public",
        currentStage: "idea_collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Author creates idea
      const authorContext = getAuthenticatedContext(authorId, "author@example.com");
      const ideaRefAuthor = doc(authorContext.firestore(), "sessions", "session-5", "ideas", "idea-5");
      await setDoc(ideaRefAuthor, {
        sessionId: "session-5",
        categoryId: "category-1",
        content: "Author's idea",
        authorId,
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Owner updates the idea
      const ideaRefOwner = doc(ownerContext.firestore(), "sessions", "session-5", "ideas", "idea-5");
      await assertSucceeds(
        updateDoc(ideaRefOwner, {
          content: "Moderated content",
        }),
      );
    });

    it("should not allow non-author users to update ideas", async () => {
      const authorId = "author-123";
      const otherUserId = "other-456";
      const ownerId = "owner-789";

      // Owner creates session
      const ownerContext = getAuthenticatedContext(ownerId, "owner@example.com");
      const sessionRef = doc(ownerContext.firestore(), "sessions", "session-6");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId,
        visibility: "public",
        currentStage: "idea_collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Author creates idea
      const authorContext = getAuthenticatedContext(authorId, "author@example.com");
      const ideaRefAuthor = doc(authorContext.firestore(), "sessions", "session-6", "ideas", "idea-6");
      await setDoc(ideaRefAuthor, {
        sessionId: "session-6",
        categoryId: "category-1",
        content: "Author's idea",
        authorId,
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Other user tries to update
      const otherContext = getAuthenticatedContext(otherUserId, "other@example.com");
      const ideaRefOther = doc(otherContext.firestore(), "sessions", "session-6", "ideas", "idea-6");
      await assertFails(
        updateDoc(ideaRefOther, {
          content: "Hacked content",
        }),
      );
    });
  });

  describe("Idea Deletion", () => {
    it("should allow idea author to delete their own idea", async () => {
      const userId = "user-123";
      const context = getAuthenticatedContext(userId, "user@example.com");

      // Create session and idea
      const sessionRef = doc(context.firestore(), "sessions", "session-7");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId: userId,
        visibility: "public",
        currentStage: "idea_collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const ideaRef = doc(context.firestore(), "sessions", "session-7", "ideas", "idea-7");
      await setDoc(ideaRef, {
        sessionId: "session-7",
        categoryId: "category-1",
        content: "To be deleted",
        authorId: userId,
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Delete idea
      await assertSucceeds(deleteDoc(ideaRef));
    });

    it("should allow session owner to delete any idea", async () => {
      const ownerId = "owner-123";
      const authorId = "author-456";

      // Owner creates session
      const ownerContext = getAuthenticatedContext(ownerId, "owner@example.com");
      const sessionRef = doc(ownerContext.firestore(), "sessions", "session-8");
      await setDoc(sessionRef, {
        name: "Test Session",
        ownerId,
        visibility: "public",
        currentStage: "idea_collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Author creates idea
      const authorContext = getAuthenticatedContext(authorId, "author@example.com");
      const ideaRefAuthor = doc(authorContext.firestore(), "sessions", "session-8", "ideas", "idea-8");
      await setDoc(ideaRefAuthor, {
        sessionId: "session-8",
        categoryId: "category-1",
        content: "To be moderated",
        authorId,
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Owner deletes the idea
      const ideaRefOwner = doc(ownerContext.firestore(), "sessions", "session-8", "ideas", "idea-8");
      await assertSucceeds(deleteDoc(ideaRefOwner));
    });
  });
});
