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
  createdAt: Date;
  updatedAt: Date;
  categories: Category[];
  settings?: SessionSettings;
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
  authorId: string;
  ideaId?: string;
  groupId?: string;
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
  sessionId: string;
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
  updatedAt: Date;
};

export type UserPresence = {
  id: string;
  sessionId: string;
  userId: string;
  userName?: string;
  userImage?: string;
  isActive: boolean;
  lastSeenAt: Date;
  joinedAt: Date;
};

// ============================================================
// Extended Types with Relations
// ============================================================

export type MagicSessionWithDetails = MagicSession & {
  categories: Category[];
  settings: SessionSettings | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  admins?: SessionAdmin[];
  _count?: {
    ideas: number;
    presence: number;
  };
};

export type CategoryWithIdeas = Category & {
  ideas: Idea[];
  groups: IdeaGroup[];
};

export type IdeaWithDetails = Idea & {
  author?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  group?: IdeaGroup | null;
  comments: (Comment & {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  })[];
  votes: Vote[];
  _count: {
    votes: number;
    comments: number;
  };
};

export type IdeaGroupWithDetails = IdeaGroup & {
  ideas: Idea[];
  comments: (Comment & {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  })[];
  votes: Vote[];
  _count: {
    ideas: number;
    votes: number;
    comments: number;
  };
};

// ============================================================
// Input/Creation Types
// ============================================================

export type CreateMagicSessionInput = {
  name: string;
  description?: string;
  visibility?: SessionVisibility;
  categories: {
    name: string;
    color?: string;
    maxEntriesPerPerson?: number;
  }[];
  settings?: Partial<Omit<SessionSettings, "sessionId" | "updatedAt">>;
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
} & (
  | { ideaId: string; groupId?: never }
  | { groupId: string; ideaId?: never }
);

export type CastVoteInput = {
  sessionId: string;
  categoryId: string;
} & (
  | { ideaId: string; groupId?: never }
  | { groupId: string; ideaId?: never }
);

export type UpdateSessionSettingsInput = Partial<
  Omit<SessionSettings, "sessionId" | "updatedAt">
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

export type IdeaCreatedEvent = {
  sessionId: string;
  idea: IdeaWithDetails;
};

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

export type GroupDeletedEvent = {
  sessionId: string;
  groupId: string;
};

export type CommentCreatedEvent = {
  sessionId: string;
  comment: Comment & {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
};

export type VoteCastEvent = {
  sessionId: string;
  vote: Vote;
};

export type VoteRemovedEvent = {
  sessionId: string;
  voteId: string;
};

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
