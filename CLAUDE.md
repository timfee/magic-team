# MagicRetro - Copilot Instructions

## Project Overview

**MagicRetro**: Real-time multiplayer retrospective app with Next.js 15 + Firebase Firestore. Stages: green room → idea collection → voting → grouping → finalization.

**Tech Stack**: Next.js 15 (App Router, Turbopack), React 19, Firebase Firestore (real-time), NextAuth v5 (Google OAuth), TailwindCSS 4, Framer Motion, @dnd-kit, TypeScript (strict), Zod, Vitest, Playwright. ~750 packages.

## Critical Environment Setup

### Environment Variables (REQUIRED)

**ALWAYS create `.env.local` before building or running dev server:**

```bash
cp .env.example .env.local
```

The build will fail with Zod validation errors if Firebase environment variables are missing. The `.env.example` file contains placeholder values that work for local development:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_DATABASE_ID` (defaults to "(default)")

See `env.mjs` for validation schema using `@t3-oss/env-nextjs`.

## Build & Validation Commands

### Key Commands

```bash
npm install           # ~20s, 743+ packages
npm run dev           # Dev server with Turbopack on :3000
npm run lint          # ESLint (currently clean)
npm run format        # Prettier with Tailwind
npm run build         # ~10s, validates TS + ESLint (REQUIRES .env.local)
npm start             # Production server on :3000
```

**Build**: 5 routes total. TypeScript strict mode enabled. Linting uses `typescript-eslint` + Next.js rules in `eslint.config.mjs`.

## Testing

### Unit Tests (Vitest)

**238 tests pass without emulators**:

```bash
npm test                # Run all once
npm run test:watch      # Watch mode
npm run test:ui         # Interactive UI
npm run test:coverage   # Coverage report → coverage/index.html
```

**Test locations**: `lib/utils/__tests__/`, `lib/actions/__tests__/`, `components/__tests__/`, `lib/contexts/__tests__/`
**Config**: `vitest.config.ts` (jsdom, 10s timeout, V8 coverage)

### Firebase Integration Tests (17 tests)

**REQUIRES Emulators** - Ports: Firestore (8080), Auth (9099), UI (4000)

```bash
npm run test:emulators  # Auto: start→test→stop (RECOMMENDED)
# OR Manual: Terminal 1: npm run emulators | Terminal 2: npm test
```

**Config**: `firebase.json`, `firestore.rules`, `firestore.indexes.json`
**Tests**: `lib/firebase/__tests__/security-rules*.test.ts` (skipped if emulators not running)

### E2E Tests (Playwright)

```bash
npm run test:e2e         # Headless
npm run test:e2e:ui      # Interactive (BEST for debugging)
npm run test:e2e:debug   # With Inspector
npm run test:e2e:report  # View HTML report
npx playwright install --with-deps  # If browsers missing
```

**Tests**: `e2e/` (navigation, session-creation, session-viewing)
**Config**: `playwright.config.ts` (Chromium, 30s timeout, 120s webServer, auto-starts dev)
**CRITICAL**: NEVER run E2E with Vitest (library conflicts). Always use `npm run test:e2e`.

## Project Architecture & Layout

### Directory Structure

```
app/                              # Next.js 15 App Router
├── globals.css                   # Global styles + Tailwind directives
├── layout.tsx                    # Root layout (no auth provider here)
├── page.tsx                      # Homepage with session list
└── session/
    ├── create/                   # Session creation form with category builder (1-10 categories)
    │   └── page.tsx
    └── [id]/                     # Dynamic session routes
        ├── page.tsx              # Main session board (participant view)
        ├── admin/
        │   └── page.tsx          # Admin controls: stage management, force-progress
        ├── presentation/
        │   └── page.tsx          # ✅ Projector-optimized view (all stages)
        └── components/
            ├── session-board.tsx         # Routes to stage-specific components
            ├── idea-card.tsx             # Individual idea display with votes
            └── stages/
                ├── green-room.tsx        # Waiting room with live user count
                ├── idea-collection.tsx   # Anonymous idea submission
                ├── idea-voting.tsx       # Vote allocation interface
                └── idea-grouping.tsx     # Drag-and-drop with @dnd-kit

components/
├── __tests__/                    # Component tests
├── ui/                           # Reusable UI components (buttons, badges, cards)
├── idea-card.tsx                 # Idea display card
├── participants-list.tsx         # Live participant list
└── presence-tracker.tsx          # Real-time presence via Firebase

lib/
├── actions/                      # Server Actions (session, ideas, comments, votes, categories)
├── contexts/                     # React contexts (firebase-session-context.tsx)
├── firebase/
│   ├── client.ts                 # Firebase client SDK config
│   └── test-utils.ts             # Firebase emulator test utilities
├── types/
│   └── session.ts                # TypeScript types for all entities
└── utils/
    ├── cn.ts                     # Tailwind class merge utility
    └── permissions.ts            # RBAC helpers (owner, admin, participant)

e2e/                              # Playwright E2E tests (DO NOT run with Vitest)

