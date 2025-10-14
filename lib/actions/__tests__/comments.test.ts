import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreateCommentInput } from "@/lib/types/session";
import {
  createMockDocRef,
  createMockQuerySnapshot,
  getCallArg,
  hasProperties,
} from "./test-helpers";

// Mock Firebase
vi.mock("@/lib/firebase/client", () => ({ db: {} }));

const mockTimestamp = { toDate: () => new Date("2024-01-01") };

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((coll: unknown) => coll),
  where: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: class MockTimestamp {
    toDate(): Date {
      return new Date("2024-01-01");
    }
  },
}));

interface CommentData {
  sessionId: string;
  content: string;
  userId: string;
  ideaId?: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

describe("Comment Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createComment", () => {
    it("should create comment on an idea", async () => {
      const { createComment } = await import("../comments");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("comment-123"));

      const input: CreateCommentInput = {
        sessionId: "session-123",
        content: "Great idea!",
        ideaId: "idea-456",
      };

      const result = await createComment(input, "user-789");

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result).toEqual({ commentId: "comment-123" });

      const commentData = getCallArg<Partial<CommentData>>(mockAddDoc, 0, 1);
      expect(commentData.sessionId).toBe("session-123");
      expect(commentData.content).toBe("Great idea!");
      expect(commentData.ideaId).toBe("idea-456");
      expect(commentData.userId).toBe("user-789");
      expect(hasProperties<CommentData>(commentData, "createdAt")).toBe(true);
      expect(hasProperties<CommentData>(commentData, "updatedAt")).toBe(true);
    });

    it("should create comment on a group", async () => {
      const { createComment } = await import("../comments");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("comment-456"));

      const input: CreateCommentInput = {
        sessionId: "session-123",
        content: "Nice grouping!",
        groupId: "group-789",
      };

      const result = await createComment(input, "user-111");

      expect(result.commentId).toBe("comment-456");

      const commentData = getCallArg<Partial<CommentData>>(mockAddDoc, 0, 1);
      expect(commentData.groupId).toBe("group-789");
      expect(commentData.userId).toBe("user-111");
    });

    it("should use userId parameter not from input", async () => {
      const { createComment } = await import("../comments");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("comment-789"));

      const input: CreateCommentInput = {
        sessionId: "session-123",
        content: "Testing userId",
        ideaId: "idea-123",
      };

      await createComment(input, "authenticated-user");

      const commentData = getCallArg<Partial<CommentData>>(mockAddDoc, 0, 1);
      expect(commentData.userId).toBe("authenticated-user");
    });

    it("should handle creation errors", async () => {
      const { createComment } = await import("../comments");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockRejectedValue(new Error("Permission denied"));

      const input: CreateCommentInput = {
        sessionId: "session-123",
        content: "Error comment",
        ideaId: "idea-123",
      };

      await expect(createComment(input, "user-123")).rejects.toThrow(
        "Permission denied",
      );
    });
  });

  describe("updateComment", () => {
    it("should update comment content", async () => {
      const { updateComment } = await import("../comments");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await updateComment(
        "comment-123",
        "session-456",
        "Updated content",
      );

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result).toEqual({ success: true });

      const updates = getCallArg<{ content: string; updatedAt: Date }>(
        mockUpdateDoc,
        0,
        1,
      );
      expect(updates.content).toBe("Updated content");
      expect(hasProperties<{ updatedAt: Date }>(updates, "updatedAt")).toBe(
        true,
      );
    });

    it("should handle update errors", async () => {
      const { updateComment } = await import("../comments");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockRejectedValue(new Error("Not authorized"));

      await expect(
        updateComment("comment-123", "session-456", "New content"),
      ).rejects.toThrow("Not authorized");
    });
  });

  describe("deleteComment", () => {
    it("should delete comment successfully", async () => {
      const { deleteComment } = await import("../comments");
      const { deleteDoc } = await import("firebase/firestore");

      const mockDeleteDoc = vi.mocked(deleteDoc);
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await deleteComment("comment-123", "session-456");

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("should handle deletion errors", async () => {
      const { deleteComment } = await import("../comments");
      const { deleteDoc } = await import("firebase/firestore");

      const mockDeleteDoc = vi.mocked(deleteDoc);
      mockDeleteDoc.mockRejectedValue(new Error("Comment not found"));

      await expect(deleteComment("nonexistent", "session-456")).rejects.toThrow(
        "Comment not found",
      );
    });
  });

  describe("getSessionComments", () => {
    it("should get all comments for a session", async () => {
      const { getSessionComments } = await import("../comments");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "comment-1",
            data: {
              id: "comment-1",
              sessionId: "session-123",
              content: "First comment",
              userId: "user-1",
              ideaId: "idea-1",
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
            },
          },
          {
            id: "comment-2",
            data: {
              id: "comment-2",
              sessionId: "session-123",
              content: "Second comment",
              userId: "user-2",
              groupId: "group-1",
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
            },
          },
        ]),
      );

      const comments = await getSessionComments("session-123");

      expect(comments).toHaveLength(2);
      expect(comments[0].content).toBe("First comment");
      expect(comments[1].content).toBe("Second comment");
    });

    it("should filter comments by ideaId", async () => {
      const { getSessionComments } = await import("../comments");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "comment-1",
            data: {
              id: "comment-1",
              sessionId: "session-123",
              content: "On specific idea",
              userId: "user-1",
              ideaId: "idea-specific",
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
            },
          },
        ]),
      );

      const comments = await getSessionComments("session-123", "idea-specific");

      expect(comments).toHaveLength(1);
      expect(comments[0].ideaId).toBe("idea-specific");
    });

    it("should filter comments by groupId", async () => {
      const { getSessionComments } = await import("../comments");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "comment-1",
            data: {
              id: "comment-1",
              sessionId: "session-123",
              content: "On specific group",
              userId: "user-1",
              groupId: "group-specific",
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
            },
          },
        ]),
      );

      const comments = await getSessionComments(
        "session-123",
        undefined,
        "group-specific",
      );

      expect(comments).toHaveLength(1);
      expect(comments[0].groupId).toBe("group-specific");
    });

    it("should return empty array when no comments exist", async () => {
      const { getSessionComments } = await import("../comments");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

      const comments = await getSessionComments("session-123");

      expect(comments).toEqual([]);
    });

    it("should convert Timestamp fields to Dates", async () => {
      const { getSessionComments } = await import("../comments");
      const { getDocs, Timestamp } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "comment-1",
            data: {
              id: "comment-1",
              sessionId: "session-123",
              content: "Comment with timestamps",
              userId: "user-1",
              ideaId: "idea-1",
              createdAt: new Timestamp(1704067200, 0),
              updatedAt: new Timestamp(1704067200, 0),
            },
          },
        ]),
      );

      const comments = await getSessionComments("session-123");

      expect(comments[0].createdAt).toBeInstanceOf(Date);
      expect(comments[0].updatedAt).toBeInstanceOf(Date);
    });

    it("should handle non-Timestamp date fields gracefully", async () => {
      const { getSessionComments } = await import("../comments");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "comment-1",
            data: {
              id: "comment-1",
              sessionId: "session-123",
              content: "Comment without proper timestamps",
              userId: "user-1",
              ideaId: "idea-1",
              createdAt: "not-a-timestamp",
              updatedAt: "not-a-timestamp",
            },
          },
        ]),
      );

      const comments = await getSessionComments("session-123");

      expect(comments[0].createdAt).toBeInstanceOf(Date);
      expect(comments[0].updatedAt).toBeInstanceOf(Date);
    });
  });
});
