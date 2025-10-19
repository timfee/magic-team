/**
 * Test Fixtures and Seeding Utilities for E2E and Integration Tests
 *
 * This module provides reusable test data factories and Firestore seeding
 * utilities to ensure tests have consistent, realistic data.
 */

import {
  collection,
  doc,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type {
  Session,
  Category,
  Idea,
  Vote,
  IdeaGroup,
  Comment,
  SessionStage,
  SessionVisibility,
} from "@/lib/types/session";

// ============================================================================
// FIXTURE DATA GENERATORS
// ============================================================================

/**
 * Generate a unique ID for test data
 */
export function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Test user fixtures
 */
export interface TestUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  owner: {
    uid: "test-owner-123",
    email: "owner@example.com",
    displayName: "Session Owner",
    photoURL: "https://i.pravatar.cc/150?img=1",
  },
  admin: {
    uid: "test-admin-456",
    email: "admin@example.com",
    displayName: "Session Admin",
    photoURL: "https://i.pravatar.cc/150?img=2",
  },
  participant1: {
    uid: "test-participant-789",
    email: "participant1@example.com",
    displayName: "Participant One",
    photoURL: "https://i.pravatar.cc/150?img=3",
  },
  participant2: {
    uid: "test-participant-abc",
    email: "participant2@example.com",
    displayName: "Participant Two",
    photoURL: "https://i.pravatar.cc/150?img=4",
  },
  anonymous: {
    uid: "test-anonymous-def",
    email: "anonymous@example.com",
    displayName: "Anonymous User",
  },
};

/**
 * Default category colors
 */
const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

/**
 * Session fixture factory
 */
export interface CreateSessionFixtureOptions {
  sessionId?: string;
  name?: string;
  description?: string;
  ownerId?: string;
  adminIds?: string[];
  visibility?: SessionVisibility;
  currentStage?: SessionStage;
  categoryCount?: number;
  categoryNames?: string[];
}

