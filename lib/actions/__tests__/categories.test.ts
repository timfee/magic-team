import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreateCategoryInput, Category } from "@/lib/types/session";
import {
  createMockDocRef,
  createMockQuerySnapshot,
  getCallArg,
} from "./test-helpers";

// Mock Firebase
vi.mock("@/lib/firebase/client", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

describe("Category Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCategory", () => {
    it("should create category with required fields only", async () => {
      const { createCategory } = await import("../categories");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("category-123"));

      const input: CreateCategoryInput = {
        sessionId: "session-123",
        name: "Ideas",
      };

      const result = await createCategory(input);

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result).toEqual({ categoryId: "category-123" });

      const categoryData = getCallArg<Record<string, unknown>>(mockAddDoc, 0, 1);
      expect(categoryData.sessionId).toBe("session-123");
      expect(categoryData.name).toBe("Ideas");
      expect(categoryData.color).toBe("#3b82f6"); // Default color
      expect(categoryData.order).toBe(0); // Default order
    });

    it("should create category with custom color and order", async () => {
      const { createCategory } = await import("../categories");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("category-456"));

      const input: CreateCategoryInput = {
        sessionId: "session-123",
        name: "Feedback",
        color: "#ef4444",
        order: 2,
      };

      await createCategory(input);

      const categoryData = getCallArg<Record<string, unknown>>(mockAddDoc, 0, 1);
      expect(categoryData.color).toBe("#ef4444");
      expect(categoryData.order).toBe(2);
    });

    it("should include maxEntriesPerPerson when provided", async () => {
      const { createCategory } = await import("../categories");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("category-789"));

      const input: CreateCategoryInput = {
        sessionId: "session-123",
        name: "Limited Category",
        maxEntriesPerPerson: 3,
      };

      await createCategory(input);

      const categoryData = getCallArg<Record<string, unknown>>(mockAddDoc, 0, 1);
      expect(categoryData.maxEntriesPerPerson).toBe(3);
    });

    it("should not include maxEntriesPerPerson when undefined", async () => {
      const { createCategory } = await import("../categories");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("category-999"));

      const input: CreateCategoryInput = {
        sessionId: "session-123",
        name: "Unlimited Category",
      };

      await createCategory(input);

      const categoryData = getCallArg<Record<string, unknown>>(mockAddDoc, 0, 1);
      expect(categoryData).not.toHaveProperty("maxEntriesPerPerson");
    });

    it("should handle creation errors", async () => {
      const { createCategory } = await import("../categories");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockRejectedValue(new Error("Firestore error"));

      const input: CreateCategoryInput = {
        sessionId: "session-123",
        name: "Error Category",
      };

      await expect(createCategory(input)).rejects.toThrow("Firestore error");
    });
  });

  describe("getCategory", () => {
    it("should return category when it exists", async () => {
      const { getCategory } = await import("../categories");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      mockGetDoc.mockResolvedValue({
        id: "category-123",
        exists: () => true,
        data: () => ({
          sessionId: "session-123",
          name: "Ideas",
          color: "#3b82f6",
          order: 0,
        }),
      } as never);

      const category = await getCategory("session-123", "category-123");

      expect(category).not.toBeNull();
      expect(category?.id).toBe("category-123");
      expect(category?.name).toBe("Ideas");
      expect(category?.color).toBe("#3b82f6");
      expect(category?.order).toBe(0);
    });

    it("should return null when category does not exist", async () => {
      const { getCategory } = await import("../categories");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as never);

      const category = await getCategory("session-123", "nonexistent");

      expect(category).toBeNull();
    });

    it("should include maxEntriesPerPerson when present", async () => {
      const { getCategory } = await import("../categories");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      mockGetDoc.mockResolvedValue({
        id: "category-456",
        exists: () => true,
        data: () => ({
          sessionId: "session-123",
          name: "Limited",
          color: "#ef4444",
          order: 1,
          maxEntriesPerPerson: 5,
        }),
      } as never);

      const category = await getCategory("session-123", "category-456");

      expect(category?.maxEntriesPerPerson).toBe(5);
    });
  });

  describe("getSessionCategories", () => {
    it("should return all categories for a session", async () => {
      const { getSessionCategories } = await import("../categories");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot<Category>([
          {
            id: "cat-1",
            data: {
              id: "cat-1",
              sessionId: "session-123",
              name: "Ideas",
              color: "#3b82f6",
              order: 0,
            },
          },
          {
            id: "cat-2",
            data: {
              id: "cat-2",
              sessionId: "session-123",
              name: "Feedback",
              color: "#ef4444",
              order: 1,
              maxEntriesPerPerson: 3,
            },
          },
        ]),
      );

      const categories = await getSessionCategories("session-123");

      expect(categories).toHaveLength(2);
      expect(categories[0].name).toBe("Ideas");
      expect(categories[1].name).toBe("Feedback");
      expect(categories[1].maxEntriesPerPerson).toBe(3);
    });

    it("should return empty array when no categories exist", async () => {
      const { getSessionCategories } = await import("../categories");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

      const categories = await getSessionCategories("session-123");

      expect(categories).toEqual([]);
    });

    it("should handle missing order field with default value", async () => {
      const { getSessionCategories } = await import("../categories");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "cat-1",
            data: {
              id: "cat-1",
              sessionId: "session-123",
              name: "No Order",
              color: "#3b82f6",
              // order field is missing
            },
          },
        ]),
      );

      const categories = await getSessionCategories("session-123");

      expect(categories[0].order).toBe(0);
    });
  });

  describe("updateCategory", () => {
    it("should update category name", async () => {
      const { updateCategory } = await import("../categories");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await updateCategory("session-123", "category-123", {
        name: "Updated Name",
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result).toEqual({ success: true });

      const updates = getCallArg<Partial<Category>>(mockUpdateDoc, 0, 1);
      expect(updates.name).toBe("Updated Name");
    });

    it("should update multiple fields at once", async () => {
      const { updateCategory } = await import("../categories");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateCategory("session-123", "category-123", {
        name: "New Name",
        color: "#10b981",
        order: 5,
        maxEntriesPerPerson: 10,
      });

      const updates = getCallArg<Partial<Category>>(mockUpdateDoc, 0, 1);
      expect(updates.name).toBe("New Name");
      expect(updates.color).toBe("#10b981");
      expect(updates.order).toBe(5);
      expect(updates.maxEntriesPerPerson).toBe(10);
    });

    it("should handle update errors", async () => {
      const { updateCategory } = await import("../categories");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockRejectedValue(new Error("Permission denied"));

      await expect(
        updateCategory("session-123", "category-123", { name: "New" }),
      ).rejects.toThrow("Permission denied");
    });
  });

  describe("deleteCategory", () => {
    it("should delete category successfully", async () => {
      const { deleteCategory } = await import("../categories");
      const { deleteDoc } = await import("firebase/firestore");

      const mockDeleteDoc = vi.mocked(deleteDoc);
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await deleteCategory("session-123", "category-123");

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("should handle deletion errors", async () => {
      const { deleteCategory } = await import("../categories");
      const { deleteDoc } = await import("firebase/firestore");

      const mockDeleteDoc = vi.mocked(deleteDoc);
      mockDeleteDoc.mockRejectedValue(new Error("Not found"));

      await expect(
        deleteCategory("session-123", "nonexistent"),
      ).rejects.toThrow("Not found");
    });
  });
});
