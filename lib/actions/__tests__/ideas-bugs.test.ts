import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseTest,
  cleanupFirebaseTest,
  clearFirestoreData,
  getAuthenticatedContext,
} from "@/lib/firebase/test-utils";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { createIdea, updateIdea, moveIdeaToGroup } from "../ideas";
import type { CreateIdeaInput } from "@/lib/types/session";

/**
 * BUG-HUNTING TESTS
 *
 * These tests are designed to FAIL and expose real bugs in the codebase.
 * If a test passes, the bug is fixed. If it fails, the bug exists.
 */
describe("Ideas - Bug Exposure Tests", () => {
  const TEST_SESSION_ID = "bug-test-session";
  const OWNER_ID = "owner-123";
  const USER_ID = "user-789";

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
      name: "Bug Test Session",
      ownerId: OWNER_ID,
      visibility: "public",
      currentStage: "idea_collection",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create test category
    const categoryRef = doc(
      ownerContext.firestore(),
      "sessions",
      TEST_SESSION_ID,
      "categories",
      "valid-category",
    );
    await setDoc(categoryRef, {
      sessionId: TEST_SESSION_ID,
      name: "Test Category",
      color: "#3b82f6",
      order: 0,
    });
  });

  describe("BUG #1: Content Validation Missing", () => {
    it("should REJECT ideas with content > 500 characters", async () => {
      const input: CreateIdeaInput = {
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "x".repeat(501), // 501 characters
        isAnonymous: false,
        authorId: USER_ID,
      };

      // EXPECTED: Should throw validation error
      // ACTUAL: Creates idea with 501 chars (BUG!)
      await expect(createIdea(input)).rejects.toThrow(/content.*500/i);
    });

    it("should REJECT ideas with empty content", async () => {
      const input: CreateIdeaInput = {
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "", // Empty!
        isAnonymous: false,
        authorId: USER_ID,
      };

      // EXPECTED: Should throw validation error
      // ACTUAL: Creates idea with empty content (BUG!)
      await expect(createIdea(input)).rejects.toThrow(/content.*empty/i);
    });

    it("should REJECT ideas with only whitespace", async () => {
      const input: CreateIdeaInput = {
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "   \n\t   ", // Whitespace only
        isAnonymous: false,
        authorId: USER_ID,
      };

      // EXPECTED: Should throw validation error
      // ACTUAL: Creates idea with whitespace (BUG!)
      await expect(createIdea(input)).rejects.toThrow(/content.*empty/i);
    });

    it("should sanitize XSS in content", async () => {
      const input: CreateIdeaInput = {
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "<script>alert('XSS')</script>Normal text",
        isAnonymous: false,
        authorId: USER_ID,
      };

      // EXPECTED: Should strip <script> tags or escape HTML
      // ACTUAL: Stores raw HTML (POTENTIAL XSS BUG!)
      const result = await createIdea(input);

      const ownerContext = getAuthenticatedContext(OWNER_ID, "owner@example.com");
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        result.ideaId,
      );
      const ideaSnap = await getDoc(ideaRef);
      const savedContent = ideaSnap.data()?.content;

      // Content should NOT contain <script> tags
      expect(savedContent).not.toContain("<script>");
    });
  });

  describe("BUG #2: Invalid Category ID Allowed", () => {
    it("should REJECT ideas with non-existent categoryId", async () => {
      const input: CreateIdeaInput = {
        sessionId: TEST_SESSION_ID,
        categoryId: "nonexistent-category", // Doesn't exist!
        content: "Test idea",
        isAnonymous: false,
        authorId: USER_ID,
      };

      // EXPECTED: Should throw "Category not found" error
      // ACTUAL: Creates idea with invalid categoryId (BUG!)
      await expect(createIdea(input)).rejects.toThrow(/category.*not.*found/i);
    });

    it("should REJECT ideas with categoryId from different session", async () => {
      // Create category in different session
      const ownerContext = getAuthenticatedContext(OWNER_ID, "owner@example.com");
      const otherSessionRef = doc(
        ownerContext.firestore(),
        "sessions",
        "other-session",
      );
      await setDoc(otherSessionRef, {
        name: "Other Session",
        ownerId: OWNER_ID,
        visibility: "public",
        currentStage: "idea_collection",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const otherCategoryRef = doc(
        ownerContext.firestore(),
        "sessions",
        "other-session",
        "categories",
        "other-category",
      );
      await setDoc(otherCategoryRef, {
        sessionId: "other-session",
        name: "Other Category",
        color: "#ff0000",
        order: 0,
      });

      const input: CreateIdeaInput = {
        sessionId: TEST_SESSION_ID,
        categoryId: "other-category", // From different session!
        content: "Test idea",
        isAnonymous: false,
        authorId: USER_ID,
      };

      // EXPECTED: Should throw validation error
      // ACTUAL: Creates idea with wrong session's category (BUG!)
      await expect(createIdea(input)).rejects.toThrow(/category.*session/i);
    });
  });

  describe("BUG #3: Race Condition in moveIdeaToGroup", () => {
    it("should REJECT moving idea to non-existent group", async () => {
      // Create idea
      const input: CreateIdeaInput = {
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "Test idea",
        isAnonymous: false,
        authorId: USER_ID,
      };
      const result = await createIdea(input);

      // EXPECTED: Should throw "Group not found" error
      // ACTUAL: Sets groupId to non-existent group (BUG!)
      await expect(
        moveIdeaToGroup(result.ideaId, "nonexistent-group", TEST_SESSION_ID),
      ).rejects.toThrow(/group.*not.*found/i);
    });

    it("should REJECT moving locked idea (locked by another user)", async () => {
      const ownerContext = getAuthenticatedContext(OWNER_ID, "owner@example.com");

      // Create idea locked by USER_ID
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "locked-idea",
      );
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "Locked idea",
        isAnonymous: false,
        authorId: USER_ID,
        lockedById: USER_ID,
        lockedAt: new Date(),
        order: 0,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Try to move as different user
      // EXPECTED: Should throw "Idea is locked" error
      // ACTUAL: Moves idea despite lock (BUG!)
      await expect(
        moveIdeaToGroup("locked-idea", null, TEST_SESSION_ID),
      ).rejects.toThrow(/locked/i);
    });
  });

  describe("BUG #4: Order Always Zero", () => {
    it("should calculate correct order when creating idea in populated category", async () => {
      // Create 3 existing ideas
      for (let i = 0; i < 3; i++) {
        await createIdea({
          sessionId: TEST_SESSION_ID,
          categoryId: "valid-category",
          content: `Existing idea ${i}`,
          isAnonymous: false,
          authorId: USER_ID,
        });
      }

      // Create new idea
      const result = await createIdea({
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "New idea",
        isAnonymous: false,
        authorId: USER_ID,
      });

      // EXPECTED: order should be 3 (after existing 0, 1, 2)
      // ACTUAL: order is always 0 (BUG!)
      const ownerContext = getAuthenticatedContext(OWNER_ID, "owner@example.com");
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        result.ideaId,
      );
      const ideaSnap = await getDoc(ideaRef);
      const order = ideaSnap.data()?.order;

      expect(order).toBe(3);
    });
  });

  describe("BUG #5: Timestamp Fallback Hides Data Corruption", () => {
    it("should THROW error when createdAt is corrupted (not a Timestamp)", async () => {
      const ownerContext = getAuthenticatedContext(OWNER_ID, "owner@example.com");

      // Manually create idea with corrupted timestamp
      const ideaRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "ideas",
        "corrupted-idea",
      );
      await setDoc(ideaRef, {
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "Corrupted idea",
        isAnonymous: false,
        authorId: USER_ID,
        createdAt: "not-a-timestamp", // Corrupted!
        updatedAt: new Date(),
        order: 0,
        isSelected: false,
      });

      // EXPECTED: getSessionIdeas should throw error for corrupted data
      // ACTUAL: Returns new Date() silently (BUG - hides corruption!)
      const { getSessionIdeas } = await import("../ideas");

      await expect(getSessionIdeas(TEST_SESSION_ID)).rejects.toThrow(/timestamp.*corrupted/i);
    });
  });

  describe("BUG #6: No Max Ideas Per Category Enforcement", () => {
    it("should REJECT creating idea when category limit reached", async () => {
      // Update category to have maxEntriesPerPerson: 2
      const ownerContext = getAuthenticatedContext(OWNER_ID, "owner@example.com");
      const categoryRef = doc(
        ownerContext.firestore(),
        "sessions",
        TEST_SESSION_ID,
        "categories",
        "valid-category",
      );
      await setDoc(categoryRef, {
        sessionId: TEST_SESSION_ID,
        name: "Limited Category",
        color: "#3b82f6",
        order: 0,
        maxEntriesPerPerson: 2,
      });

      // Create 2 ideas (should succeed)
      await createIdea({
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "Idea 1",
        isAnonymous: false,
        authorId: USER_ID,
      });

      await createIdea({
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "Idea 2",
        isAnonymous: false,
        authorId: USER_ID,
      });

      // Try to create 3rd idea (should fail)
      // EXPECTED: Should throw "Max entries reached" error
      // ACTUAL: Creates 3rd idea (BUG!)
      await expect(
        createIdea({
          sessionId: TEST_SESSION_ID,
          categoryId: "valid-category",
          content: "Idea 3",
          isAnonymous: false,
          authorId: USER_ID,
        }),
      ).rejects.toThrow(/max.*entries/i);
    });
  });

  describe("BUG #7: Update Validation Missing", () => {
    it("should REJECT updating idea to have empty content", async () => {
      // Create idea
      const result = await createIdea({
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "Original content",
        isAnonymous: false,
        authorId: USER_ID,
      });

      // Try to update to empty content
      // EXPECTED: Should throw validation error
      // ACTUAL: Updates to empty content (BUG!)
      await expect(
        updateIdea(result.ideaId, TEST_SESSION_ID, { content: "" }),
      ).rejects.toThrow(/content.*empty/i);
    });

    it("should REJECT updating idea to invalid categoryId", async () => {
      // Create idea
      const result = await createIdea({
        sessionId: TEST_SESSION_ID,
        categoryId: "valid-category",
        content: "Test idea",
        isAnonymous: false,
        authorId: USER_ID,
      });

      // Try to update to non-existent category
      // EXPECTED: Should throw validation error
      // ACTUAL: Updates to invalid category (BUG!)
      await expect(
        updateIdea(result.ideaId, TEST_SESSION_ID, {
          categoryId: "nonexistent-category",
        }),
      ).rejects.toThrow(/category.*not.*found/i);
    });
  });
});