export function createSessionFixture(
  options: CreateSessionFixtureOptions = {},
): Session {
  const sessionId = options.sessionId ?? generateTestId("session");
  const categoryCount = options.categoryCount ?? 3;
  const categoryNames = options.categoryNames ?? [
    "What Went Well",
    "What Could Improve",
    "Action Items",
  ];

  const categories: Record<string, Category> = {};
  for (let i = 0; i < categoryCount; i++) {
    const catId = `${sessionId}-cat-${i}`;
    categories[catId] = {
      id: catId,
      name: categoryNames[i] ?? `Category ${i + 1}`,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]!,
      order: i,
    };
  }

  return {
    id: sessionId,
    name: options.name ?? `Test Session ${sessionId.slice(-4)}`,
    description: options.description ?? "Test session for E2E testing",
    ownerId: options.ownerId ?? TEST_USERS.owner.uid,
    adminIds: options.adminIds ?? [],
    participantIds: [],
    visibility: options.visibility ?? "public",
    currentStage: options.currentStage ?? "GREEN_ROOM",
    categories,
    settings: {
      allowAnonymousIdeas: true,
      maxIdeasPerPerson: 10,
      votesPerPerson: 5,
      votesPerCategory: {},
      maxCardsPerGroup: 10,
      ideaCollectionDuration: 600,
      votingDuration: 300,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Idea fixture factory
 */
export interface CreateIdeaFixtureOptions {
  ideaId?: string;
  sessionId: string;
  categoryId: string;
  content?: string;
  authorId?: string;
  isAnonymous?: boolean;
  order?: number;
  groupId?: string | null;
  isSelected?: boolean;
  voteCount?: number;
}

export function createIdeaFixture(
  options: CreateIdeaFixtureOptions,
): Omit<Idea, "id"> {
  const ideaId = options.ideaId ?? generateTestId("idea");

  return {
    sessionId: options.sessionId,
    categoryId: options.categoryId,
    content:
      options.content ??
      `Test idea ${ideaId.slice(-4)}: This is a sample idea for testing purposes.`,
    authorId: options.isAnonymous ? undefined : options.authorId,
    authorName: options.isAnonymous
      ? undefined
      : TEST_USERS.participant1.displayName,
    isAnonymous: options.isAnonymous ?? false,
    order: options.order ?? 0,
    groupId: options.groupId ?? null,
    isSelected: options.isSelected ?? false,
    voteCount: options.voteCount ?? 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Vote fixture factory
 */
export interface CreateVoteFixtureOptions {
  voteId?: string;
  sessionId: string;
  ideaId: string;
  userId: string;
  categoryId: string;
}

export function createVoteFixture(
  options: CreateVoteFixtureOptions,
): Omit<Vote, "id"> {
  return {
    sessionId: options.sessionId,
    ideaId: options.ideaId,
    userId: options.userId,
    categoryId: options.categoryId,
    createdAt: new Date(),
  };
}

/**
 * Group fixture factory
 */
export interface CreateGroupFixtureOptions {
  groupId?: string;
  sessionId: string;
  categoryId: string;
  name?: string;
  ideaIds?: string[];
  order?: number;
}

export function createGroupFixture(
  options: CreateGroupFixtureOptions,
): Omit<IdeaGroup, "id"> {
  const groupId = options.groupId ?? generateTestId("group");

  return {
    sessionId: options.sessionId,
    categoryId: options.categoryId,
    name: options.name ?? `Test Group ${groupId.slice(-4)}`,
    ideaIds: options.ideaIds ?? [],
    order: options.order ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Comment fixture factory
 */
export interface CreateCommentFixtureOptions {
  commentId?: string;
  sessionId: string;
  ideaId: string;
  authorId: string;
  content?: string;
  parentCommentId?: string | null;
  depth?: number;
}

export function createCommentFixture(
  options: CreateCommentFixtureOptions,
): Omit<Comment, "id"> {
  const commentId = options.commentId ?? generateTestId("comment");

  return {
    sessionId: options.sessionId,
    ideaId: options.ideaId,
    authorId: options.authorId,
    authorName: TEST_USERS.participant1.displayName,
    authorPhotoURL: TEST_USERS.participant1.photoURL,
    content:
      options.content ?? `Test comment ${commentId.slice(-4)}: This is a test comment.`,
    parentCommentId: options.parentCommentId ?? null,
    depth: options.depth ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// FIRESTORE SEEDING UTILITIES
// ============================================================================

/**
 * Seed a session with all related data
 */
export interface SeedSessionOptions {
  session?: Session;
  ideas?: Array<Omit<Idea, "id"> & { id?: string }>;
  votes?: Array<Omit<Vote, "id"> & { id?: string }>;
  groups?: Array<Omit<IdeaGroup, "id"> & { id?: string }>;
  comments?: Array<Omit<Comment, "id"> & { id?: string }>;
}

export async function seedSession(
  firestore: Firestore,
  options: SeedSessionOptions = {},
): Promise<{
  session: Session;
  ideas: Idea[];
  votes: Vote[];
  groups: IdeaGroup[];
  comments: Comment[];
}> {
  const session = options.session ?? createSessionFixture();
  const batch = writeBatch(firestore);

  // Write session
  const sessionRef = doc(firestore, "sessions", session.id);
  batch.set(sessionRef, session);

  // Write ideas
  const ideas: Idea[] = [];
  for (const ideaData of options.ideas ?? []) {
    const ideaId = ideaData.id ?? generateTestId("idea");
    const idea: Idea = { ...ideaData, id: ideaId };
    ideas.push(idea);

    const ideaRef = doc(
      firestore,
      "sessions",
      session.id,
      "ideas",
      idea.id,
    );
    batch.set(ideaRef, idea);
  }

  // Write votes
  const votes: Vote[] = [];
  for (const voteData of options.votes ?? []) {
    const voteId = voteData.id ?? generateTestId("vote");
    const vote: Vote = { ...voteData, id: voteId };
    votes.push(vote);

    const voteRef = doc(
      firestore,
      "sessions",
      session.id,
      "votes",
      vote.id,
    );
    batch.set(voteRef, vote);
  }

  // Write groups
  const groups: IdeaGroup[] = [];
  for (const groupData of options.groups ?? []) {
    const groupId = groupData.id ?? generateTestId("group");
    const group: IdeaGroup = { ...groupData, id: groupId };
    groups.push(group);

    const groupRef = doc(
      firestore,
      "sessions",
      session.id,
      "groups",
      group.id,
    );
    batch.set(groupRef, group);
  }

  // Write comments
  const comments: Comment[] = [];
  for (const commentData of options.comments ?? []) {
    const commentId = commentData.id ?? generateTestId("comment");
    const comment: Comment = { ...commentData, id: commentId };
    comments.push(comment);

    const commentRef = doc(
      firestore,
      "sessions",
      session.id,
      "ideas",
      comment.ideaId,
      "comments",
      comment.id,
    );
    batch.set(commentRef, comment);
  }

  await batch.commit();

  return { session, ideas, votes, groups, comments };
}

/**
 * Seed a complete test scenario: Session with ideas, votes, and groups
 */
export async function seedCompleteSession(
  firestore: Firestore,
  options: CreateSessionFixtureOptions & {
    ideaCount?: number;
    votesPerIdea?: number;
    groupCount?: number;
  } = {},
): Promise<{
  session: Session;
  ideas: Idea[];
  votes: Vote[];
  groups: IdeaGroup[];
}> {
  const session = createSessionFixture(options);
  const categoryIds = Object.keys(session.categories);
  const ideaCount = options.ideaCount ?? 12;
  const votesPerIdea = options.votesPerIdea ?? 2;
  const groupCount = options.groupCount ?? 2;

  // Create ideas distributed across categories
  const ideas: Array<Omit<Idea, "id"> & { id?: string }> = [];
  for (let i = 0; i < ideaCount; i++) {
    const categoryId = categoryIds[i % categoryIds.length]!;
    const ideaId = generateTestId("idea");

    ideas.push({
      id: ideaId,
      ...createIdeaFixture({
        sessionId: session.id,
        categoryId,
        authorId: TEST_USERS.participant1.uid,
        content: `Test idea #${i + 1}: ${["Improve standup meetings", "Add dark mode", "Fix bug in login", "Optimize database queries", "Update documentation"][i % 5]}`,
        order: i,
        isAnonymous: i % 3 === 0, // Every 3rd idea is anonymous
      }),
    });
  }

  // Create votes for ideas
  const votes: Array<Omit<Vote, "id"> & { id?: string }> = [];
  const voters = [
    TEST_USERS.participant1.uid,
    TEST_USERS.participant2.uid,
    TEST_USERS.admin.uid,
  ];

  for (const idea of ideas.slice(0, 6)) {
    // Vote on first 6 ideas
    for (let v = 0; v < Math.min(votesPerIdea, voters.length); v++) {
      votes.push({
        id: generateTestId("vote"),
        ...createVoteFixture({
          sessionId: session.id,
          ideaId: idea.id!,
          userId: voters[v]!,
          categoryId: idea.categoryId,
        }),
      });
    }
  }

  // Create groups with some ideas
  const groups: Array<Omit<IdeaGroup, "id"> & { id?: string }> = [];
  for (let g = 0; g < groupCount; g++) {
    const categoryId = categoryIds[g % categoryIds.length]!;
    const groupId = generateTestId("group");

    // Assign 2-3 ideas to this group
    const groupIdeaIds = ideas
      .filter((idea) => idea.categoryId === categoryId)
      .slice(g * 2, g * 2 + 3)
      .map((idea) => idea.id!);

    // Update ideas to have groupId
    for (const ideaId of groupIdeaIds) {
      const idea = ideas.find((i) => i.id === ideaId);
      if (idea) {
        idea.groupId = groupId;
      }
    }

    groups.push({
      id: groupId,
      ...createGroupFixture({
        sessionId: session.id,
        categoryId,
        name: `Group ${g + 1}`,
        ideaIds: groupIdeaIds,
        order: g,
      }),
    });
  }

  const result = await seedSession(firestore, {
    session,
    ideas,
    votes,
    groups,
  });

  return result;
}

/**
 * Seed presence for a session
 */
export async function seedPresence(
  firestore: Firestore,
  sessionId: string,
  users: TestUser[],
): Promise<void> {
  const batch = writeBatch(firestore);

  for (const user of users) {
    const presenceRef = doc(
      firestore,
      "sessions",
      sessionId,
      "presence",
      user.uid,
    );

    batch.set(presenceRef, {
      userId: user.uid,
      userName: user.displayName,
      userPhotoURL: user.photoURL,
      isActive: true,
      lastSeenAt: new Date(),
    });
  }

  await batch.commit();
}

/**
 * Quick session presets for common test scenarios
 */
export const SESSION_PRESETS = {
  /**
   * Empty session in GREEN_ROOM stage
   */
  async greenRoom(firestore: Firestore) {
    return await seedCompleteSession(firestore, {
      currentStage: "GREEN_ROOM",
      ideaCount: 0,
    });
  },

  /**
   * Session in IDEA_COLLECTION with some ideas
   */
  async ideaCollection(firestore: Firestore) {
    return await seedCompleteSession(firestore, {
      currentStage: "IDEA_COLLECTION",
      ideaCount: 8,
      votesPerIdea: 0,
      groupCount: 0,
    });
  },

  /**
   * Session in VOTING with ideas and some votes
   */
  async voting(firestore: Firestore) {
    return await seedCompleteSession(firestore, {
      currentStage: "VOTING",
      ideaCount: 10,
      votesPerIdea: 3,
      groupCount: 0,
    });
  },

  /**
   * Session in GROUPING with ideas, votes, and groups
   */
  async grouping(firestore: Firestore) {
    return await seedCompleteSession(firestore, {
      currentStage: "GROUPING",
      ideaCount: 12,
      votesPerIdea: 2,
      groupCount: 3,
    });
  },

  /**
   * Session in FINALIZATION ready for export
   */
  async finalization(firestore: Firestore) {
    const result = await seedCompleteSession(firestore, {
      currentStage: "FINALIZATION",
      ideaCount: 15,
      votesPerIdea: 4,
      groupCount: 4,
    });

    // Mark top ideas as selected
    const topIdeas = result.ideas.slice(0, 5);
    for (let i = 0; i < topIdeas.length; i++) {
      const idea = topIdeas[i]!;
      await setDoc(
        doc(firestore, "sessions", result.session.id, "ideas", idea.id),
        { ...idea, isSelected: true, priority: i },
        { merge: true },
      );
    }

    return result;
  },
};
