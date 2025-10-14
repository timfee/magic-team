"use client";

import type { IdeaWithDetails } from "@/lib/types/session";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface IdeaCardProps {
  idea: IdeaWithDetails;
  categoryColor: string;
  draggable?: boolean;
  isOverlay?: boolean;
  isDraggedOver?: boolean;
  dropIndicator?: "create-group" | "join-group" | "move-to-group" | null;
  showVotes?: boolean;
}

export const IdeaCard = ({
  idea,
  categoryColor,
  draggable = false,
  isOverlay = false,
  isDraggedOver = false,
  dropIndicator = null,
  showVotes = true,
}: IdeaCardProps) => {
  // Always call hooks unconditionally (React rules)
  const sortable = useSortable({ id: idea.id, data: { type: "idea", idea } });

  const style = draggable
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging && !isOverlay ? 0.3 : 1,
        cursor: sortable.isDragging ? "grabbing" : "grab",
      }
    : {};

  const getDropIndicatorText = () => {
    switch (dropIndicator) {
      case "create-group":
        return "Will create group";
      case "join-group":
        return "Will join this group";
      case "move-to-group":
        return "Will move to this group";
      default:
        return null;
    }
  };

  const indicatorText = getDropIndicatorText();
  const showGlow = dropIndicator === "create-group";

  const cardContent = (
    <div
      data-testid="idea-card"
      data-drop-indicator={dropIndicator ?? undefined}
      className={`group relative rounded-lg border bg-white p-4 transition-all hover:shadow-md ${
        isDraggedOver || dropIndicator
          ? "border-2 border-blue-500 ring-4 ring-blue-200 dark:ring-blue-900"
          : "border-zinc-200 dark:border-zinc-800"
      } ${isOverlay ? "shadow-2xl" : ""} dark:bg-zinc-900`}
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: categoryColor,
      }}
    >
      <p className={`text-zinc-900 dark:text-zinc-50 ${draggable ? "ml-3" : ""}`}>
        {idea.content}
      </p>

      <div className={`mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500 ${draggable ? "ml-3" : ""}`}>
        <div className="flex items-center gap-2">
          {!idea.isAnonymous && idea.author && (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {idea.author.name ?? "Unknown"}
            </span>
          )}
          {idea.isAnonymous && <span className="italic">Anonymous</span>}
        </div>

        {showVotes && (idea._count?.votes ?? 0) > 0 && (
          <div className="flex items-center gap-1">
            <svg
              className="h-4 w-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-red-600 dark:text-red-400">
              {idea._count.votes}
            </span>
          </div>
        )}
      </div>

      {indicatorText && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 ${draggable ? "ml-3" : ""}`}>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {indicatorText}
        </div>
      )}

      {draggable && (
        <div
          className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
          style={{ backgroundColor: categoryColor }}
        />
      )}
    </div>
  );

  if (draggable) {
    /*
     * Callback refs from dnd-kit are safe to use during render.
     * The ESLint rule incorrectly flags these as unsafe, but they are
     * callback functions that React calls, not ref.current accesses.
     */
    /* eslint-disable react-hooks/refs */
    return (
      <div className="relative">
        {showGlow && (
          <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 opacity-75 blur" />
        )}
        <div
          ref={sortable.setNodeRef}
          style={style}
          {...sortable.attributes}
          {...sortable.listeners}
        >
          {cardContent}
        </div>
      </div>
    );
    /* eslint-enable react-hooks/refs */
  }

  return cardContent;
};
