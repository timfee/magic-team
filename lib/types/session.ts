// ============================================================
// Stage Types
// ============================================================

export type SessionStage =
  | "pre_session"
  | "green_room"
  | "idea_collection"
  | "idea_grouping"
  | "idea_voting"
  | "idea_finalization"
  | "post_session";

export type SessionVisibility = "public" | "private" | "protected";

// ============================================================
// Firebase Model Types
// ============================================================

export type MagicSession = {
  id: string;
  name: string;
  description?: string;
  visibility: SessionVisibility;
  currentStage: SessionStage;
  ownerId: string;
  isArchived?: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Note: categories and settings are in subcollections, not in this document
};

export type SessionAdmin = {
  id: string;
  sessionId: string;
  userId: string;
  role: "admin";
  addedAt: Date;
  addedById: string;
};

export type Category = {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  order: number;
  maxEntriesPerPerson?: number;
};

export type Idea = {
  id: string;
  sessionId: string;
  categoryId: string;
  content: string;
  authorId?: string;
  isAnonymous: boolean;
  groupId?: string;
  order: number;
  isSelected: boolean;
  priority?: number;
  assignedToId?: string;
  // Conflict resolution fields
  lockedById?: string; // User ID who currently has the idea locked
  lockedAt?: Date; // When the lock was acquired
  createdAt: Date;
  updatedAt: Date;
};

