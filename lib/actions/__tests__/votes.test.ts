import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CastVoteInput } from "@/lib/types/session";
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
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: class MockTimestamp {
    toDate(): Date {
      return new Date("2024-01-01");
    }
  },
}));

interface VoteData {
  sessionId: string;
  categoryId: string;
  userId: string;
  ideaId?: string;
  groupId?: string;
  createdAt: Date;
}

describe("Vote Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("castVote", () => {
    it("should cast vote on an idea", async () => {
      const { castVote } = await import("../votes");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("vote-123"));

      const input: CastVoteInput = {
        sessionId: "session-123",
        categoryId: "category-456",
        ideaId: "idea-789",
      };

      const result = await castVote(input, "user-111");

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result).toEqual({ success: true, voteId: "vote-123" });

      const voteData = getCallArg<Partial<VoteData>>(mockAddDoc, 0, 1);
      expect(voteData.sessionId).toBe("session-123");
      expect(voteData.categoryId).toBe("category-456");
      expect(voteData.ideaId).toBe("idea-789");
      expect(voteData.userId).toBe("user-111");
      expect(hasProperties<VoteData>(voteData, "createdAt")).toBe(true);
    });

    it("should cast vote on a group", async () => {
      const { castVote } = await import("../votes");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("vote-456"));

      const input: CastVoteInput = {
        sessionId: "session-123",
        categoryId: "category-456",
        groupId: "group-789",
      };

      const result = await castVote(input, "user-222");

      expect(result).toEqual({ success: true, voteId: "vote-456" });

      const voteData = getCallArg<Partial<VoteData>>(mockAddDoc, 0, 1);
      expect(voteData.groupId).toBe("group-789");
      expect(voteData.userId).toBe("user-222");
    });

    it("should enforce userId from parameter not input", async () => {
      const { castVote } = await import("../votes");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue(createMockDocRef("vote-789"));

      const input: CastVoteInput = {
        sessionId: "session-123",
        categoryId: "category-456",
        ideaId: "idea-123",
      };

      await castVote(input, "authenticated-user");

      const voteData = getCallArg<Partial<VoteData>>(mockAddDoc, 0, 1);
      expect(voteData.userId).toBe("authenticated-user");
    });

    it("should handle casting errors", async () => {
      const { castVote } = await import("../votes");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockRejectedValue(new Error("Vote limit exceeded"));

      const input: CastVoteInput = {
        sessionId: "session-123",
        categoryId: "category-456",
        ideaId: "idea-123",
      };

      await expect(castVote(input, "user-123")).rejects.toThrow(
        "Vote limit exceeded",
      );
    });
  });

  describe("removeVote", () => {
    it("should remove vote successfully", async () => {
      const { removeVote } = await import("../votes");
      const { deleteDoc } = await import("firebase/firestore");

      const mockDeleteDoc = vi.mocked(deleteDoc);
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await removeVote("vote-123", "session-456");

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("should handle removal errors", async () => {
      const { removeVote } = await import("../votes");
      const { deleteDoc } = await import("firebase/firestore");

      const mockDeleteDoc = vi.mocked(deleteDoc);
      mockDeleteDoc.mockRejectedValue(new Error("Vote not found"));

      await expect(removeVote("nonexistent", "session-456")).rejects.toThrow(
        "Vote not found",
      );
    });
  });

  describe("getSessionVotes", () => {
    it("should get all votes for a session", async () => {
      const { getSessionVotes } = await import("../votes");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "vote-1",
            data: {
              id: "vote-1",
              sessionId: "session-123",
              categoryId: "category-1",
              userId: "user-1",
              ideaId: "idea-1",
              createdAt: mockTimestamp,
            },
          },
          {
            id: "vote-2",
            data: {
              id: "vote-2",
              sessionId: "session-123",
              categoryId: "category-1",
              userId: "user-2",
              ideaId: "idea-1",
              createdAt: mockTimestamp,
            },
          },
          {
            id: "vote-3",
            data: {
              id: "vote-3",
              sessionId: "session-123",
              categoryId: "category-2",
              userId: "user-1",
              groupId: "group-1",
              createdAt: mockTimestamp,
            },
          },
        ]),
      );

      const votes = await getSessionVotes("session-123");

      expect(votes).toHaveLength(3);
      expect(votes[0].ideaId).toBe("idea-1");
      expect(votes[2].groupId).toBe("group-1");
    });

    it("should return empty array when no votes exist", async () => {
      const { getSessionVotes } = await import("../votes");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

      const votes = await getSessionVotes("session-123");

      expect(votes).toEqual([]);
    });

    it("should convert Timestamp to Date", async () => {
      const { getSessionVotes } = await import("../votes");
      const { getDocs, Timestamp } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "vote-1",
            data: {
              id: "vote-1",
              sessionId: "session-123",
              categoryId: "category-1",
              userId: "user-1",
              ideaId: "idea-1",
              createdAt: new Timestamp(1704067200, 0),
            },
          },
        ]),
      );

      const votes = await getSessionVotes("session-123");

      expect(votes[0].createdAt).toBeInstanceOf(Date);
    });

    it("should handle non-Timestamp date fields", async () => {
      const { getSessionVotes } = await import("../votes");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "vote-1",
            data: {
              id: "vote-1",
              sessionId: "session-123",
              categoryId: "category-1",
              userId: "user-1",
              ideaId: "idea-1",
              createdAt: "invalid-timestamp",
            },
          },
        ]),
      );

      const votes = await getSessionVotes("session-123");

      expect(votes[0].createdAt).toBeInstanceOf(Date);
    });
  });

  describe("getUserVotes", () => {
    it("should get votes for specific user", async () => {
      const { getUserVotes } = await import("../votes");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "vote-1",
            data: {
              id: "vote-1",
              sessionId: "session-123",
              categoryId: "category-1",
              userId: "user-specific",
              ideaId: "idea-1",
              createdAt: mockTimestamp,
            },
          },
          {
            id: "vote-2",
            data: {
              id: "vote-2",
              sessionId: "session-123",
              categoryId: "category-2",
              userId: "user-specific",
              groupId: "group-1",
              createdAt: mockTimestamp,
            },
          },
        ]),
      );

      const votes = await getUserVotes("session-123", "user-specific");

      expect(votes).toHaveLength(2);
      expect(votes.every((vote) => vote.userId === "user-specific")).toBe(true);
    });

    it("should return empty array when user has no votes", async () => {
      const { getUserVotes } = await import("../votes");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

      const votes = await getUserVotes("session-123", "user-no-votes");

      expect(votes).toEqual([]);
    });

    it("should distinguish between idea and group votes", async () => {
      const { getUserVotes } = await import("../votes");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: "vote-1",
            data: {
              id: "vote-1",
              sessionId: "session-123",
              categoryId: "category-1",
              userId: "user-123",
              ideaId: "idea-1",
              createdAt: mockTimestamp,
            },
          },
          {
            id: "vote-2",
            data: {
              id: "vote-2",
              sessionId: "session-123",
              categoryId: "category-1",
              userId: "user-123",
              groupId: "group-1",
              createdAt: mockTimestamp,
            },
          },
        ]),
      );

      const votes = await getUserVotes("session-123", "user-123");

      const ideaVotes = votes.filter((v) => v.ideaId);
      const groupVotes = votes.filter((v) => v.groupId);

      expect(ideaVotes).toHaveLength(1);
      expect(groupVotes).toHaveLength(1);
    });

    it("should handle query errors", async () => {
      const { getUserVotes } = await import("../votes");
      const { getDocs } = await import("firebase/firestore");

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockRejectedValue(new Error("Query failed"));

      await expect(getUserVotes("session-123", "user-123")).rejects.toThrow(
        "Query failed",
      );
    });
  });

  describe("getVoteCounts", () => {
    it("should return empty object (stub implementation)", async () => {
      const { getVoteCounts } = await import("../votes");

      const result = await getVoteCounts();

      expect(result).toEqual({});
    });
  });
});
