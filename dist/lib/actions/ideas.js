"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveIdeaToGroup = exports.deleteIdeaGroup = exports.updateIdeaGroup = exports.getSessionGroups = exports.createIdeaGroup = exports.deleteIdea = exports.updateIdea = exports.getSessionIdeas = exports.createIdea = void 0;
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const schema_1 = require("@/lib/db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const cache_1 = require("next/cache");
const createIdea = async (input) => {
    var _a, _b;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const ideaId = crypto.randomUUID();
    await db_1.db.insert(schema_1.ideas).values({
        id: ideaId,
        sessionId: input.sessionId,
        categoryId: input.categoryId,
        content: input.content,
        authorId: input.isAnonymous ? null : session.user.id,
        isAnonymous: (_b = input.isAnonymous) !== null && _b !== void 0 ? _b : true,
        order: 0,
    });
    (0, cache_1.revalidatePath)(`/session/${input.sessionId}`);
    return { ideaId };
};
exports.createIdea = createIdea;
const getSessionIdeas = async (sessionId) => {
    const result = await db_1.db.query.ideas.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.ideas.sessionId, sessionId),
        with: {
            author: {
                columns: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            group: true,
            comments: {
                with: {
                    user: {
                        columns: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
                orderBy: [(0, drizzle_orm_1.desc)(schema_1.comments.createdAt)],
            },
            votes: true,
        },
        orderBy: [(0, drizzle_orm_1.desc)(schema_1.ideas.createdAt)],
    });
    return result.map((idea) => (Object.assign(Object.assign({}, idea), { _count: {
            votes: idea.votes.length,
            comments: idea.comments.length,
        } })));
};
exports.getSessionIdeas = getSessionIdeas;
const updateIdea = async (ideaId, input) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const idea = await db_1.db.query.ideas.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.ideas.id, ideaId),
    });
    if (!idea) {
        throw new Error("Idea not found");
    }
    // Check if user is the author (for non-anonymous ideas) or an admin
    if (idea.authorId && idea.authorId !== session.user.id) {
        // TODO: Check if user is admin
    }
    await db_1.db
        .update(schema_1.ideas)
        .set(Object.assign(Object.assign({}, input), { updatedAt: new Date() }))
        .where((0, drizzle_orm_1.eq)(schema_1.ideas.id, ideaId));
    (0, cache_1.revalidatePath)(`/session/${idea.sessionId}`);
    return { success: true };
};
exports.updateIdea = updateIdea;
const deleteIdea = async (ideaId) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const idea = await db_1.db.query.ideas.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.ideas.id, ideaId),
    });
    if (!idea) {
        throw new Error("Idea not found");
    }
    // Check if user is the author or an admin
    if (idea.authorId && idea.authorId !== session.user.id) {
        // TODO: Check if user is admin
        throw new Error("Unauthorized");
    }
    await db_1.db.delete(schema_1.ideas).where((0, drizzle_orm_1.eq)(schema_1.ideas.id, ideaId));
    (0, cache_1.revalidatePath)(`/session/${idea.sessionId}`);
    return { success: true };
};
exports.deleteIdea = deleteIdea;
// ============================================================
// Idea Groups
// ============================================================
const createIdeaGroup = async (input) => {
    var _a, _b;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const groupId = crypto.randomUUID();
    await db_1.db.insert(schema_1.ideaGroups).values({
        id: groupId,
        sessionId: input.sessionId,
        categoryId: input.categoryId,
        title: input.title,
        order: (_b = input.order) !== null && _b !== void 0 ? _b : 0,
        maxCards: input.maxCards,
    });
    (0, cache_1.revalidatePath)(`/session/${input.sessionId}`);
    return { groupId };
};
exports.createIdeaGroup = createIdeaGroup;
const getSessionGroups = async (sessionId) => {
    const result = await db_1.db.query.ideaGroups.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.ideaGroups.sessionId, sessionId),
        with: {
            ideas: true,
            comments: {
                with: {
                    user: {
                        columns: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
                orderBy: [(0, drizzle_orm_1.desc)(schema_1.comments.createdAt)],
            },
            votes: true,
        },
    });
    return result.map((group) => (Object.assign(Object.assign({}, group), { _count: {
            ideas: group.ideas.length,
            votes: group.votes.length,
            comments: group.comments.length,
        } })));
};
exports.getSessionGroups = getSessionGroups;
const updateIdeaGroup = async (groupId, input) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const group = await db_1.db.query.ideaGroups.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.ideaGroups.id, groupId),
    });
    if (!group) {
        throw new Error("Group not found");
    }
    await db_1.db
        .update(schema_1.ideaGroups)
        .set(Object.assign(Object.assign({}, input), { updatedAt: new Date() }))
        .where((0, drizzle_orm_1.eq)(schema_1.ideaGroups.id, groupId));
    (0, cache_1.revalidatePath)(`/session/${group.sessionId}`);
    return { success: true };
};
exports.updateIdeaGroup = updateIdeaGroup;
const deleteIdeaGroup = async (groupId) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const group = await db_1.db.query.ideaGroups.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.ideaGroups.id, groupId),
    });
    if (!group) {
        throw new Error("Group not found");
    }
    await db_1.db.delete(schema_1.ideaGroups).where((0, drizzle_orm_1.eq)(schema_1.ideaGroups.id, groupId));
    (0, cache_1.revalidatePath)(`/session/${group.sessionId}`);
    return { success: true };
};
exports.deleteIdeaGroup = deleteIdeaGroup;
const moveIdeaToGroup = async (ideaId, groupId) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const idea = await db_1.db.query.ideas.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.ideas.id, ideaId),
    });
    if (!idea) {
        throw new Error("Idea not found");
    }
    await db_1.db
        .update(schema_1.ideas)
        .set({
        groupId,
        updatedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.ideas.id, ideaId));
    (0, cache_1.revalidatePath)(`/session/${idea.sessionId}`);
    return { success: true };
};
exports.moveIdeaToGroup = moveIdeaToGroup;