export type IdeaGroup = {
  id: string;
  sessionId: string;
  categoryId: string;
  title?: string;
  order: number;
  maxCards?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Comment = {
  id: string;
  sessionId: string;
  content: string;
  userId: string; // Changed from authorId to match Firestore security rules
  ideaId?: string;
  groupId?: string;
  replyToId?: string; // For threaded comments
  createdAt: Date;
  updatedAt: Date;
};

export type Vote = {
  id: string;
  sessionId: string;
  userId: string;
  categoryId: string;
  ideaId?: string;
  groupId?: string;
  createdAt: Date;
};

export type SessionSettings = {
  // sessionId is omitted - it's implicit from the document path: /sessions/{sessionId}/settings/config
  allowAnonymousIdeas: boolean;
  allowComments: boolean;
  allowVoting: boolean;
  votesPerUser?: number;
  maxVotesPerIdea?: number;
  maxVotesPerCategory?: number;
  allowVotingOnGroups: boolean;
  allowVotingOnIdeas: boolean;
  autoGroupSimilarIdeas: boolean;
  maxIdeasPerPerson?: number;
  enableTimer: boolean;
  timerDuration?: number;
  greenRoomStartTime?: Date | null; // When the session is scheduled to start
  ideaCollectionTimerEnd?: Date | null; // When idea collection timer ends
  ideaCollectionEnabled?: boolean; // Whether idea submission is enabled
  updatedAt: Date;
};

export type UserPresence = {
  // Document ID is the userId itself: /sessions/{sessionId}/presence/{userId}
  userId: string;
  userName?: string;
  userImage?: string;
  isActive: boolean;
  lastSeenAt: Date;
  joinedAt?: Date; // Optional since we might not always store it
};

// ============================================================
// Extended Types with Relations
// ============================================================

export type MagicSessionWithDetails = MagicSession & {
  categories: Category[]; // Loaded separately from subcollection
  settings: SessionSettings | null; // Loaded separately from subcollection
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  admins?: SessionAdmin[];
  _count?: { ideas: number; presence: number };
};

export type CategoryWithIdeas = Category & {
  ideas: Idea[];
  groups: IdeaGroup[];
};

export type IdeaWithDetails = Idea & {
  author?: { id: string; name: string | null; image: string | null } | null;
  group?: IdeaGroup | null;
  comments: (Comment & {
    user: { id: string; name: string | null; image: string | null };
  })[];
  votes: Vote[];
  _count: { votes: number; comments: number };
};

export type IdeaGroupWithDetails = IdeaGroup & {
  ideas: Idea[];
  comments: (Comment & {
    user: { id: string; name: string | null; image: string | null };
  })[];
  votes: Vote[];
  _count: { ideas: number; votes: number; comments: number };
};

// ============================================================
// Input/Creation Types
// ============================================================

export type CreateMagicSessionInput = {
  name: string;
  description?: string;
  visibility?: SessionVisibility;
  categories: { name: string; color?: string; maxEntriesPerPerson?: number }[];
  settings?: Partial<Omit<SessionSettings, "updatedAt">>;
};

export type UpdateMagicSessionInput = Partial<{
  name: string;
  description: string;
  visibility: SessionVisibility;
  currentStage: SessionStage;
}>;

export type CreateCategoryInput = {
  sessionId: string;
  name: string;
  color?: string;
  order?: number;
  maxEntriesPerPerson?: number;
};

export type CreateIdeaInput = {
  sessionId: string;
  categoryId: string;
  content: string;
  isAnonymous?: boolean;
};

export type UpdateIdeaInput = Partial<{
  content: string;
  categoryId: string;
  groupId: string | null;
  order: number;
  isSelected: boolean;
  priority: number;
  assignedToId: string | null;
  lockedById: string | null;
  lockedAt: Date | null;
}>;

export type CreateIdeaGroupInput = {
  sessionId: string;
  categoryId: string;
  title?: string;
  order?: number;
  maxCards?: number;
};

export type CreateCommentInput = {
  sessionId: string;
  content: string;
  replyToId?: string; // Optional: comment ID being replied to
} & ({ ideaId: string; groupId?: never } | { groupId: string; ideaId?: never });

export type CommentWithDetails = Comment & {
  user: { id: string; name: string | null; image: string | null };
  replies?: CommentWithDetails[]; // Nested replies
  replyTo?: {
    id: string;
    content: string;
    user: { id: string; name: string | null };
  } | null;
};

export type CastVoteInput = { sessionId: string; categoryId: string } & (
  | { ideaId: string; groupId?: never }
  | { groupId: string; ideaId?: never }
);

export type UpdateSessionSettingsInput = Partial<
  Omit<SessionSettings, "updatedAt">
>;

// ============================================================
// Permission Types
// ============================================================

export type SessionRole = "owner" | "admin" | "participant";

export type SessionPermissions = {
  canEditSettings: boolean;
  canChangeStage: boolean;
  canAddAdmins: boolean;
  canDeleteSession: boolean;
  canModerateContent: boolean;
  canViewPresentation: boolean;
};

// ============================================================
// Real-time Event Types
// ============================================================

export type SocketEventType =
  | "session:join"
  | "session:leave"
  | "session:stage_changed"
  | "idea:created"
  | "idea:updated"
  | "idea:deleted"
  | "idea:moved"
  | "group:created"
  | "group:updated"
  | "group:deleted"
  | "comment:created"
  | "vote:cast"
  | "vote:removed"
  | "presence:update"
  | "settings:updated"
  | "category:updated";

export type SessionJoinEvent = {
  sessionId: string;
  userId: string;
  userName: string | null;
};

export type StageChangedEvent = {
  sessionId: string;
  newStage: SessionStage;
  changedBy: string;
};

export type IdeaCreatedEvent = { sessionId: string; idea: IdeaWithDetails };

export type IdeaUpdatedEvent = {
  sessionId: string;
  ideaId: string;
  updates: Partial<Idea>;
};

export type IdeaMovedEvent = {
  sessionId: string;
  ideaId: string;
  categoryId: string;
  groupId: string | null;
  order: number;
};

export type GroupCreatedEvent = {
  sessionId: string;
  group: IdeaGroupWithDetails;
};

export type GroupUpdatedEvent = {
  sessionId: string;
  groupId: string;
  updates: Partial<IdeaGroup>;
};

export type GroupDeletedEvent = { sessionId: string; groupId: string };

export type CommentCreatedEvent = {
  sessionId: string;
  comment: Comment & {
    user: { id: string; name: string | null; image: string | null };
  };
};

export type VoteCastEvent = { sessionId: string; vote: Vote };

export type VoteRemovedEvent = { sessionId: string; voteId: string };

export type PresenceUpdateEvent = {
  sessionId: string;
  activeUsers: {
    id: string;
    name: string | null;
    image: string | null;
    lastSeenAt: Date;
  }[];
  count: number;
};

// ============================================================
// View Mode Types
// ============================================================

export type ViewMode = "participant" | "admin" | "presentation";

// ============================================================
// Timer Types
// ============================================================

export type TimerState = {
  isRunning: boolean;
  startedAt: Date | null;
  duration: number; // in seconds
  remainingSeconds: number;
};

// ============================================================
// Voting Rules Types
// ============================================================

export type VotingRules = {
  votesPerUser: number | null;
  maxVotesPerIdea: number | null;
  maxVotesPerCategory: number | null;
  allowVotingOnGroups: boolean;
  allowVotingOnIdeas: boolean;
};

export type UserVoteAllocation = {
  userId: string;
  totalVotesUsed: number;
  votesByCategory: Record<string, number>;
  votesByIdea: Record<string, number>;
  votesByGroup: Record<string, number>;
};
