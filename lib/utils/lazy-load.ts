import dynamic from "next/dynamic";
import React from "react";

/**
 * Lazy-loaded components with automatic code splitting
 * Use these instead of direct imports for heavy components
 */

// Presentation mode components (heavy due to animations)
export const LazyPresentationView = dynamic(
  () =>
    import("@/components/session/presentation/presentation-view").then(
      (mod) => ({ default: mod.PresentationView }),
    ),
  {
    loading: () =>
      React.createElement(
        "div",
        { className: "flex h-screen items-center justify-center" },
        React.createElement("div", {
          className:
            "h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent",
        }),
      ),
    ssr: false,
  },
);

// Drag and drop grouping (heavy due to @dnd-kit)
export const LazyIdeaGrouping = dynamic(
  () =>
    import("@/components/session/stages/idea-grouping").then((mod) => ({
      default: mod.IdeaGrouping,
    })),
  {
    loading: () =>
      React.createElement(
        "div",
        { className: "flex h-64 items-center justify-center" },
        React.createElement(
          "div",
          { className: "text-zinc-500" },
          "Loading grouping interface...",
        ),
      ),
  },
);

// Comment thread (heavy due to nested rendering)
export const LazyCommentThread = dynamic(
  () =>
    import("@/components/session/comment-thread").then((mod) => ({
      default: mod.CommentThread,
    })),
  {
    loading: () =>
      React.createElement("div", {
        className: "h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800",
      }),
  },
);

// Confetti effects (optional, lazy load on demand)
export const lazyConfetti = {
  celebrateStageComplete: () =>
    import("@/lib/utils/confetti").then((mod) => mod.celebrateStageComplete()),
  celebrateSessionComplete: () =>
    import("@/lib/utils/confetti").then((mod) =>
      mod.celebrateSessionComplete(),
    ),
  celebrateVotingComplete: () =>
    import("@/lib/utils/confetti").then((mod) => mod.celebrateVotingComplete()),
};
