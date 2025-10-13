"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSessionStage = exports.removeSessionAdmin = exports.addSessionAdmin = exports.deleteSession = exports.updateSession = exports.getUserSessions = exports.getSession = exports.createSession = void 0;
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const schema_1 = require("@/lib/db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const cache_1 = require("next/cache");
const createSession = async (input) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const sessionId = crypto.randomUUID();
    // Create session, categories, and settings in a transaction
    await db_1.db.transaction(async (tx) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        // Create the main session
        await tx.insert(schema_1.magicSessions).values({
            id: sessionId,
            name: input.name,
            description: input.description,
            ownerId: session.user.id,
            visibility: (_a = input.visibility) !== null && _a !== void 0 ? _a : "public",
            currentStage: "pre_session",
        });
        // Create categories
        const categoriesToInsert = input.categories.map((cat, index) => {
            var _a;
            return ({
                id: crypto.randomUUID(),
                sessionId,
                name: cat.name,
                color: (_a = cat.color) !== null && _a !== void 0 ? _a : "#3b82f6",
                order: index,
                maxEntriesPerPerson: cat.maxEntriesPerPerson,
            });
        });
        await tx.insert(schema_1.categories).values(categoriesToInsert);
        // Create default settings
        await tx.insert(schema_1.sessionSettings).values({
            sessionId,
            enablePreSession: (_c = (_b = input.settings) === null || _b === void 0 ? void 0 : _b.enablePreSession) !== null && _c !== void 0 ? _c : true,
            enablePreSubmit: (_e = (_d = input.settings) === null || _d === void 0 ? void 0 : _d.enablePreSubmit) !== null && _e !== void 0 ? _e : false,
            enableGreenRoom: (_g = (_f = input.settings) === null || _f === void 0 ? void 0 : _f.enableGreenRoom) !== null && _g !== void 0 ? _g : true,
            votesPerUser: (_h = input.settings) === null || _h === void 0 ? void 0 : _h.votesPerUser,
            maxVotesPerIdea: (_j = input.settings) === null || _j === void 0 ? void 0 : _j.maxVotesPerIdea,
            maxVotesPerCategory: (_k = input.settings) === null || _k === void 0 ? void 0 : _k.maxVotesPerCategory,
            allowVotingOnGroups: (_m = (_l = input.settings) === null || _l === void 0 ? void 0 : _l.allowVotingOnGroups) !== null && _m !== void 0 ? _m : true,
            allowVotingOnIdeas: (_p = (_o = input.settings) === null || _o === void 0 ? void 0 : _o.allowVotingOnIdeas) !== null && _p !== void 0 ? _p : true,
            allowGroupsInCategories: (_q = input.settings) === null || _q === void 0 ? void 0 : _q.allowGroupsInCategories,
            disallowGroupsInCategories: (_r = input.settings) === null || _r === void 0 ? void 0 : _r.disallowGroupsInCategories,
            ideaCollectionDuration: (_s = input.settings) === null || _s === void 0 ? void 0 : _s.ideaCollectionDuration,
            votingDuration: (_t = input.settings) === null || _t === void 0 ? void 0 : _t.votingDuration,
            customSettings: (_u = input.settings) === null || _u === void 0 ? void 0 : _u.customSettings,
        });
    });
    (0, cache_1.revalidatePath)("/");
    return { sessionId };
};
exports.createSession = createSession;
const getSession = async (sessionId) => {
    var _a, _b, _c, _d;
    const result = await db_1.db.query.magicSessions.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.magicSessions.id, sessionId),
        with: {
            owner: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            categories: {
                orderBy: (categories, { asc }) => [asc(categories.order)],
            },
            settings: true,
            admins: true,
        },
    });
    if (!result)
        return null;
    // Get counts
    const [ideasCountResult, presenceCountResult] = await Promise.all([
        db_1.db
            .select({ value: (0, drizzle_orm_1.count)() })
            .from(schema_1.ideas)
            .where((0, drizzle_orm_1.eq)(schema_1.ideas.sessionId, sessionId)),
        db_1.db
            .select({ value: (0, drizzle_orm_1.count)() })
            .from(schema_1.userPresence)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPresence.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.userPresence.isActive, true))),
    ]);
    const ideasCount = (_b = (_a = ideasCountResult[0]) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
    const presenceCount = (_d = (_c = presenceCountResult[0]) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0;
    return Object.assign(Object.assign({}, result), { _count: {
            ideas: ideasCount,
            presence: presenceCount,
        } });
};
exports.getSession = getSession;
const getUserSessions = async () => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return [];
    }
    const result = await db_1.db.query.magicSessions.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.magicSessions.ownerId, session.user.id),
        orderBy: [(0, drizzle_orm_1.desc)(schema_1.magicSessions.createdAt)],
        with: {
            owner: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            categories: true,
            settings: true,
        },
    });
    return result;
};
exports.getUserSessions = getUserSessions;
const updateSession = async (sessionId, input) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    // Check if user is owner or admin
    const magicSession = await db_1.db.query.magicSessions.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.magicSessions.id, sessionId),
        with: {
            admins: true,
        },
    });
    if (!magicSession) {
        throw new Error("Session not found");
    }
    const isOwner = magicSession.ownerId === session.user.id;
    const isAdmin = magicSession.admins.some((admin) => admin.userId === session.user.id);
    if (!isOwner && !isAdmin) {
        throw new Error("Unauthorized");
    }
    await db_1.db
        .update(schema_1.magicSessions)
        .set(Object.assign(Object.assign({}, input), { updatedAt: new Date() }))
        .where((0, drizzle_orm_1.eq)(schema_1.magicSessions.id, sessionId));
    (0, cache_1.revalidatePath)(`/session/${sessionId}`);
    return { success: true };
};
exports.updateSession = updateSession;
const deleteSession = async (sessionId) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    // Check if user is owner
    const magicSession = await db_1.db.query.magicSessions.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.magicSessions.id, sessionId),
    });
    if (!magicSession) {
        throw new Error("Session not found");
    }
    if (magicSession.ownerId !== session.user.id) {
        throw new Error("Unauthorized - only owner can delete session");
    }
    await db_1.db.delete(schema_1.magicSessions).where((0, drizzle_orm_1.eq)(schema_1.magicSessions.id, sessionId));
    (0, cache_1.revalidatePath)("/");
    return { success: true };
};
exports.deleteSession = deleteSession;
const addSessionAdmin = async (sessionId, userId) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    // Check if user is owner
    const magicSession = await db_1.db.query.magicSessions.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.magicSessions.id, sessionId),
    });
    if (!magicSession) {
        throw new Error("Session not found");
    }
    if (magicSession.ownerId !== session.user.id) {
        throw new Error("Unauthorized - only owner can add admins");
    }
    await db_1.db.insert(schema_1.sessionAdmins).values({
        sessionId,
        userId,
    });
    (0, cache_1.revalidatePath)(`/session/${sessionId}`);
    return { success: true };
};
exports.addSessionAdmin = addSessionAdmin;
const removeSessionAdmin = async (sessionId, userId) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    // Check if user is owner
    const magicSession = await db_1.db.query.magicSessions.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.magicSessions.id, sessionId),
    });
    if (!magicSession) {
        throw new Error("Session not found");
    }
    if (magicSession.ownerId !== session.user.id) {
        throw new Error("Unauthorized - only owner can remove admins");
    }
    await db_1.db
        .delete(schema_1.sessionAdmins)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.sessionAdmins.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.sessionAdmins.userId, userId)));
    (0, cache_1.revalidatePath)(`/session/${sessionId}`);
    return { success: true };
};
exports.removeSessionAdmin = removeSessionAdmin;
const updateSessionStage = async (sessionId, stage) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    // Check if user is owner or admin
    const magicSession = await db_1.db.query.magicSessions.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.magicSessions.id, sessionId),
        with: {
            admins: true,
        },
    });
    if (!magicSession) {
        throw new Error("Session not found");
    }
    const isOwner = magicSession.ownerId === session.user.id;
    const isAdmin = magicSession.admins.some((admin) => admin.userId === session.user.id);
    if (!isOwner && !isAdmin) {
        throw new Error("Unauthorized");
    }
    await db_1.db
        .update(schema_1.magicSessions)
        .set({
        currentStage: stage,
        updatedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.magicSessions.id, sessionId));
    (0, cache_1.revalidatePath)(`/session/${sessionId}`);
    return { success: true };
};
exports.updateSessionStage = updateSessionStage;
