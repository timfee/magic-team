import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const posts = pgTable(
  "post",
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    name: varchar({ length: 256 }),
    createdById: varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  },
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = pgTable("user", {
  id: varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar({ length: 255 }),
  email: varchar({ length: 255 }).notNull(),
  emailVerified: timestamp({
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar({ length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = pgTable(
  "account",
  {
    userId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: varchar({ length: 255 }).notNull(),
    providerAccountId: varchar({ length: 255 }).notNull(),
    refresh_token: text(),
    access_token: text(),
    expires_at: integer(),
    token_type: varchar({ length: 255 }),
    scope: varchar({ length: 255 }),
    id_token: text(),
    session_state: varchar({ length: 255 }),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = pgTable(
  "session",
  {
    sessionToken: varchar({ length: 255 }).notNull().primaryKey(),
    userId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp({ mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: varchar({ length: 255 }).notNull(),
    token: varchar({ length: 255 }).notNull(),
    expires: timestamp({ mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ============================================================
// MagicSession Tables
// ============================================================

export const magicSessions = pgTable(
  "magic_session",
  {
    id: varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    ownerId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    visibility: varchar({ length: 50 }).notNull().default("public"), // 'public' | 'private' | 'protected'
    currentStage: varchar({ length: 100 }).notNull().default("pre_session"), // stage enum
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  },
  (t) => [
    index("magic_session_owner_idx").on(t.ownerId),
    index("magic_session_visibility_idx").on(t.visibility),
  ],
);

export const magicSessionsRelations = relations(magicSessions, ({ one, many }) => ({
  owner: one(users, { fields: [magicSessions.ownerId], references: [users.id] }),
  admins: many(sessionAdmins),
  categories: many(categories),
  ideas: many(ideas),
  groups: many(ideaGroups),
  settings: one(sessionSettings),
  presence: many(userPresence),
}));

export const sessionAdmins = pgTable(
  "session_admin",
  {
    sessionId: varchar({ length: 255 })
      .notNull()
      .references(() => magicSessions.id, { onDelete: "cascade" }),
    userId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    addedAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.userId] }),
    index("session_admin_user_idx").on(t.userId),
  ],
);

export const sessionAdminsRelations = relations(sessionAdmins, ({ one }) => ({
  session: one(magicSessions, {
    fields: [sessionAdmins.sessionId],
    references: [magicSessions.id],
  }),
  user: one(users, { fields: [sessionAdmins.userId], references: [users.id] }),
}));

export const categories = pgTable(
  "category",
  {
    id: varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: varchar({ length: 255 })
      .notNull()
      .references(() => magicSessions.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    color: varchar({ length: 50 }).notNull().default("#3b82f6"), // hex color
    order: integer().notNull().default(0),
    maxEntriesPerPerson: integer(), // null = unlimited
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    index("category_session_idx").on(t.sessionId),
    index("category_order_idx").on(t.sessionId, t.order),
  ],
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  session: one(magicSessions, {
    fields: [categories.sessionId],
    references: [magicSessions.id],
  }),
  ideas: many(ideas),
  groups: many(ideaGroups),
}));

export const ideas = pgTable(
  "idea",
  {
    id: varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: varchar({ length: 255 })
      .notNull()
      .references(() => magicSessions.id, { onDelete: "cascade" }),
    categoryId: varchar({ length: 255 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    content: text().notNull(),
    authorId: varchar({ length: 255 }).references(() => users.id), // null if anonymous
    isAnonymous: boolean().notNull().default(true),
    groupId: varchar({ length: 255 }).references(() => ideaGroups.id, { onDelete: "set null" }),
    order: integer().notNull().default(0),
    isSelected: boolean().notNull().default(false), // for finalization stage
    priority: integer(), // for finalization stage
    assignedToId: varchar({ length: 255 }).references(() => users.id), // for finalization stage
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  },
  (t) => [
    index("idea_session_idx").on(t.sessionId),
    index("idea_category_idx").on(t.categoryId),
    index("idea_author_idx").on(t.authorId),
    index("idea_group_idx").on(t.groupId),
    index("idea_order_idx").on(t.categoryId, t.order),
  ],
);

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  session: one(magicSessions, {
    fields: [ideas.sessionId],
    references: [magicSessions.id],
  }),
  category: one(categories, {
    fields: [ideas.categoryId],
    references: [categories.id],
  }),
  author: one(users, { fields: [ideas.authorId], references: [users.id] }),
  group: one(ideaGroups, { fields: [ideas.groupId], references: [ideaGroups.id] }),
  assignedTo: one(users, {
    fields: [ideas.assignedToId],
    references: [users.id],
    relationName: "assignedIdeas",
  }),
  comments: many(comments),
  votes: many(votes),
}));

export const ideaGroups = pgTable(
  "idea_group",
  {
    id: varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: varchar({ length: 255 })
      .notNull()
      .references(() => magicSessions.id, { onDelete: "cascade" }),
    categoryId: varchar({ length: 255 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    title: varchar({ length: 500 }),
    order: integer().notNull().default(0),
    maxCards: integer(), // null = unlimited
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  },
  (t) => [
    index("idea_group_session_idx").on(t.sessionId),
    index("idea_group_category_idx").on(t.categoryId),
  ],
);

export const ideaGroupsRelations = relations(ideaGroups, ({ one, many }) => ({
  session: one(magicSessions, {
    fields: [ideaGroups.sessionId],
    references: [magicSessions.id],
  }),
  category: one(categories, {
    fields: [ideaGroups.categoryId],
    references: [categories.id],
  }),
  ideas: many(ideas),
  comments: many(comments),
  votes: many(votes),
}));

export const comments = pgTable(
  "comment",
  {
    id: varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: varchar({ length: 255 })
      .notNull()
      .references(() => magicSessions.id, { onDelete: "cascade" }),
    ideaId: varchar({ length: 255 }).references(() => ideas.id, { onDelete: "cascade" }),
    groupId: varchar({ length: 255 }).references(() => ideaGroups.id, { onDelete: "cascade" }),
    userId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    content: text().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    index("comment_idea_idx").on(t.ideaId),
    index("comment_group_idx").on(t.groupId),
    index("comment_user_idx").on(t.userId),
  ],
);

export const commentsRelations = relations(comments, ({ one }) => ({
  session: one(magicSessions, {
    fields: [comments.sessionId],
    references: [magicSessions.id],
  }),
  idea: one(ideas, { fields: [comments.ideaId], references: [ideas.id] }),
  group: one(ideaGroups, { fields: [comments.groupId], references: [ideaGroups.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const votes = pgTable(
  "vote",
  {
    id: varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: varchar({ length: 255 })
      .notNull()
      .references(() => magicSessions.id, { onDelete: "cascade" }),
    categoryId: varchar({ length: 255 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    ideaId: varchar({ length: 255 }).references(() => ideas.id, { onDelete: "cascade" }),
    groupId: varchar({ length: 255 }).references(() => ideaGroups.id, { onDelete: "cascade" }),
    userId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    index("vote_session_idx").on(t.sessionId),
    index("vote_user_idx").on(t.userId),
    index("vote_idea_idx").on(t.ideaId),
    index("vote_group_idx").on(t.groupId),
  ],
);

export const votesRelations = relations(votes, ({ one }) => ({
  session: one(magicSessions, {
    fields: [votes.sessionId],
    references: [magicSessions.id],
  }),
  category: one(categories, {
    fields: [votes.categoryId],
    references: [categories.id],
  }),
  idea: one(ideas, { fields: [votes.ideaId], references: [ideas.id] }),
  group: one(ideaGroups, { fields: [votes.groupId], references: [ideaGroups.id] }),
  user: one(users, { fields: [votes.userId], references: [users.id] }),
}));

export const sessionSettings = pgTable("session_settings", {
  sessionId: varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .references(() => magicSessions.id, { onDelete: "cascade" }),
  // Stage enablement
  enablePreSession: boolean().notNull().default(true),
  enablePreSubmit: boolean().notNull().default(false),
  enableGreenRoom: boolean().notNull().default(true),
  // Voting rules
  votesPerUser: integer(), // null = unlimited
  maxVotesPerIdea: integer(), // null = unlimited
  maxVotesPerCategory: integer(), // null = unlimited
  allowVotingOnGroups: boolean().notNull().default(true),
  allowVotingOnIdeas: boolean().notNull().default(true),
  // Grouping rules
  allowGroupsInCategories: json().$type<string[]>(), // array of category IDs, null = all allowed
  disallowGroupsInCategories: json().$type<string[]>(), // array of category IDs, null = none disallowed
  // Timer settings
  ideaCollectionDuration: integer(), // in seconds, null = no timer
  votingDuration: integer(), // in seconds, null = no timer
  // Other settings
  customSettings: json().$type<Record<string, unknown>>(), // for future extensibility
  updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
});

export const sessionSettingsRelations = relations(sessionSettings, ({ one }) => ({
  session: one(magicSessions, {
    fields: [sessionSettings.sessionId],
    references: [magicSessions.id],
  }),
}));

export const userPresence = pgTable(
  "user_presence",
  {
    sessionId: varchar({ length: 255 })
      .notNull()
      .references(() => magicSessions.id, { onDelete: "cascade" }),
    userId: varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    lastSeenAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    isActive: boolean().notNull().default(true),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.userId] }),
    index("user_presence_session_idx").on(t.sessionId),
  ],
);

export const userPresenceRelations = relations(userPresence, ({ one }) => ({
  session: one(magicSessions, {
    fields: [userPresence.sessionId],
    references: [magicSessions.id],
  }),
  user: one(users, { fields: [userPresence.userId], references: [users.id] }),
}));
