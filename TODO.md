# MagicRetro - TODO & Status Tracker

**Last Updated:** 2025-10-14

This is the SINGLE source of truth for project status and remaining work. Do NOT create separate status files.

## 🎯 Current Sprint: Presentation View & Testing

### High Priority
- [ ] **Presentation View** - Full projector-optimized display for all stages
- [ ] **Firebase Emulators** - Get presence tracking working with emulators
- [ ] **E2E Test Fixes** - Fix Playwright/Vitest conflicts
- [ ] **Testing Complete** - All unit and E2E tests passing

---

## ✅ COMPLETED FEATURES

### Core Infrastructure ✅
- **Next.js 15** - App Router, Turbopack, React 19
- **Firebase Firestore** - Real-time subscriptions, presence tracking
- **NextAuth v5** - Google OAuth authentication
- **TypeScript** - Strict mode, complete type coverage
- **Testing** - Vitest (238 unit tests), Playwright E2E setup
- **Styling** - TailwindCSS 4, Framer Motion animations

### Session Management ✅
- **CRUD Operations** - Create, read, update, delete sessions
- **Category System** - 1-10 categories per session with colors
- **Permission System** - Owner, admin, participant roles
- **Visibility Controls** - Public, private, protected sessions
- **Admin Controls** - Stage management, user controls
- **Real-time Sync** - Firebase Firestore live updates

### Stage-Specific UIs ✅

#### Green Room (Waiting Area) ✅
- [x] Live participant count with real-time updates
- [x] Animated facepile showing participant avatars
- [x] Pop-in animations for new participants
- [x] Continuous subtle floating motion for avatars
- [x] Optional countdown timer to session start
- [x] "Waiting for facilitator" message

#### Idea Collection ✅
- [x] Anonymous idea submission form
- [x] Category selector with validation
- [x] Real-time idea display grid
- [x] Character limit validation (500 chars)
- [x] Max entries per person enforcement
- [x] Countdown timer with graceful expiration
- [x] Admin control to disable submissions
- [x] Optimistic UI updates

#### Idea Voting ✅
- [x] Vote allocation UI (N votes per user)
- [x] Visual vote indicators (heart icons)
- [x] Real-time vote count updates
- [x] Vote/Unvote toggle buttons
- [x] Remaining votes indicator
- [x] Ideas sorted by vote count
- [x] Vote visualization (bar charts, heatmaps)
- [x] Category-specific vote limits UI
- [x] Group voting support
- [x] Rules enforcement (max votes per user/category)

#### Idea Grouping ✅
- [x] Advanced drag-and-drop with @dnd-kit
- [x] Auto-group creation (drag idea onto another)
- [x] Auto-delete empty groups
- [x] Cross-category grouping allowed
- [x] Color preservation (cards keep category color)
- [x] Move ideas between groups
- [x] Real-time synchronization
- [x] Max cards per group enforcement
- [x] Visual feedback (overlays, hover states, drop targets)
- [x] Three-column layout with mixed groups section

### Comments System ✅
- [x] Threaded comments on ideas (max 3 levels)
- [x] Real-time post/edit/delete
- [x] User avatars and timestamps
- [x] "Replying to X" indicators
- [x] Admin/author permissions
- [x] Comment count display

---

## 🚧 IN PROGRESS

### Presentation View (Priority 1)

**Location:** `/app/session/[id]/presentation/page.tsx`

#### Requirements by Stage:

**Green Room / Welcome:**
- [ ] Show live participant count and avatars
- [ ] Display join URL prominently
- [ ] Show URL code/QR code for easy joining
- [ ] Welcome message and instructions

**Idea Collection:**
- [ ] Show ideas appearing in real-time
- [ ] Keep ideas anonymous until reveal
- [ ] Countdown timer (large, prominent)
- [ ] Stats: submission count, active participants
- [ ] NO input controls (view only)

**Voting:**
- [ ] Hide individual votes until stage complete
- [ ] Show progress bar:
  - If max votes defined: countdown from total available
  - If no max: count up with expandable bar
- [ ] Show participation stats
- [ ] NO vote buttons (view only)

**Grouping:**
- [ ] Live drag-drop status optimized for viewing
- [ ] Show groups forming in real-time
- [ ] NO input controls (view only)
- [ ] Category sections clearly visible

**Finalization (Future):**
- [ ] Step through entities by priority (most votes first)
- [ ] Expand details: ideas, comments, votes
- [ ] Action item assignment
- [ ] Next steps discussion

#### Admin Controls:
- [ ] Button in admin panel to open presentation view
- [ ] Control presentation focus/selection from admin view
- [ ] Manual reveal controls
- [ ] Stage progression buttons

---

## 📋 TODO - Remaining Features

### Testing & Quality (Priority 1)
- [ ] Fix E2E test configuration (Playwright being imported in Vitest)
- [ ] All unit tests passing (currently 238 pass, some Firebase tests skipped)
- [ ] All E2E tests passing (currently failing due to config issue)
- [ ] Firebase emulator tests working (presence tracking validated)
- [ ] No lint errors or warnings ✅
- [ ] Successful production build ✅

