"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPresenceRelations = exports.userPresence = exports.sessionSettingsRelations = exports.sessionSettings = exports.votesRelations = exports.votes = exports.commentsRelations = exports.comments = exports.ideaGroupsRelations = exports.ideaGroups = exports.ideasRelations = exports.ideas = exports.categoriesRelations = exports.categories = exports.sessionAdminsRelations = exports.sessionAdmins = exports.magicSessionsRelations = exports.magicSessions = exports.verificationTokens = exports.sessionsRelations = exports.sessions = exports.accountsRelations = exports.accounts = exports.usersRelations = exports.users = exports.posts = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.posts = (0, pg_core_1.pgTable)("post", {
    id: (0, pg_core_1.integer)().primaryKey().generatedByDefaultAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 256 }),
    createdById: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)({ withTimezone: true })
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)({ withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.index)("created_by_idx").on(t.createdById),
    (0, pg_core_1.index)("name_idx").on(t.name),
]);
exports.users = (0, pg_core_1.pgTable)("user", {
    id: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: (0, pg_core_1.varchar)({ length: 255 }),
    email: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    emailVerified: (0, pg_core_1.timestamp)({
        mode: "date",
        withTimezone: true,
    }).default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    image: (0, pg_core_1.varchar)({ length: 255 }),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    accounts: many(exports.accounts),
}));
exports.accounts = (0, pg_core_1.pgTable)("account", {
    userId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.users.id),
    type: (0, pg_core_1.varchar)({ length: 255 }).$type().notNull(),
    provider: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    providerAccountId: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    refresh_token: (0, pg_core_1.text)(),
    access_token: (0, pg_core_1.text)(),
    expires_at: (0, pg_core_1.integer)(),
    token_type: (0, pg_core_1.varchar)({ length: 255 }),
    scope: (0, pg_core_1.varchar)({ length: 255 }),
    id_token: (0, pg_core_1.text)(),
    session_state: (0, pg_core_1.varchar)({ length: 255 }),
}, (t) => [
    (0, pg_core_1.primaryKey)({ columns: [t.provider, t.providerAccountId] }),
    (0, pg_core_1.index)("account_user_id_idx").on(t.userId),
]);
exports.accountsRelations = (0, drizzle_orm_1.relations)(exports.accounts, ({ one }) => ({
    user: one(exports.users, { fields: [exports.accounts.userId], references: [exports.users.id] }),
}));
exports.sessions = (0, pg_core_1.pgTable)("session", {
    sessionToken: (0, pg_core_1.varchar)({ length: 255 }).notNull().primaryKey(),
    userId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.users.id),
    expires: (0, pg_core_1.timestamp)({ mode: "date", withTimezone: true }).notNull(),
}, (t) => [(0, pg_core_1.index)("t_user_id_idx").on(t.userId)]);
exports.sessionsRelations = (0, drizzle_orm_1.relations)(exports.sessions, ({ one }) => ({
    user: one(exports.users, { fields: [exports.sessions.userId], references: [exports.users.id] }),
}));
exports.verificationTokens = (0, pg_core_1.pgTable)("verification_token", {
    identifier: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    token: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    expires: (0, pg_core_1.timestamp)({ mode: "date", withTimezone: true }).notNull(),
}, (t) => [(0, pg_core_1.primaryKey)({ columns: [t.identifier, t.token] })]);
// ============================================================
// MagicSession Tables
// ============================================================
exports.magicSessions = (0, pg_core_1.pgTable)("magic_session", {
    id: (0, pg_core_1.varchar)({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    description: (0, pg_core_1.text)(),
    ownerId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.users.id),
    visibility: (0, pg_core_1.varchar)({ length: 50 }).notNull().default("public"), // 'public' | 'private' | 'protected'
    currentStage: (0, pg_core_1.varchar)({ length: 100 }).notNull().default("pre_session"), // stage enum
    createdAt: (0, pg_core_1.timestamp)({ withTimezone: true })
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)({ withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.index)("magic_session_owner_idx").on(t.ownerId),
    (0, pg_core_1.index)("magic_session_visibility_idx").on(t.visibility),
]);
exports.magicSessionsRelations = (0, drizzle_orm_1.relations)(exports.magicSessions, ({ one, many }) => ({
    owner: one(exports.users, { fields: [exports.magicSessions.ownerId], references: [exports.users.id] }),
    admins: many(exports.sessionAdmins),
    categories: many(exports.categories),
    ideas: many(exports.ideas),
    groups: many(exports.ideaGroups),
    settings: one(exports.sessionSettings),
    presence: many(exports.userPresence),
}));
exports.sessionAdmins = (0, pg_core_1.pgTable)("session_admin", {
    sessionId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.magicSessions.id, { onDelete: "cascade" }),
    userId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.users.id),
    addedAt: (0, pg_core_1.timestamp)({ withTimezone: true })
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .notNull(),
}, (t) => [
    (0, pg_core_1.primaryKey)({ columns: [t.sessionId, t.userId] }),
    (0, pg_core_1.index)("session_admin_user_idx").on(t.userId),
]);
exports.sessionAdminsRelations = (0, drizzle_orm_1.relations)(exports.sessionAdmins, ({ one }) => ({
    session: one(exports.magicSessions, {
        fields: [exports.sessionAdmins.sessionId],
        references: [exports.magicSessions.id],
    }),
    user: one(exports.users, { fields: [exports.sessionAdmins.userId], references: [exports.users.id] }),
}));
exports.categories = (0, pg_core_1.pgTable)("category", {
    id: (0, pg_core_1.varchar)({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.magicSessions.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    color: (0, pg_core_1.varchar)({ length: 50 }).notNull().default("#3b82f6"), // hex color
    order: (0, pg_core_1.integer)().notNull().default(0),
    maxEntriesPerPerson: (0, pg_core_1.integer)(), // null = unlimited
    createdAt: (0, pg_core_1.timestamp)({ withTimezone: true })
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .notNull(),
}, (t) => [
    (0, pg_core_1.index)("category_session_idx").on(t.sessionId),
    (0, pg_core_1.index)("category_order_idx").on(t.sessionId, t.order),
]);
exports.categoriesRelations = (0, drizzle_orm_1.relations)(exports.categories, ({ one, many }) => ({
    session: one(exports.magicSessions, {
        fields: [exports.categories.sessionId],
        references: [exports.magicSessions.id],
    }),
    ideas: many(exports.ideas),
    groups: many(exports.ideaGroups),
}));
exports.ideas = (0, pg_core_1.pgTable)("idea", {
    id: (0, pg_core_1.varchar)({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.magicSessions.id, { onDelete: "cascade" }),
    categoryId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.categories.id, { onDelete: "cascade" }),
    content: (0, pg_core_1.text)().notNull(),
    authorId: (0, pg_core_1.varchar)({ length: 255 }).references(() => exports.users.id), // null if anonymous
    isAnonymous: (0, pg_core_1.boolean)().notNull().default(true),
    groupId: (0, pg_core_1.varchar)({ length: 255 }).references(() => exports.ideaGroups.id, { onDelete: "set null" }),
    order: (0, pg_core_1.integer)().notNull().default(0),
    isSelected: (0, pg_core_1.boolean)().notNull().default(false), // for finalization stage
    priority: (0, pg_core_1.integer)(), // for finalization stage
    assignedToId: (0, pg_core_1.varchar)({ length: 255 }).references(() => exports.users.id), // for finalization stage
    createdAt: (0, pg_core_1.timestamp)({ withTimezone: true })
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)({ withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.index)("idea_session_idx").on(t.sessionId),
    (0, pg_core_1.index)("idea_category_idx").on(t.categoryId),
    (0, pg_core_1.index)("idea_author_idx").on(t.authorId),
    (0, pg_core_1.index)("idea_group_idx").on(t.groupId),
    (0, pg_core_1.index)("idea_order_idx").on(t.categoryId, t.order),
]);
exports.ideasRelations = (0, drizzle_orm_1.relations)(exports.ideas, ({ one, many }) => ({
    session: one(exports.magicSessions, {
        fields: [exports.ideas.sessionId],
        references: [exports.magicSessions.id],
    }),
    category: one(exports.categories, {
        fields: [exports.ideas.categoryId],
        references: [exports.categories.id],
    }),
    author: one(exports.users, { fields: [exports.ideas.authorId], references: [exports.users.id] }),
    group: one(exports.ideaGroups, { fields: [exports.ideas.groupId], references: [exports.ideaGroups.id] }),
    assignedTo: one(exports.users, {
        fields: [exports.ideas.assignedToId],
        references: [exports.users.id],
        relationName: "assignedIdeas",
    }),
    comments: many(exports.comments),
    votes: many(exports.votes),
}));
exports.ideaGroups = (0, pg_core_1.pgTable)("idea_group", {
    id: (0, pg_core_1.varchar)({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.magicSessions.id, { onDelete: "cascade" }),
    categoryId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.categories.id, { onDelete: "cascade" }),
    title: (0, pg_core_1.varchar)({ length: 500 }),
    order: (0, pg_core_1.integer)().notNull().default(0),
    maxCards: (0, pg_core_1.integer)(), // null = unlimited
    createdAt: (0, pg_core_1.timestamp)({ withTimezone: true })
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)({ withTimezone: true }).$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.index)("idea_group_session_idx").on(t.sessionId),
    (0, pg_core_1.index)("idea_group_category_idx").on(t.categoryId),
]);
exports.ideaGroupsRelations = (0, drizzle_orm_1.relations)(exports.ideaGroups, ({ one, many }) => ({
    session: one(exports.magicSessions, {
        fields: [exports.ideaGroups.sessionId],
        references: [exports.magicSessions.id],
    }),
    category: one(exports.categories, {
        fields: [exports.ideaGroups.categoryId],
        references: [exports.categories.id],
    }),
    ideas: many(exports.ideas),
    comments: many(exports.comments),
    votes: many(exports.votes),
}));
exports.comments = (0, pg_core_1.pgTable)("comment", {
    id: (0, pg_core_1.varchar)({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.magicSessions.id, { onDelete: "cascade" }),
    ideaId: (0, pg_core_1.varchar)({ length: 255 }).references(() => exports.ideas.id, { onDelete: "cascade" }),
    groupId: (0, pg_core_1.varchar)({ length: 255 }).references(() => exports.ideaGroups.id, { onDelete: "cascade" }),
    userId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.users.id),
    content: (0, pg_core_1.text)().notNull(),
    createdAt: (0, pg_core_1.timestamp)({ withTimezone: true })
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .notNull(),
}, (t) => [
    (0, pg_core_1.index)("comment_idea_idx").on(t.ideaId),
    (0, pg_core_1.index)("comment_group_idx").on(t.groupId),
    (0, pg_core_1.index)("comment_user_idx").on(t.userId),
]);
exports.commentsRelations = (0, drizzle_orm_1.relations)(exports.comments, ({ one }) => ({
    session: one(exports.magicSessions, {
        fields: [exports.comments.sessionId],
        references: [exports.magicSessions.id],
    }),
    idea: one(exports.ideas, { fields: [exports.comments.ideaId], references: [exports.ideas.id] }),
    group: one(exports.ideaGroups, { fields: [exports.comments.groupId], references: [exports.ideaGroups.id] }),
    user: one(exports.users, { fields: [exports.comments.userId], references: [exports.users.id] }),
}));
exports.votes = (0, pg_core_1.pgTable)("vote", {
    id: (0, pg_core_1.varchar)({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.magicSessions.id, { onDelete: "cascade" }),
    categoryId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.categories.id, { onDelete: "cascade" }),
    ideaId: (0, pg_core_1.varchar)({ length: 255 }).references(() => exports.ideas.id, { onDelete: "cascade" }),
    groupId: (0, pg_core_1.varchar)({ length: 255 }).references(() => exports.ideaGroups.id, { onDelete: "cascade" }),
    userId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)({ withTimezone: true })
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .notNull(),
}, (t) => [
    (0, pg_core_1.index)("vote_session_idx").on(t.sessionId),
    (0, pg_core_1.index)("vote_user_idx").on(t.userId),
    (0, pg_core_1.index)("vote_idea_idx").on(t.ideaId),
    (0, pg_core_1.index)("vote_group_idx").on(t.groupId),
]);
exports.votesRelations = (0, drizzle_orm_1.relations)(exports.votes, ({ one }) => ({
    session: one(exports.magicSessions, {
        fields: [exports.votes.sessionId],
        references: [exports.magicSessions.id],
    }),
    category: one(exports.categories, {
        fields: [exports.votes.categoryId],
        references: [exports.categories.id],
    }),
    idea: one(exports.ideas, { fields: [exports.votes.ideaId], references: [exports.ideas.id] }),
    group: one(exports.ideaGroups, { fields: [exports.votes.groupId], references: [exports.ideaGroups.id] }),
    user: one(exports.users, { fields: [exports.votes.userId], references: [exports.users.id] }),
}));
exports.sessionSettings = (0, pg_core_1.pgTable)("session_settings", {
    sessionId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .primaryKey()
        .references(() => exports.magicSessions.id, { onDelete: "cascade" }),
    // Stage enablement
    enablePreSession: (0, pg_core_1.boolean)().notNull().default(true),
    enablePreSubmit: (0, pg_core_1.boolean)().notNull().default(false),
    enableGreenRoom: (0, pg_core_1.boolean)().notNull().default(true),
    // Voting rules
    votesPerUser: (0, pg_core_1.integer)(), // null = unlimited
    maxVotesPerIdea: (0, pg_core_1.integer)(), // null = unlimited
    maxVotesPerCategory: (0, pg_core_1.integer)(), // null = unlimited
    allowVotingOnGroups: (0, pg_core_1.boolean)().notNull().default(true),
    allowVotingOnIdeas: (0, pg_core_1.boolean)().notNull().default(true),
    // Grouping rules
    allowGroupsInCategories: (0, pg_core_1.json)().$type(), // array of category IDs, null = all allowed
    disallowGroupsInCategories: (0, pg_core_1.json)().$type(), // array of category IDs, null = none disallowed
    // Timer settings
    ideaCollectionDuration: (0, pg_core_1.integer)(), // in seconds, null = no timer
    votingDuration: (0, pg_core_1.integer)(), // in seconds, null = no timer
    // Other settings
    customSettings: (0, pg_core_1.json)().$type(), // for future extensibility
    updatedAt: (0, pg_core_1.timestamp)({ withTimezone: true }).$onUpdate(() => new Date()),
});
exports.sessionSettingsRelations = (0, drizzle_orm_1.relations)(exports.sessionSettings, ({ one }) => ({
    session: one(exports.magicSessions, {
        fields: [exports.sessionSettings.sessionId],
        references: [exports.magicSessions.id],
    }),
}));
exports.userPresence = (0, pg_core_1.pgTable)("user_presence", {
    sessionId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.magicSessions.id, { onDelete: "cascade" }),
    userId: (0, pg_core_1.varchar)({ length: 255 })
        .notNull()
        .references(() => exports.users.id),
    lastSeenAt: (0, pg_core_1.timestamp)({ withTimezone: true })
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .notNull(),
    isActive: (0, pg_core_1.boolean)().notNull().default(true),
}, (t) => [
    (0, pg_core_1.primaryKey)({ columns: [t.sessionId, t.userId] }),
    (0, pg_core_1.index)("user_presence_session_idx").on(t.sessionId),
]);
exports.userPresenceRelations = (0, drizzle_orm_1.relations)(exports.userPresence, ({ one }) => ({
    session: one(exports.magicSessions, {
        fields: [exports.userPresence.sessionId],
        references: [exports.magicSessions.id],
    }),
    user: one(exports.users, { fields: [exports.userPresence.userId], references: [exports.users.id] }),
}));