Configuration files (root):
├── env.mjs                       # Environment validation with @t3-oss/env-nextjs + Zod
├── eslint.config.mjs             # ESLint flat config with TypeScript
├── firebase.json                 # Firebase emulator configuration
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore database indexes
├── next.config.ts                # Next.js config (imports env.mjs)
├── playwright.config.ts          # Playwright E2E test config
├── postcss.config.mjs            # PostCSS with Tailwind
├── prettier.config.mjs           # Prettier with Tailwind plugin
├── tsconfig.json                 # TypeScript strict config
├── vitest.config.ts              # Vitest unit test config
└── vitest.setup.ts               # Vitest global setup
```

### Real-Time Architecture

**Pattern**: User action → Server Action → DB mutation | Firebase listener → Real-time update | Fallback: page refresh
**Context**: `lib/contexts/firebase-session-context.tsx` (auto-connect when online)
**Security**: `firestore.rules` enforces permissions

### Stage System

Admin-controlled progression: GREEN_ROOM (waiting) → IDEA_COLLECTION (submit, 500 char) → VOTING (allocate votes) → GROUPING (@dnd-kit drag-drop) → FINALIZATION (partial) → POST_SESSION (TODO). Routing: `app/session/[id]/components/session-board.tsx`. Presentation mode: `/session/[id]/presentation` - full-screen view for all stages.

### Drag & Drop

@dnd-kit: Auto-group creation, auto-delete empty groups, cross-category grouping, color preservation, real-time Firebase sync. **Critical**: Client-only render (avoid SSR hydration errors).

### Permissions

**Roles** (`lib/utils/permissions.ts`): Owner (creator), Admin (stage/content control), Participant (any auth user)
**Visibility**: Public (anyone), Private (link required), Protected (internal only)

## Common Issues & Workarounds

### Build Failures

**Issue**: `Invalid environment variables` Zod errors on build
**Fix**: ALWAYS run `cp .env.example .env.local` before building

**Issue**: TypeScript errors in build but not in editor
**Fix**: Restart TypeScript server, check `tsconfig.json` paths

### Test Failures

**Issue**: Firebase integration tests fail with `ECONNREFUSED 127.0.0.1:8080`
**Fix**: Start emulators with `npm run emulators` or use `npm run test:emulators`

**Issue**: E2E tests fail with Playwright library errors when running `npm test`
**Fix**: NEVER run E2E tests with Vitest. Always use `npm run test:e2e`

**Issue**: Playwright browsers not installed
**Fix**: Run `npx playwright install --with-deps`

### Development Server Issues

**Issue**: Port 3000 already in use
**Fix**: Kill process with `lsof -ti:3000 | xargs kill -9`

**Issue**: Firebase emulator UI not accessible
**Fix**: Check `firebase.json` ports (default: 4000), ensure emulators running

### Hydration Mismatches

**Issue**: React hydration errors with drag-and-drop
**Fix**: Ensure DnD renders only on client (check `idea-grouping.tsx` for pattern with `useState` + `useEffect`)

## Validation Checklist

When making changes, ALWAYS:

1. **Before coding**: Run `npm install` if package.json changed
2. **Environment**: Verify `.env.local` exists (for builds)
3. **Lint**: Run `npm run lint` (must be clean before committing)
4. **Type check**: Verify build succeeds with `npm run build`
5. **Unit tests**: Run `npm test` (238 tests should pass without emulators)
6. **Integration tests** (if Firebase code changed): Run `npm run test:emulators`
7. **E2E tests** (if user flows changed): Run `npm run test:e2e`
8. **Manual testing**: Start dev server with `npm run dev`, test changed features

## Additional Notes

- **Turbopack enabled**: Dev server uses Turbopack for faster HMR
- **Tailwind 4**: Uses latest Tailwind with PostCSS plugin
- **Documentation**: See `TESTING.md`, `E2E_TESTING.md`, `TODO.md` for detailed info

## Documentation Policy (CRITICAL)

**DO NOT CREATE EXCESS STATUS/TODO FILES**

- ✅ **SINGLE SOURCE OF TRUTH**: `TODO.md` - All project status, todos, and progress
- ✅ Keep: `TESTING.md`, `E2E_TESTING.md`, `CLAUDE.md`, `.github/copilot-instructions.md`
- ❌ **NEVER CREATE**:
  - `FEATURES_COMPLETED.md`, `FEATURES_IMPLEMENTED.md`, `IMPLEMENTATION_STATUS.md`
  - `VOTING_IMPLEMENTATION_SUMMARY.md`, `DRAG_DROP_MATRIX.md`
  - `PROJECT_STATUS.md` or any other status tracking files
  - Any file ending in `_STATUS.md`, `_SUMMARY.md`, `_COMPLETED.md`, etc.

**When tracking progress:**
- Update `TODO.md` only
- Use clear checklist format with [x] for completed, [ ] for pending
- Keep history concise - focus on what's done and what's next
- Remove completed items periodically to keep file manageable

**When documenting features:**
- Add implementation notes to `TODO.md` under relevant sections
- For architecture/testing specifics, update `CLAUDE.md` or testing guides
- Do NOT create separate implementation summary files

---

**Trust these instructions** - They are verified and comprehensive. Only search for additional information if you encounter errors not covered here or if instructions seem incorrect.
