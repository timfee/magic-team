import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockDocSnapshot, getCallArg } from "./test-helpers";
import { acquireLock, releaseLock, refreshLock, checkLock } from "../idea-locks";

// Mock Firebase
vi.mock("@/lib/firebase/client", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((db, ...pathSegments) => ({ path: pathSegments.join("/") })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
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
  lockedById?: string | null;
  lockedAt?: { toDate: () => Date } | Date | null;
  updatedAt?: Date;
}

describe("Idea Lock Actions", () => {
  const mockDate = new Date("2024-01-01T12:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date globally
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("acquireLock", () => {
    it("should acquire lock on unlocked idea", async () => {
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
      const { getDoc, updateDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      const mockUpdateDoc = vi.mocked(updateDoc);

      // Lock expired 31 seconds ago (current time is 2024-01-01T12:00:00Z)
      const currentTime = new Date("2024-01-01T12:00:00Z");
      const expiredTime = new Date(currentTime.getTime() - 31000); // 31s ago from mocked time

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
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      // Lock acquired 10 seconds ago (still fresh - within 30s window)
      const currentTime = new Date("2024-01-01T12:00:00Z");
      const recentTime = new Date(currentTime.getTime() - 10000); // 10s ago

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
      const { getDoc, updateDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);
      const mockUpdateDoc = vi.mocked(updateDoc);

      const currentTime = new Date("2024-01-01T12:00:00Z");
      const recentTime = new Date(currentTime.getTime() - 10000); // 10s ago

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
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      const currentTime = new Date("2024-01-01T12:00:00Z");
      const expiredTime = new Date(currentTime.getTime() - 31000); // 31s ago

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
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      const currentTime = new Date("2024-01-01T12:00:00Z");
      const recentTime = new Date(currentTime.getTime() - 10000); // 10s ago

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
      const { getDoc } = await import("firebase/firestore");

      const mockGetDoc = vi.mocked(getDoc);

      const currentTime = new Date("2024-01-01T12:00:00Z");
      const recentTime = new Date(currentTime.getTime() - 10000); // 10s ago

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
