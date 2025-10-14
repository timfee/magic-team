import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockDocRef,
  createMockDocSnapshot,
  getCallArg,
} from "./test-helpers";

// Mock Firebase
vi.mock("@/lib/firebase/client", () => ({
  db: {},
}));

const mockTimestamp = vi.fn(() => new Date("2024-01-01T12:00:00Z"));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((db, ...pathSegments) => ({ path: pathSegments.join("/") })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: mockTimestamp,
  Timestamp: class MockTimestamp {
    constructor(
      private seconds: number,
      private nanoseconds: number,
    ) {}
    toDate(): Date {
      return new Date(this.seconds * 1000);
    }
  },
}));

interface IdeaData {
  lockedById?: string;
  lockedAt?: { toDate: () => Date } | Date;
  updatedAt?: Date;
}

describe("Idea Lock Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTimestamp.mockReturnValue(new Date("2024-01-01T12:00:00Z"));
  });

  describe("acquireLock", () => {
    it("should acquire lock on unlocked idea", async () => {
      const { acquireLock } = await import("../idea-locks");
      const { getDoc, updateDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      const mockUpdateDoc = vi.mocked(updateDoc);

      // Idea has no lock
      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          content: "Test idea",
        }),
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await acquireLock("idea-123", "user-123", "session-123");

      expect(result).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalled();

      const updates = getCallArg<IdeaData>(mockUpdateDoc, 0, 1);
      expect(updates.lockedById).toBe("user-123");
      expect(updates.lockedAt).toBeDefined();
    });

    it("should acquire lock on expired lock", async () => {
      const { acquireLock } = await import("../idea-locks");
      const { getDoc, updateDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      const mockUpdateDoc = vi.mocked(updateDoc);

      // Lock expired 31 seconds ago
      const expiredTime = new Date("2024-01-01T11:59:29Z"); // 31s before current time

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          content: "Test idea",
          lockedById: "other-user",
          lockedAt: { toDate: () => expiredTime },
        }),
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await acquireLock("idea-123", "user-123", "session-123");

      expect(result).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it("should fail to acquire lock held by another user", async () => {
      const { acquireLock } = await import("../idea-locks");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      // Lock acquired 10 seconds ago (still fresh)
      const recentTime = new Date("2024-01-01T11:59:50Z"); // 10s before current time

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          content: "Test idea",
          lockedById: "other-user",
          lockedAt: { toDate: () => recentTime },
        }),
      );

      const result = await acquireLock("idea-123", "user-123", "session-123");

      expect(result).toBe(false);
    });

    it("should refresh lock if already held by same user", async () => {
      const { acquireLock } = await import("../idea-locks");
      const { getDoc, updateDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      const mockUpdateDoc = vi.mocked(updateDoc);

      const recentTime = new Date("2024-01-01T11:59:50Z");

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          content: "Test idea",
          lockedById: "user-123",
          lockedAt: { toDate: () => recentTime },
        }),
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await acquireLock("idea-123", "user-123", "session-123");

      expect(result).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it("should handle idea not found", async () => {
      const { acquireLock } = await import("../idea-locks");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      } as never);

      await expect(
        acquireLock("nonexistent", "user-123", "session-123"),
      ).rejects.toThrow("Idea not found");
    });
  });

  describe("releaseLock", () => {
    it("should release lock held by user", async () => {
      const { releaseLock } = await import("../idea-locks");
      const { getDoc, updateDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      const mockUpdateDoc = vi.mocked(updateDoc);

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          lockedById: "user-123",
          lockedAt: { toDate: () => new Date() },
        }),
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      await releaseLock("idea-123", "user-123", "session-123");

      expect(mockUpdateDoc).toHaveBeenCalled();

      const updates = getCallArg<IdeaData>(mockUpdateDoc, 0, 1);
      expect(updates.lockedById).toBe(null);
      expect(updates.lockedAt).toBe(null);
    });

    it("should not release lock held by another user", async () => {
      const { releaseLock } = await import("../idea-locks");
      const { getDoc, updateDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      const mockUpdateDoc = vi.mocked(updateDoc);

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          lockedById: "other-user",
          lockedAt: { toDate: () => new Date() },
        }),
      );

      await releaseLock("idea-123", "user-123", "session-123");

      // Should not call updateDoc since user doesn't hold the lock
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe("refreshLock", () => {
    it("should refresh lock held by user", async () => {
      const { refreshLock } = await import("../idea-locks");
      const { getDoc, updateDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      const mockUpdateDoc = vi.mocked(updateDoc);

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          lockedById: "user-123",
          lockedAt: { toDate: () => new Date() },
        }),
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await refreshLock("idea-123", "user-123", "session-123");

      expect(result).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalled();

      const updates = getCallArg<IdeaData>(mockUpdateDoc, 0, 1);
      expect(updates.lockedAt).toBeDefined();
    });

    it("should fail to refresh lock held by another user", async () => {
      const { refreshLock } = await import("../idea-locks");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          lockedById: "other-user",
          lockedAt: { toDate: () => new Date() },
        }),
      );

      const result = await refreshLock("idea-123", "user-123", "session-123");

      expect(result).toBe(false);
    });
  });

  describe("checkLock", () => {
    it("should return null for unlocked idea", async () => {
      const { checkLock } = await import("../idea-locks");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          content: "Test idea",
        }),
      );

      const result = await checkLock("idea-123", "user-123", "session-123");

      expect(result).toBe(null);
    });

    it("should return null for expired lock", async () => {
      const { checkLock } = await import("../idea-locks");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      const expiredTime = new Date("2024-01-01T11:59:29Z"); // 31s ago

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          lockedById: "other-user",
          lockedAt: { toDate: () => expiredTime },
        }),
      );

      const result = await checkLock("idea-123", "user-123", "session-123");

      expect(result).toBe(null);
    });

    it("should return null for lock held by current user", async () => {
      const { checkLock } = await import("../idea-locks");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      const recentTime = new Date("2024-01-01T11:59:50Z");

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          lockedById: "user-123",
          lockedAt: { toDate: () => recentTime },
        }),
      );

      const result = await checkLock("idea-123", "user-123", "session-123");

      expect(result).toBe(null);
    });

    it("should return user ID for lock held by another user", async () => {
      const { checkLock } = await import("../idea-locks");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      const recentTime = new Date("2024-01-01T11:59:50Z");

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot("idea-123", {
          id: "idea-123",
          lockedById: "other-user",
          lockedAt: { toDate: () => recentTime },
        }),
      );

      const result = await checkLock("idea-123", "user-123", "session-123");

      expect(result).toBe("other-user");
    });

    it("should return null for nonexistent idea", async () => {
      const { checkLock } = await import("../idea-locks");
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      } as never);

      const result = await checkLock("nonexistent", "user-123", "session-123");

      expect(result).toBe(null);
    });
  });
});
