import { describe, it, expect } from "vitest";
import { getUserRole, getSessionPermissions } from "../permissions";
import type { MagicSessionWithDetails } from "@/lib/types/session";

describe("Permissions Utilities", () => {
  const mockSession: MagicSessionWithDetails = {
    id: "session-123",
    name: "Test Session",
    description: "Test description",
    ownerId: "owner-123",
    visibility: "public",
    currentStage: "pre_session",
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [],
    settings: null,
    owner: {
      id: "owner-123",
      name: "Owner User",
      email: "owner@example.com",
      image: null,
    },
    admins: [
      {
        id: "admin-doc-1",
        userId: "admin-456",
        role: "admin",
        addedAt: new Date(),
        addedById: "owner-123",
      },
    ],
    _count: {
      ideas: 0,
      presence: 0,
    },
  };

  describe("getUserRole", () => {
    it("should return 'owner' for session owner", () => {
      const role = getUserRole(mockSession, "owner-123");
      expect(role).toBe("owner");
    });

    it("should return 'admin' for session admin", () => {
      const role = getUserRole(mockSession, "admin-456");
      expect(role).toBe("admin");
    });

    it("should return 'participant' for regular user", () => {
      const role = getUserRole(mockSession, "user-789");
      expect(role).toBe("participant");
    });
  });

  describe("getSessionPermissions", () => {
    it("should grant all permissions to owner", () => {
      const permissions = getSessionPermissions(mockSession, "owner-123");

      expect(permissions.canEditSettings).toBe(true);
      expect(permissions.canChangeStage).toBe(true);
      expect(permissions.canAddAdmins).toBe(true);
      expect(permissions.canDeleteSession).toBe(true);
      expect(permissions.canModerateContent).toBe(true);
      expect(permissions.canViewPresentation).toBe(true);
    });

    it("should grant admin permissions to admins", () => {
      const permissions = getSessionPermissions(mockSession, "admin-456");

      expect(permissions.canEditSettings).toBe(true);
      expect(permissions.canChangeStage).toBe(true);
      expect(permissions.canAddAdmins).toBe(false);
      expect(permissions.canDeleteSession).toBe(false);
      expect(permissions.canModerateContent).toBe(true);
      expect(permissions.canViewPresentation).toBe(true);
    });

    it("should grant only view permissions to participants", () => {
      const permissions = getSessionPermissions(mockSession, "user-789");

      expect(permissions.canEditSettings).toBe(false);
      expect(permissions.canChangeStage).toBe(false);
      expect(permissions.canAddAdmins).toBe(false);
      expect(permissions.canDeleteSession).toBe(false);
      expect(permissions.canModerateContent).toBe(false);
      expect(permissions.canViewPresentation).toBe(true);
    });
  });
});