### Finalization Stage (Priority 2)
- [ ] Idea selection interface
- [ ] Priority ordering (drag to reorder)
- [ ] Owner assignment to action items
- [ ] Export functionality (CSV, JSON, Markdown, PDF)
- [ ] Summary view

### Post-Session Stage (Priority 3)
- [ ] Read-only view of all results
- [ ] Final statistics
- [ ] Archive functionality
- [ ] Session history

### Polish & UX Improvements (Priority 4)
- [ ] Loading skeletons
- [ ] Empty states for each stage
- [ ] Error boundaries
- [ ] Toast notifications system
- [ ] More animations with Framer Motion
- [ ] Celebration effects (confetti)
- [ ] Sound effects (optional, with mute)
- [ ] Keyboard shortcuts
- [ ] Mobile responsive design improvements
- [ ] Touch gestures for mobile drag-and-drop

### Accessibility (Priority 4)
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation for all features
- [ ] Screen reader announcements
- [ ] High contrast mode support
- [ ] Focus indicators

### Performance (Priority 4)
- [ ] Virtualized lists for large idea counts
- [ ] Debounced real-time updates
- [ ] Image optimization
- [ ] Code splitting

---

## 🗂️ Project Structure

### Key Files

```
app/
├── globals.css                               # Global styles + Tailwind
├── layout.tsx                                # Root layout
├── page.tsx                                  # Homepage with session list
├── session/
│   ├── create/page.tsx                       # ✅ Create session form
│   └── [id]/
│       ├── page.tsx                          # ✅ Main session board
│       ├── admin/page.tsx                    # ✅ Admin controls
│       ├── presentation/page.tsx             # 🚧 Presentation view (TODO)
│       └── components/
│           ├── session-board.tsx             # ✅ Stage routing
│           ├── idea-card.tsx                 # ✅ Individual idea display
│           └── stages/
│               ├── green-room.tsx            # ✅ Waiting room
│               ├── idea-collection.tsx       # ✅ Idea submission
│               ├── idea-voting.tsx           # ✅ Voting interface
│               └── idea-grouping.tsx         # ✅ Drag-and-drop grouping

components/
├── ui/                                       # Reusable UI components
│   ├── button.tsx, badge.tsx, card.tsx      # ✅ Base components
│   ├── animated-facepile.tsx                # ✅ Participant avatars
│   ├── vote-bar.tsx, vote-heatmap.tsx       # ✅ Vote visualizations
│   └── dialog.tsx                            # ✅ Modal component
├── session/
│   ├── comment-thread.tsx                    # ✅ Threaded comments
│   ├── idea-card-with-comments.tsx          # ✅ Idea card + comments
│   └── admin/admin-controls.tsx             # ✅ Admin UI
├── presence-tracker.tsx                      # ✅ Real-time presence
└── participants-list.tsx                     # ✅ Live participant list

lib/
├── actions/                                  # ✅ Server Actions
│   ├── session.ts                            # Session CRUD
│   ├── ideas.ts                              # Idea CRUD
│   ├── comments.ts                           # Comment CRUD
│   ├── votes.ts                              # Vote management
│   └── categories.ts                         # Category management
├── auth/config.ts                            # ✅ NextAuth config
├── firebase/
│   ├── client.ts                             # ✅ Firebase client SDK
│   └── test-utils.ts                         # ✅ Emulator test utilities
├── types/session.ts                          # ✅ All TypeScript types
├── utils/
│   ├── permissions.ts                        # ✅ RBAC helpers
│   └── cn.ts                                 # ✅ Tailwind utility
└── contexts/
    └── firebase-session-context.tsx         # ✅ Firebase real-time context

e2e/                                          # Playwright E2E tests
├── navigation.spec.ts                        # ✅ Navigation tests
├── session-creation.spec.ts                  # ✅ Session creation
├── session-viewing.spec.ts                   # ✅ Session viewing
├── voting.spec.ts                            # ✅ Voting tests
├── comments.spec.ts                          # ✅ Comment tests
└── drag-drop-grouping.spec.ts               # ✅ Drag-drop tests

Configuration:
├── .env.local                                # ✅ Environment variables (REQUIRED)
├── env.mjs                                   # ✅ Zod validation
├── next.config.ts                            # ✅ Next.js config
├── firebase.json                             # ✅ Firebase emulator config
├── firestore.rules                           # ✅ Security rules
├── firestore.indexes.json                    # ✅ Database indexes
├── eslint.config.mjs                         # ✅ ESLint config
├── prettier.config.mjs                       # ✅ Prettier config
├── tsconfig.json                             # ✅ TypeScript config (strict)
├── vitest.config.ts                          # ✅ Vitest config
├── playwright.config.ts                      # ✅ Playwright config
└── package.json                              # ✅ Dependencies (~750 packages)
```

---

## 🔧 Development Commands

### Setup
```bash
cp .env.example .env.local    # REQUIRED before build
npm install                   # Install dependencies (~20s)
```

### Development
```bash
npm run dev                   # Start dev server on :3000
npm run build                 # Production build
npm start                     # Production server
npm run lint                  # Run ESLint
npm run format                # Run Prettier
```

