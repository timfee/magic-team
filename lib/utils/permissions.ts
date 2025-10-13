import type {
  MagicSession,
  SessionPermissions,
  SessionRole,
} from "@/lib/types/session";

export const getUserRole = (
  session: MagicSession & { admins?: { userId: string }[] },
  userId: string | undefined,
): SessionRole => {
  if (!userId) return "participant";
  if (session.ownerId === userId) return "owner";
  if (session.admins?.some((admin) => admin.userId === userId)) return "admin";
  return "participant";
};

export const getSessionPermissions = (role: SessionRole): SessionPermissions => {
  switch (role) {
    case "owner":
      return {
        canEditSettings: true,
        canChangeStage: true,
        canAddAdmins: true,
        canDeleteSession: true,
        canModerateContent: true,
        canViewPresentation: true,
      };
    case "admin":
      return {
        canEditSettings: true,
        canChangeStage: true,
        canAddAdmins: false,
        canDeleteSession: false,
        canModerateContent: true,
        canViewPresentation: true,
      };
    case "participant":
      return {
        canEditSettings: false,
        canChangeStage: false,
        canAddAdmins: false,
        canDeleteSession: false,
        canModerateContent: false,
        canViewPresentation: false,
      };
  }
};

export const canAccessSession = (
  session: MagicSession,
  userId: string | undefined,
  isInvited: boolean = false,
): boolean => {
  // Public sessions are always accessible
  if (session.visibility === "public") return true;

  // Private sessions are accessible but hidden (anyone with link can access)
  if (session.visibility === "private") return true;

  // Protected sessions require authentication and invitation
  if (session.visibility === "protected") {
    if (!userId) return false;
    // Owner and admins always have access
    if (session.ownerId === userId) return true;
    // Check if user is invited (this would need to be passed in from a separate invites table if implemented)
    return isInvited;
  }

  return false;
};
