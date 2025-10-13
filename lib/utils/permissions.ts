import type {
  MagicSessionWithDetails,
  SessionPermissions,
  SessionRole,
} from "@/lib/types/session";

export const getUserRole = (
  session: MagicSessionWithDetails,
  userId: string,
): SessionRole => {
  if (session.ownerId === userId) {
    return "owner";
  }

  if (session.admins?.some((admin) => admin.userId === userId)) {
    return "admin";
  }

  return "participant";
};

export const getSessionPermissions = (
  session: MagicSessionWithDetails,
  userId: string,
): SessionPermissions => {
  const role = getUserRole(session, userId);

  return {
    canEditSettings: role === "owner" || role === "admin",
    canChangeStage: role === "owner" || role === "admin",
    canAddAdmins: role === "owner",
    canDeleteSession: role === "owner",
    canModerateContent: role === "owner" || role === "admin",
    canViewPresentation: true, // Everyone can view
  };
};
