"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAccessSession = exports.getSessionPermissions = exports.getUserRole = void 0;
const getUserRole = (session, userId) => {
    var _a;
    if (!userId)
        return "participant";
    if (session.ownerId === userId)
        return "owner";
    if ((_a = session.admins) === null || _a === void 0 ? void 0 : _a.some((admin) => admin.userId === userId))
        return "admin";
    return "participant";
};
exports.getUserRole = getUserRole;
const getSessionPermissions = (role) => {
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
exports.getSessionPermissions = getSessionPermissions;
const canAccessSession = (session, userId, isInvited = false) => {
    // Public sessions are always accessible
    if (session.visibility === "public")
        return true;
    // Private sessions are accessible but hidden (anyone with link can access)
    if (session.visibility === "private")
        return true;
    // Protected sessions require authentication and invitation
    if (session.visibility === "protected") {
        if (!userId)
            return false;
        // Owner and admins always have access
        if (session.ownerId === userId)
            return true;
        // Check if user is invited (this would need to be passed in from a separate invites table if implemented)
        return isInvited;
    }
    return false;
};
exports.canAccessSession = canAccessSession;
