"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVoteCounts = exports.getUserVotes = exports.removeVote = exports.castVote = void 0;
const cache_1 = require("next/cache");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const schema_1 = require("@/lib/db/schema");
const castVote = async (input) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    // Get session settings to check voting rules
    const settings = await db_1.db.query.sessionSettings.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.sessionSettings.sessionId, input.sessionId),
    });
    if (!settings) {
        throw new Error("Session settings not found");
    }
    // Check if voting on this target type is allowed
    if (input.ideaId && !settings.allowVotingOnIdeas) {
        throw new Error("Voting on ideas is not allowed");
    }
    if (input.groupId && !settings.allowVotingOnGroups) {
        throw new Error("Voting on groups is not allowed");
    }
    // Get user's current votes
    const userVotes = await db_1.db.query.votes.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.votes.sessionId, input.sessionId), (0, drizzle_orm_1.eq)(schema_1.votes.userId, session.user.id)),
    });
    // Check total votes limit
    if (settings.votesPerUser && userVotes.length >= settings.votesPerUser) {
        throw new Error(`You have reached the maximum number of votes (${settings.votesPerUser})`);
    }
    // Check votes per category limit
    if (settings.maxVotesPerCategory) {
        const categoryVotes = userVotes.filter((v) => v.categoryId === input.categoryId);
        if (categoryVotes.length >= settings.maxVotesPerCategory) {
            throw new Error(`You have reached the maximum number of votes for this category (${settings.maxVotesPerCategory})`);
        }
    }
    // Check votes per idea/group limit
    if (settings.maxVotesPerIdea) {
        const targetVotes = userVotes.filter((v) => input.ideaId ? v.ideaId === input.ideaId : v.groupId === input.groupId);
        if (targetVotes.length >= settings.maxVotesPerIdea) {
            throw new Error(`You have reached the maximum number of votes for this item (${settings.maxVotesPerIdea})`);
        }
    }
    const voteId = crypto.randomUUID();
    await db_1.db.insert(schema_1.votes).values({
        id: voteId,
        sessionId: input.sessionId,
        categoryId: input.categoryId,
        ideaId: input.ideaId,
        groupId: input.groupId,
        userId: session.user.id,
    });
    (0, cache_1.revalidatePath)(`/session/${input.sessionId}`);
    return { voteId };
};
exports.castVote = castVote;
const removeVote = async (voteId) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const vote = await db_1.db.query.votes.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.votes.id, voteId),
    });
    if (!vote) {
        throw new Error("Vote not found");
    }
    if (vote.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }
    await db_1.db.delete(schema_1.votes).where((0, drizzle_orm_1.eq)(schema_1.votes.id, voteId));
    (0, cache_1.revalidatePath)(`/session/${vote.sessionId}`);
    return { success: true };
};
exports.removeVote = removeVote;
const getUserVotes = async (sessionId) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return [];
    }
    const result = await db_1.db.query.votes.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.votes.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.votes.userId, session.user.id)),
    });
    return result;
};
exports.getUserVotes = getUserVotes;
const getVoteCounts = async (sessionId) => {
    const ideaVotes = await db_1.db
        .select({
        ideaId: schema_1.votes.ideaId,
        count: (0, drizzle_orm_1.sql) `count(*)::int`,
    })
        .from(schema_1.votes)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.votes.sessionId, sessionId), (0, drizzle_orm_1.sql) `${schema_1.votes.ideaId} IS NOT NULL`))
        .groupBy(schema_1.votes.ideaId);
    const groupVotes = await db_1.db
        .select({
        groupId: schema_1.votes.groupId,
        count: (0, drizzle_orm_1.sql) `count(*)::int`,
    })
        .from(schema_1.votes)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.votes.sessionId, sessionId), (0, drizzle_orm_1.sql) `${schema_1.votes.groupId} IS NOT NULL`))
        .groupBy(schema_1.votes.groupId);
    return {
        ideas: Object.fromEntries(ideaVotes.map((v) => [v.ideaId, v.count]).filter(([id]) => id)),
        groups: Object.fromEntries(groupVotes.map((v) => [v.groupId, v.count]).filter(([id]) => id)),
    };
};
exports.getVoteCounts = getVoteCounts;
