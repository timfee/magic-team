import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreateMagicSessionInput } from "@/lib/types/session";
import type {
  DocumentReference,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";

interface SessionData {
  name: string;
  description?: string;
  visibility: "public" | "private" | "protected";
  currentStage: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateData {
  name?: string;
  description?: string;
  visibility?: "public" | "private" | "protected";
  currentStage?: string;
  updatedAt?: Date;
}

interface AdminData {
  sessionId: string;
  userId: string;
  role: "admin";
  addedAt: Date;
  addedById: string;
}

// Mock Firebase
vi.mock("@/lib/firebase/client", () => ({
  db: {},
}));

// Create a Timestamp class mock
class MockTimestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  toDate() {
    return new Date(this.seconds * 1000);
  }
}

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: MockTimestamp,
}));

describe("Session Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("should validate session input", async () => {
      const { createSession } = await import("../session");
      const { addDoc, setDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      const mockSetDoc = vi.mocked(setDoc);

      mockAddDoc.mockResolvedValue({
        id: "test-session-id",
      } as DocumentReference<DocumentData>);
      mockSetDoc.mockResolvedValue(undefined);

      const input: CreateMagicSessionInput = {
        name: "Test Session",
        description: "Test description",
        visibility: "public",
        categories: [
          { name: "Category 1", color: "#ff0000" },
          { name: "Category 2", color: "#00ff00" },
        ],
      };

      const result = await createSession(input, "user-123");

      expect(result).toHaveProperty("sessionId");
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it("should create session with default values", async () => {
      const { createSession } = await import("../session");
      const { addDoc, setDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      const mockSetDoc = vi.mocked(setDoc);

      mockAddDoc.mockResolvedValue({
        id: "test-session-id",
      } as DocumentReference<DocumentData>);
      mockSetDoc.mockResolvedValue(undefined);

      const input: CreateMagicSessionInput = {
        name: "Minimal Session",
        categories: [],
      };

      await createSession(input, "user-123");

      const firstCall = mockAddDoc.mock.calls[0];
      const sessionData = firstCall[1] as Partial<SessionData>;

      expect(sessionData.visibility).toBe("public");
      expect(sessionData.currentStage).toBe("pre_session");
      expect(sessionData.ownerId).toBe("user-123");
    });

    it("should handle categories with maxEntriesPerPerson", async () => {
      const { createSession } = await import("../session");
      const { addDoc, setDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      const mockSetDoc = vi.mocked(setDoc);

      mockAddDoc.mockResolvedValue({
        id: "test-session-id",
      } as DocumentReference<DocumentData>);
      mockSetDoc.mockResolvedValue(undefined);

      const input: CreateMagicSessionInput = {
        name: "Session with Limits",
        categories: [
          {
            name: "Limited Category",
            color: "#ff0000",
            maxEntriesPerPerson: 5,
          },
        ],
      };

      await createSession(input, "user-123");

      // Should have been called for session doc + 1 category + 1 settings
      expect(mockAddDoc).toHaveBeenCalledTimes(2);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateSession", () => {
    it("should update session with timestamp", async () => {
      const { updateSession } = await import("../session");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateSession("session-123", { name: "Updated Name" });

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateData = mockUpdateDoc.mock.calls[0][1] as UpdateData;
      expect(updateData.name).toBe("Updated Name");
      expect(updateData).toHaveProperty("updatedAt");
    });
  });

  describe("updateSessionStage", () => {
    it("should update session stage", async () => {
      const { updateSessionStage } = await import("../session");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateSessionStage("session-123", "green_room");

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateData = mockUpdateDoc.mock.calls[0][1] as UpdateData;
      expect(updateData.currentStage).toBe("green_room");
    });

    it("should handle stage update errors", async () => {
      const { updateSessionStage } = await import("../session");
      const { updateDoc } = await import("firebase/firestore");

      const mockUpdateDoc = vi.mocked(updateDoc);
      mockUpdateDoc.mockRejectedValue(new Error("Update failed"));

      await expect(
        updateSessionStage("session-123", "green_room"),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("deleteSession", () => {
    it("should delete session document", async () => {
      const { deleteSession } = await import("../session");
      const { deleteDoc } = await import("firebase/firestore");

      const mockDeleteDoc = vi.mocked(deleteDoc);
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await deleteSession("session-123");

      expect(mockDeleteDoc).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("addSessionAdmin", () => {
    it("should add admin with metadata", async () => {
      const { addSessionAdmin } = await import("../session");
      const { addDoc } = await import("firebase/firestore");

      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({
        id: "admin-doc-id",
      } as DocumentReference<DocumentData>);

      const result = await addSessionAdmin(
        "session-123",
        "admin-user-456",
        "owner-user-789",
      );

      expect(mockAddDoc).toHaveBeenCalled();
      const adminData = mockAddDoc.mock.calls[0][1] as Partial<AdminData>;
      expect(adminData.userId).toBe("admin-user-456");
      expect(adminData.addedById).toBe("owner-user-789");
      expect(adminData.role).toBe("admin");
      expect(result.adminId).toBe("admin-doc-id");
    });
  });

  describe("getUserSessions", () => {
    it("should fetch sessions for user", async () => {
      const { getUserSessions } = await import("../session");
      const { getDocs, Timestamp } = await import("firebase/firestore");

      const timestamp1 = new Date("2024-01-01").getTime() / 1000;
      const mockTimestamp1 = new (
        Timestamp as unknown as new (
          seconds: number,
          nanoseconds: number,
        ) => { toDate(): Date }
      )(timestamp1, 0);

      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: "session-1",
            data: () => ({
              name: "Session 1",
              ownerId: "user-123",
              visibility: "public",
              currentStage: "pre_session",
              createdAt: mockTimestamp1,
              updatedAt: mockTimestamp1,
            }),
          },
          {
            id: "session-2",
            data: () => ({
              name: "Session 2",
              ownerId: "user-123",
              visibility: "private",
              currentStage: "green_room",
              createdAt: mockTimestamp1,
              updatedAt: mockTimestamp1,
            }),
          },
        ],
        metadata: {} as never,
        query: {} as never,
        size: 2,
        empty: false,
        forEach: () => {
          // Mock implementation - not used in this test
        },
        docChanges: () => [],
      } as unknown as QuerySnapshot<DocumentData>);

      const sessions = await getUserSessions("user-123");

      expect(sessions).toHaveLength(2);
      expect(sessions[0].name).toBe("Session 1");
      expect(sessions[1].name).toBe("Session 2");
    });
  });
});
