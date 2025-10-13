"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.getComments = exports.createComment = void 0;
const cache_1 = require("next/cache");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const schema_1 = require("@/lib/db/schema");
const createComment = async (input) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const commentId = crypto.randomUUID();
    await db_1.db.insert(schema_1.comments).values({
        id: commentId,
        sessionId: input.sessionId,
        ideaId: input.ideaId,
        groupId: input.groupId,
        userId: session.user.id,
        content: input.content,
    });
    (0, cache_1.revalidatePath)(`/session/${input.sessionId}`);
    return { commentId };
};
exports.createComment = createComment;
const getComments = async (sessionId, targetId, targetType) => {
    const result = await db_1.db.query.comments.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.comments.sessionId, sessionId), targetType === "idea"
            ? (0, drizzle_orm_1.eq)(schema_1.comments.ideaId, targetId)
            : (0, drizzle_orm_1.eq)(schema_1.comments.groupId, targetId)),
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
    });
    return result;
};
exports.getComments = getComments;
const deleteComment = async (commentId) => {
    var _a;
    const session = await (0, auth_1.auth)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error("Unauthorized");
    }
    const comment = await db_1.db.query.comments.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.comments.id, commentId),
    });
    if (!comment) {
        throw new Error("Comment not found");
    }
    if (comment.userId !== session.user.id) {
        // TODO: Check if user is admin
        throw new Error("Unauthorized");
    }
    await db_1.db.delete(schema_1.comments).where((0, drizzle_orm_1.eq)(schema_1.comments.id, commentId));
    (0, cache_1.revalidatePath)(`/session/${comment.sessionId}`);
    return { success: true };
};
exports.deleteComment = deleteComment;
