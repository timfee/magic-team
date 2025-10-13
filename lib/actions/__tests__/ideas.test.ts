import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreateIdeaInput } from "@/lib/types/session";
import type { DocumentReference, DocumentData } from "firebase/firestore";

// Mock Firebase
vi.mock("@/lib/firebase/client", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

interface IdeaData {
  sessionId: string;
  categoryId: string;
  content: string;
  isAnonymous: boolean;
  authorId?: string;
  order: number;
  isSelected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateData {
  content?: string;
  categoryId?: string;
  groupId?: string | null;
  updatedAt: Date;
}

describe("Idea Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createIdea", () => {
    it("should create idea with required fields", async () => {
      const { createIdea } = await import("../ideas");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({
        id: "idea-123",
      } as DocumentReference<DocumentData>);

      const input: CreateIdeaInput = {
        sessionId: "session-123",
        categoryId: "category-456",
        content: "Test idea content",
        isAnonymous: false,
      };

      const result = await createIdea(input);

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result).toHaveProperty("ideaId", "idea-123");

      const ideaData = mockAddDoc.mock.calls[0][1] as Partial<IdeaData>;
      expect(ideaData.content).toBe("Test idea content");
      expect(ideaData.isAnonymous).toBe(false);
    });

    it("should create anonymous idea without authorId", async () => {
      const { createIdea } = await import("../ideas");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({
        id: "idea-456",
      } as DocumentReference<DocumentData>);

      const input: CreateIdeaInput = {
        sessionId: "session-123",
        categoryId: "category-456",
        content: "Anonymous idea",
        isAnonymous: true,
      };

      await createIdea(input);

      const ideaData = mockAddDoc.mock.calls[0][1] as Partial<IdeaData>;
      expect(ideaData.isAnonymous).toBe(true);
      expect(ideaData.authorId).toBeUndefined();
    });

    it("should include order when provided", async () => {
      const { createIdea } = await import("../ideas");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({
        id: "idea-789",
      } as DocumentReference<DocumentData>);

      const input: CreateIdeaInput = {
        sessionId: "session-123",
        categoryId: "category-456",
        content: "Ordered idea",
        isAnonymous: false,
      };

      await createIdea(input);

      const ideaData = mockAddDoc.mock.calls[0][1] as Partial<IdeaData>;
      // Order defaults to 0 if not in the implementation
      expect(ideaData).toHaveProperty("order");
      expect(typeof ideaData.order).toBe("number");
    });
  });

  describe("updateIdea", () => {
    it("should update idea content", async () => {
      const { updateIdea } = await import("../ideas");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateIdea("idea-123", "session-456", {
        content: "Updated content",
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateData = mockUpdateDoc.mock.calls[0][1] as UpdateData;
      expect(updateData.content).toBe("Updated content");
      expect(updateData).toHaveProperty("updatedAt");
    });

    it("should update idea category and group", async () => {
      const { updateIdea } = await import("../ideas");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateIdea("idea-123", "session-456", {
        categoryId: "new-category",
        groupId: "new-group",
      });

      const updateData = mockUpdateDoc.mock.calls[0][1] as UpdateData;
      expect(updateData.categoryId).toBe("new-category");
      expect(updateData.groupId).toBe("new-group");
    });

    it("should handle update errors", async () => {
      const { updateIdea } = await import("../ideas");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockRejectedValue(new Error("Permission denied"));

      await expect(
        updateIdea("idea-123", "session-456", { content: "New content" }),
      ).rejects.toThrow("Permission denied");
    });
  });

  describe("deleteIdea", () => {
    it("should delete idea document", async () => {
      const { deleteIdea } = await import("../ideas");
      const { deleteDoc } = await import("firebase/firestore");

      const mockDeleteDoc = vi.mocked(deleteDoc);
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await deleteIdea("idea-123", "session-456");

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should handle delete errors", async () => {
      const { deleteIdea } = await import("../ideas");
      const { deleteDoc } = await import("firebase/firestore");

      const mockDeleteDoc = vi.mocked(deleteDoc);
      mockDeleteDoc.mockRejectedValue(new Error("Not found"));

      await expect(deleteIdea("idea-123", "session-456")).rejects.toThrow(
        "Not found",
      );
    });
  });
});
