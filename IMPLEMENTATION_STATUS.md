# Implementation Status: Pre-submit, Multiplayer Cursors, Conflict Resolution & Comments

## ✅ COMPLETED: Comments System

### 1. Type Updates (`lib/types/session.ts`)
- ✅ Added `replyToId?: string` to `Comment` type (line 84)
- ✅ Updated `CreateCommentInput` to support `replyToId` (line 251)
- ✅ Created `CommentWithDetails` type with nested structure (lines 257-272)

### 2. Enhanced Actions (`lib/actions/comments.ts`)
- ✅ Updated `createComment` to handle threaded replies
- ✅ Added `getUserDetails` helper function (fetches from presence → users)
- ✅ Created `getCommentsWithDetails` function:
  - Fetches comments with full user info
  - Builds threaded tree structure
  - Sorts root (newest first) and replies (oldest first)

### 3. Comment Thread UI (`components/session/comment-thread.tsx`)
- ✅ Full threaded comment component with:
  - Post/reply/edit/delete functionality
  - User avatars and timestamps
  - Max 3-level nesting
  - "Replying to X" indicators
  - Admin/author permissions
  - Real-time updates via prop refresh

## 🔄 IN PROGRESS: Integration

### Next Steps:
1. **Add comments to idea cards** - Create modal/popover trigger
2. **Add comments to groups** - Similar integration
3. **Write unit tests** - Test comment threading logic
4. **Write E2E tests** - Test full comment flow

## 📋 TODO: Remaining Features

### Feature 2: Pre-submit Functionality
- [ ] Update `Idea` type with status fields
- [ ] Update `SessionSettings` with `requirePreSubmitApproval`
- [ ] Create `/lib/actions/pre-submit.ts`
- [ ] Update Firestore rules
- [ ] Update idea collection UI
- [ ] Create admin approval queue
- [ ] Write tests

### Feature 3: Multiplayer Cursors
- [ ] Update `UserPresence` type with cursor fields
- [ ] Create cursor tracking context
- [ ] Create cursor overlay component
- [ ] Integrate into grouping stage
- [ ] Write tests

### Feature 4: Conflict Resolution
- [ ] Add lock fields to `Idea` type
- [ ] Create `/lib/actions/idea-locks.ts`
- [ ] Update Firestore rules for locks
- [ ] Add lock handling to drag operations
- [ ] Write tests

## Implementation Guide

### To Add Comments to Idea Card:

```typescript
// In idea-card.tsx
import { CommentThread } from "@/components/session/comment-thread";
import { getCommentsWithDetails } from "@/lib/actions/comments";
import { useState, useEffect } from "react";

// Add comment count badge
<div className="flex items-center gap-1 text-xs">
  <svg className="h-4 w-4" /* comment icon */>
  <span>{commentCount}</span>
</div>

// Add modal/popover on click
<Dialog>
  <DialogContent>
    <CommentThread
      sessionId={idea.sessionId}
      ideaId={idea.id}
      comments={comments}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      onCommentAdded={() => refreshComments()}
    />
  </DialogContent>
</Dialog>
```

### To Add Real-time Comment Listener:

```typescript
// In firebase-session-context.tsx
const [comments, setComments] = useState<Record<string, CommentWithDetails[]>>({});

useEffect(() => {
  const commentsQuery = collection(db, "sessions", sessionId, "comments");

  const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
    // Fetch and organize comments by ideaId/groupId
    // Update state
  });

  return () => unsubscribe();
}, [sessionId]);
```

## File Structure

```
lib/
├── types/session.ts ✅ (Enhanced)
├── actions/
│   ├── comments.ts ✅ (Enhanced)
│   ├── pre-submit.ts ⏳ (TODO)
│   └── idea-locks.ts ⏳ (TODO)
components/
├── session/
│   ├── comment-thread.tsx ✅ (NEW)
│   ├── cursor-overlay.tsx ⏳ (TODO)
│   └── stages/
│       ├── idea-collection.tsx ⏳ (Needs pre-submit UI)
│       └── idea-grouping.tsx ⏳ (Needs cursor + lock integration)
├── idea-card.tsx ⏳ (Needs comment integration)
└── ui/
    └── dialog.tsx (Check if exists for modal)

e2e/
├── comments.spec.ts ⏳ (TODO)
├── idea-collection-pre-submit.spec.ts ⏳ (TODO)
├── multiplayer-cursors.spec.ts ⏳ (TODO)
└── conflict-resolution.spec.ts ⏳ (TODO)
```

## Test Coverage Needed

### Unit Tests
1. `lib/actions/__tests__/comments.test.ts` - Test threading logic
2. `lib/actions/__tests__/pre-submit.test.ts` - Test status transitions
3. `lib/actions/__tests__/idea-locks.test.ts` - Test lock acquisition
4. `components/__tests__/comment-thread.test.tsx` - Test UI behavior

### E2E Tests
1. `e2e/comments.spec.ts` - Full comment flow
2. `e2e/idea-collection-pre-submit.spec.ts` - Draft/approval workflow
3. `e2e/multiplayer-cursors.spec.ts` - Multi-context cursor visibility
4. `e2e/conflict-resolution.spec.ts` - Concurrent drag handling

## Firestore Security Rules Updates Needed

```javascript
match /ideas/{ideaId} {
  // Add pre-submit rules
  allow create: if request.resource.data.submissionStatus in ['draft', 'pending'];

  // Add lock rules
  allow update: if !resource.data.lockedById ||
                   resource.data.lockedById == request.auth.uid ||
                   resource.data.lockedAt < request.time - duration.from(30, 's');
}

match /presence/{userId} {
  // Already correct, supports cursor tracking ✅
  allow write: if userId == request.auth.uid;
}
```

## Dependencies

All required dependencies are already installed:
- ✅ Firebase SDK
- ✅ @dnd-kit (for drag-drop)
- ✅ date-fns (for timestamps)
- ✅ Framer Motion (for animations)

## Estimated Remaining Time

- Comments integration: 1-2 hours
- Pre-submit: 3-4 hours
- Multiplayer cursors: 5-6 hours
- Conflict resolution: 4-5 hours
- All tests: 6-8 hours

**Total: ~20-25 hours remaining**