### Testing
```bash
# Unit Tests (Vitest)
npm test                      # Run all unit tests
npm run test:watch            # Watch mode
npm run test:ui               # Interactive UI
npm run test:coverage         # Coverage report

# Firebase Integration Tests
npm run emulators             # Start Firebase emulators
npm run test:emulators        # Auto: start→test→stop

# E2E Tests (Playwright)
npm run test:e2e              # Headless
npm run test:e2e:ui           # Interactive (BEST)
npm run test:e2e:debug        # With Inspector
npm run test:e2e:report       # View HTML report
```

### Firebase Emulators
```bash
npm run emulators             # Start emulators
# Firestore: 127.0.0.1:8080
# Auth: 127.0.0.1:9099
# UI: http://localhost:4000
```

---

## 🎨 Tech Stack Details

### Frontend
- **Next.js 15** - App Router, Turbopack dev server
- **React 19** - Latest features, Server Components
- **TypeScript** - Strict mode enabled
- **TailwindCSS 4** - Utility-first styling
- **Framer Motion** - Animations
- **@dnd-kit** - Drag and drop

### Backend & Data
- **Firebase Firestore** - Real-time database
- **NextAuth v5** - Authentication (Google OAuth)
- **Server Actions** - Next.js server-side mutations
- **Zod** - Runtime validation

### Testing
- **Vitest** - Unit tests (jsdom, 238 tests)
- **Playwright** - E2E tests (Chromium)
- **Firebase Emulators** - Integration tests (17 tests)

---

## 🏗️ Architecture Patterns

### Data Flow
1. User action → Server Action → Firestore mutation
2. Firebase listener → Real-time update to all clients
3. Fallback → Page refresh if Firebase unavailable

### Real-Time Strategy
- ✅ All features work without real-time (Server Actions)
- ✅ Firebase adds real-time enhancements
- ✅ Automatic offline/online handling
- ✅ Manual refresh always available

### Security
- ✅ OAuth at audience level (internal employees only)
- ✅ Permission checks in Server Actions
- ✅ Firestore security rules
- ✅ Role-based access control (Owner, Admin, Participant)

### Component Patterns
- Server Components by default
- Client Components for interactivity ('use client')
- Optimistic updates for better UX
- Error boundaries for graceful failures

---

## 📊 Current Status

### Code Quality ✅
- **Build:** Successful
- **Lint:** Clean (0 errors, 0 warnings)
- **TypeScript:** Clean (0 errors)
- **Unit Tests:** 238 passing
- **E2E Tests:** Need configuration fix
- **Firebase Tests:** 17 tests (need emulators)

### What Works ✅
- Complete session management flow
- All stage UIs (green room, idea collection, voting, grouping)
- Real-time synchronization via Firebase
- Comments system with threading
- Vote visualization and enforcement
- Drag-and-drop grouping with auto-group creation
- Participant presence tracking
- Admin controls and permissions

### What's Next 🚧
1. **Presentation View** - Projector-optimized display
2. **E2E Test Fixes** - Resolve Playwright/Vitest conflicts
3. **Firebase Emulators** - Validate presence tracking
4. **Finalization Stage** - Action items and export
5. **Polish** - UX improvements and accessibility

---

## 🐛 Known Issues

### Testing
- E2E tests fail when run with `npm test` (Playwright/Vitest conflict)
- Firebase integration tests require emulators to be running
- Some E2E tests need auth flow (currently use conditional checks)

### Features
- Presentation view not yet implemented
- Finalization stage not yet implemented
- Post-session stage not yet implemented
- No export functionality yet
- Mobile drag-and-drop could be improved

---

## 💡 Important Notes

### Environment Setup
**ALWAYS** create `.env.local` before building:
```bash
cp .env.example .env.local
```

The `.env.example` file contains placeholder Firebase config that works for local development.

### Testing Best Practices
- **Unit tests:** Can run without Firebase emulators (238 tests)
- **Firebase tests:** Require emulators (use `npm run test:emulators`)
- **E2E tests:** Use `npm run test:e2e` (NOT `npm test`)

### E2E vs Unit Tests
**CRITICAL:** Never run E2E tests with Vitest. Always use Playwright CLI:
```bash
npm run test:e2e        # Correct
npm test                # Wrong (includes E2E files, causes conflicts)
```

### Documentation
This is the ONLY status/todo file. Do NOT create:
- ❌ FEATURES_COMPLETED.md
- ❌ FEATURES_IMPLEMENTED.md
- ❌ IMPLEMENTATION_STATUS.md
- ❌ VOTING_IMPLEMENTATION_SUMMARY.md
- ❌ DRAG_DROP_MATRIX.md
- ❌ Any other status tracking files

Keep all status updates in THIS file (TODO.md).

---

## 📚 Additional Documentation

- **TESTING.md** - Detailed testing guide (unit + Firebase integration)
- **E2E_TESTING.md** - Playwright E2E testing guide
- **CLAUDE.md** - Copilot instructions and architecture reference
- **.github/copilot-instructions.md** - GitHub Copilot configuration

---

**Last Review:** 2025-10-14
**Next Review:** When presentation view is complete
