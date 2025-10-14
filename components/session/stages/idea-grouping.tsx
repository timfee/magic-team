"use client";

import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/idea-card";
import {
  createIdeaGroup,
  deleteIdeaGroup,
  moveIdeaToGroup,
  updateIdea,
} from "@/lib/actions/ideas";
import type {
  Category,
  IdeaGroupWithDetails,
  IdeaWithDetails,
  CommentWithDetails,
} from "@/lib/types/session";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CommentThread } from "@/components/session/comment-thread";
import { getCommentsWithDetails } from "@/lib/actions/comments";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

interface IdeaGroupingProps {
  sessionId: string;
  categories: Category[];
  initialIdeas: IdeaWithDetails[];
  initialGroups: IdeaGroupWithDetails[];
  userId: string | null;
  isAdmin?: boolean;
}

// Generate random group title
const generateGroupTitle = () => {
  const adjectives = [
    "Amazing",
    "Brilliant",
    "Creative",
    "Dynamic",
    "Essential",
    "Fantastic",
    "Great",
    "Innovative",
  ];
  const nouns = [
    "Ideas",
    "Concepts",
    "Thoughts",
    "Solutions",
    "Insights",
    "Approaches",
    "Strategies",
    "Plans",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};

// Calculate new order for reordering within same context
const calculateNewOrder = (
  activeIdea: IdeaWithDetails,
  overIdea: IdeaWithDetails,
  ideas: IdeaWithDetails[],
): number => {
  // Get all ideas in the same context (same groupId or both ungrouped)
  const contextIdeas = ideas
    .filter((i) => i.groupId === overIdea.groupId && i.categoryId === overIdea.categoryId)
    .sort((a, b) => a.order - b.order);

  const overIndex = contextIdeas.findIndex((i) => i.id === overIdea.id);
  const activeIndex = contextIdeas.findIndex((i) => i.id === activeIdea.id);

  if (overIndex === -1) return overIdea.order;

  // Moving down (active before over)
  if (activeIndex < overIndex) {
    // Place after overIdea
    if (overIndex === contextIdeas.length - 1) {
      return contextIdeas[overIndex].order + 1;
    }
    return (contextIdeas[overIndex].order + contextIdeas[overIndex + 1].order) / 2;
  }

  // Moving up (active after over)
  if (overIndex === 0) {
    return contextIdeas[0].order - 1;
  }
  return (contextIdeas[overIndex - 1].order + contextIdeas[overIndex].order) / 2;
};

// Ghost Placeholder Component
const GhostPlaceholder = ({ text }: { text: string }) => (
  <div className="rounded-lg border-2 border-dashed border-blue-500 bg-blue-50 p-4 dark:bg-blue-950/30">
    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      <span className="text-sm font-medium">{text}</span>
    </div>
  </div>
);

// Removed DraggableIdeaCard - now using unified IdeaCard from @/components/idea-card

// Droppable Group Component
const DroppableGroup = ({
  group,
  ideas,
  allIdeas,
  categories,
  onDeleteGroup,
  isOver,
  showGhostPlaceholder,
  dragOverId,
  activeId,
  sessionId,
  currentUserId,
  isAdmin,
}: {
  group: IdeaGroupWithDetails;
  ideas: IdeaWithDetails[];
  allIdeas: IdeaWithDetails[];
  categories: Category[];
  onDeleteGroup: (groupId: string) => void;
  isOver: boolean;
  showGhostPlaceholder: boolean;
  dragOverId: string | null;
  activeId: string | null;
  sessionId: string;
  currentUserId: string | null;
  isAdmin?: boolean;
}) => {
  const { setNodeRef } = useSortable({
    id: group.id,
    data: { type: "group", group },
  });

  // Comment state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [commentCount, setCommentCount] = useState(group._count?.comments ?? 0);

  // Listen to comment count changes
  useEffect(() => {
    const commentsQuery = query(
      collection(db, "sessions", sessionId, "comments"),
      where("groupId", "==", group.id),
    );
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      setCommentCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [sessionId, group.id]);

  // Load comments when modal opens
  useEffect(() => {
    if (isCommentsOpen) {
      void getCommentsWithDetails(sessionId, undefined, group.id).then(setComments);
    }
  }, [isCommentsOpen, sessionId, group.id]);

  // Get category colors for ideas
  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color ?? "#000";
  };

  const activeIdea = activeId ? allIdeas.find((i) => i.id === activeId) : null;

  const getDropIndicator = (
    targetIdea: IdeaWithDetails,
  ): "create-group" | "join-group" | "move-to-group" | null => {
    if (!activeIdea || activeIdea.id === targetIdea.id) return null;

    const activeGrouped = !!activeIdea.groupId;
    const targetGrouped = !!targetIdea.groupId;

    if (!activeGrouped && !targetGrouped) return "create-group";
    if (targetGrouped && !activeGrouped) return "join-group";
    if (activeGrouped && !targetGrouped) return "join-group";
    if (
      activeGrouped &&
      targetGrouped &&
      activeIdea.groupId !== targetIdea.groupId
    )
      return "move-to-group";

    return null;
  };

  return (
    <div
      ref={setNodeRef}
      data-testid="idea-group"
      className={`rounded-lg border-2 p-4 transition-all ${
        isOver
          ? "border-blue-500 bg-blue-50 ring-4 ring-blue-200 dark:bg-blue-950/30 dark:ring-blue-900"
          : "border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50"
      }`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          {group.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">
            {ideas.length}
            {group.maxCards && ` / ${group.maxCards}`}
          </span>
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="View comments">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{commentCount}</span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteGroup(group.id)}
            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950">
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {ideas.length === 0 && !showGhostPlaceholder ? (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-sm text-zinc-500">Drop ideas here</p>
          </div>
        ) : (
          <>
            {ideas
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  categoryColor={getCategoryColor(idea.categoryId)}
                  draggable
                  isDraggedOver={dragOverId === idea.id}
                  dropIndicator={
                    dragOverId === idea.id ? getDropIndicator(idea) : null
                  }
                  showVotes={false}
                />
              ))}
            {showGhostPlaceholder && <GhostPlaceholder text="Will add here" />}
          </>
        )}
      </div>

      {/* Comments Dialog */}
      {isCommentsOpen && (
        <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <DialogContent title={`Comments on ${group.title}`}>
            <CommentThread
              sessionId={sessionId}
              groupId={group.id}
              comments={comments}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onCommentAdded={() => {
                void getCommentsWithDetails(sessionId, undefined, group.id).then(
                  setComments,
                );
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Ungrouped Drop Zone Component
const UngroupedDropZone = ({
  categoryId,
  categoryColor,
  ideas,
  allIdeas,
  isDragging,
  isActiveIdeaGrouped,
  dragOverId,
  activeId,
}: {
  categoryId: string;
  categoryColor: string;
  ideas: IdeaWithDetails[];
  allIdeas: IdeaWithDetails[];
  isDragging: boolean;
  isActiveIdeaGrouped: boolean;
  dragOverId: string | null;
  activeId: string | null;
}) => {
  const { setNodeRef } = useDroppable({
    id: `ungrouped-${categoryId}`,
    data: { type: "ungrouped-zone", categoryId },
  });

  const isOver = dragOverId === `ungrouped-${categoryId}`;
  const activeIdea = activeId ? allIdeas.find((i) => i.id === activeId) : null;

  const getDropIndicator = (
    targetIdea: IdeaWithDetails,
  ): "create-group" | "join-group" | "move-to-group" | null => {
    if (!activeIdea || activeIdea.id === targetIdea.id) return null;

    const activeGrouped = !!activeIdea.groupId;
    const targetGrouped = !!targetIdea.groupId;

    if (!activeGrouped && !targetGrouped) return "create-group";
    if (targetGrouped && !activeGrouped) return "join-group";
    if (activeGrouped && !targetGrouped) return "join-group";
    if (
      activeGrouped &&
      targetGrouped &&
      activeIdea.groupId !== targetIdea.groupId
    )
      return "move-to-group";

    return null;
  };

  return (
    <div
      ref={setNodeRef}
      data-testid="ungrouped-zone"
      className={`space-y-2 ${isDragging ? "min-h-32" : ""} ${
        isOver && isActiveIdeaGrouped
          ? "rounded-lg border-2 border-blue-500 bg-blue-50 p-2 ring-4 ring-blue-200 dark:bg-blue-950/30 dark:ring-blue-900"
          : ""
      }`}>
      {ideas.length === 0 && !isDragging ? (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">No ungrouped ideas</p>
        </div>
      ) : (
        <>
          {ideas
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                categoryColor={categoryColor}
                draggable
                isDraggedOver={dragOverId === idea.id}
                dropIndicator={
                  dragOverId === idea.id ? getDropIndicator(idea) : null
                }
                showVotes={false}
              />
            ))}
          {isDragging && ideas.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">
                {isActiveIdeaGrouped
                  ? "Drop here to ungroup"
                  : "Drop ideas here"}
              </p>
            </div>
          )}
          {isOver && isActiveIdeaGrouped && ideas.length > 0 && (
            <GhostPlaceholder text="Will ungroup here" />
          )}
        </>
      )}
    </div>
  );
};

// Category Column Component
const CategoryColumn = ({
  category,
  ideas,
  groups,
  onDeleteGroup,
  dragOverId,
  activeId,
  sessionId,
  currentUserId,
  isAdmin,
}: {
  category: Category;
  ideas: IdeaWithDetails[];
  groups: IdeaGroupWithDetails[];
  onDeleteGroup: (groupId: string) => void;
  dragOverId: string | null;
  activeId: string | null;
  sessionId: string;
  currentUserId: string | null;
  isAdmin: boolean;
}) => {
  // Ungrouped ideas in this category
  const ungroupedIdeas = ideas.filter(
    (i) => i.categoryId === category.id && !i.groupId,
  );

  const isDragging = !!activeId;
  const activeIdea = activeId ? ideas.find((i) => i.id === activeId) : null;
  const isActiveIdeaGrouped =
    activeIdea?.groupId !== null && activeIdea?.groupId !== undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          {category.name}
        </h3>
        <span className="text-sm text-zinc-500">({ungroupedIdeas.length})</span>
      </div>

      {/* Ungrouped Ideas */}
      <UngroupedDropZone
        categoryId={category.id}
        categoryColor={category.color}
        ideas={ungroupedIdeas}
        allIdeas={ideas}
        isDragging={isDragging}
        isActiveIdeaGrouped={isActiveIdeaGrouped}
        dragOverId={dragOverId}
        activeId={activeId}
      />

      {/* Groups containing ideas from this category */}
      {groups
        .filter((g) =>
          ideas.some((i) => i.groupId === g.id && i.categoryId === category.id),
        )
        .map((group) => {
          const groupIdeas = ideas.filter((i) => i.groupId === group.id);
          return (
            <DroppableGroup
              key={group.id}
              group={group}
              ideas={groupIdeas}
              allIdeas={ideas}
              categories={[category]}
              onDeleteGroup={onDeleteGroup}
              isOver={dragOverId === group.id}
              showGhostPlaceholder={
                dragOverId === group.id && activeId !== null
              }
              dragOverId={dragOverId}
              activeId={activeId}
              sessionId={sessionId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          );
        })}
    </div>
  );
};

export const IdeaGrouping = ({
  sessionId,
  categories,
  initialIdeas,
  initialGroups,
  userId,
  isAdmin = false,
}: IdeaGroupingProps) => {
  const ideas = initialIdeas;
  const groups = initialGroups;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Fix hydration mismatch by only enabling DnD after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragCancel = () => {
    // Reset state when drag is cancelled (ESC key or drag outside)
    setActiveId(null);
    setOverId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const activeIdea = ideas.find((i) => i.id === active.id);
    if (!activeIdea) return;

    const overData = over.data.current as
      | { type: string; categoryId?: string }
      | undefined;

    // Dropped on ungrouped zone - ungroup the idea
    if (overData?.type === "ungrouped-zone") {
      if (!activeIdea.groupId) return;

      const fromGroupId = activeIdea.groupId;

      startTransition(async () => {
        try {
          await moveIdeaToGroup(activeIdea.id, null, sessionId);

          // Check if source group is empty and delete it
          const remainingInGroup = ideas.filter(
            (i) => i.groupId === fromGroupId && i.id !== activeIdea.id,
          );

          if (remainingInGroup.length === 0) {
            await deleteIdeaGroup(fromGroupId, sessionId);
          }

          router.refresh();
        } catch (error) {
          console.error("Failed to ungroup idea:", error);
        }
      });
      return;
    }

    // Dropped on another idea
    if (overData?.type === "idea") {
      const overIdea = ideas.find((i) => i.id === over.id);
      if (!overIdea) return;

      // Case 1: Both ideas are ungrouped
      if (!overIdea.groupId && !activeIdea.groupId) {
        // Same category → reorder (don't create group)
        if (activeIdea.categoryId === overIdea.categoryId) {
          startTransition(async () => {
            try {
              const newOrder = calculateNewOrder(activeIdea, overIdea, ideas);
              await updateIdea(activeIdea.id, sessionId, { order: newOrder });
              router.refresh();
            } catch (error) {
              console.error("Failed to reorder ungrouped ideas:", error);
            }
          });
          return;
        }

        // Different categories → create new group
        startTransition(async () => {
          try {
            const groupTitle = generateGroupTitle();
            const result = await createIdeaGroup({
              sessionId,
              categoryId: activeIdea.categoryId,
              title: groupTitle,
              order: groups.length,
            });

            await Promise.all([
              moveIdeaToGroup(activeIdea.id, result.groupId, sessionId),
              moveIdeaToGroup(overIdea.id, result.groupId, sessionId),
            ]);

            router.refresh();
          } catch (error) {
            console.error("Failed to create group:", error);
          }
        });
        return;
      }

      // Case 2: Target grouped, active ungrouped → add to group
      if (overIdea.groupId && !activeIdea.groupId) {
        startTransition(async () => {
          try {
            await moveIdeaToGroup(
              activeIdea.id,
              overIdea.groupId ?? null,
              sessionId,
            );
            router.refresh();
          } catch (error) {
            console.error("Failed to add to group:", error);
          }
        });
        return;
      }

      // Case 3: Active grouped, target ungrouped → add target to group
      if (activeIdea.groupId && !overIdea.groupId) {
        startTransition(async () => {
          try {
            await moveIdeaToGroup(overIdea.id, activeIdea.groupId ?? null, sessionId);
            router.refresh();
          } catch (error) {
            console.error("Failed to add to group:", error);
          }
        });
        return;
      }

      // Case 4: Both grouped
      if (activeIdea.groupId && overIdea.groupId) {
        // Same group → reorder
        if (activeIdea.groupId === overIdea.groupId) {
          startTransition(async () => {
            try {
              const newOrder = calculateNewOrder(activeIdea, overIdea, ideas);
              await updateIdea(activeIdea.id, sessionId, { order: newOrder });
              router.refresh();
            } catch (error) {
              console.error("Failed to reorder within group:", error);
            }
          });
          return;
        }

        // Different groups → move active to target's group
        const fromGroupId = activeIdea.groupId;

        startTransition(async () => {
          try {
            const newOrder = calculateNewOrder(activeIdea, overIdea, ideas);
            await moveIdeaToGroup(activeIdea.id, overIdea.groupId ?? null, sessionId, newOrder);

            // Check if source group is empty and delete it
            const remainingInGroup = ideas.filter(
              (i) => i.groupId === fromGroupId && i.id !== activeIdea.id,
            );

            if (remainingInGroup.length === 0) {
              await deleteIdeaGroup(fromGroupId ?? "", sessionId);
            }

            router.refresh();
          } catch (error) {
            console.error("Failed to move between groups:", error);
          }
        });
        return;
      }
    }

    // Dropped on a group container
    if (overData?.type === "group") {
      const overGroup = groups.find((g) => g.id === over.id);
      if (!overGroup) return;

      const fromGroupId = activeIdea.groupId;

      // Don't move if already in target group (no-op)
      if (fromGroupId === overGroup.id) return;

      startTransition(async () => {
        try {
          await moveIdeaToGroup(activeIdea.id, overGroup.id, sessionId);

          // Check if source group is empty and delete it
          if (fromGroupId) {
            const remainingInGroup = ideas.filter(
              (i) => i.groupId === fromGroupId && i.id !== activeIdea.id,
            );

            if (remainingInGroup.length === 0) {
              await deleteIdeaGroup(fromGroupId, sessionId);
            }
          }

          router.refresh();
        } catch (error) {
          console.error("Failed to move idea:", error);
        }
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    startTransition(async () => {
      try {
        await deleteIdeaGroup(groupId, sessionId);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete group:", error);
      }
    });
  };

  const activeIdea = activeId ? ideas.find((i) => i.id === activeId) : null;

  if (!isMounted) {
    // Render static content before hydration
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Group Ideas
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Group Ideas
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Drag ideas onto each other to create groups, or onto existing
              groups to add them
            </p>
          </div>
        </div>

        {/* Category Columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryColumn
              key={category.id}
              category={category}
              ideas={ideas}
              groups={groups}
              onDeleteGroup={handleDeleteGroup}
              dragOverId={overId}
              activeId={activeId}
              sessionId={sessionId}
              currentUserId={userId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeIdea && (
          <IdeaCard
            idea={activeIdea}
            categoryColor={
              categories.find((c) => c.id === activeIdea.categoryId)?.color ??
              "#000"
            }
            draggable
            isOverlay
            showVotes={false}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};
