"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import type { Category } from "@/lib/types/session";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/contexts/toast-context";

interface IdeaFinalizationProps {
  sessionId: string;
  categories: Category[];
}

interface ActionItem {
  id: string;
  content: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  votes: number;
  priority: number;
  assignedTo?: string;
  isFromGroup: boolean;
  groupTitle?: string;
}

export const IdeaFinalization = ({
  sessionId: _sessionId,
  categories,
}: IdeaFinalizationProps) => {
  const { ideas, groups } = useSession();
  const { addToast } = useToast();

  // Transform ideas and groups into action items sorted by votes
  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    // Add top voted ideas (not in groups)
    const ungroupedIdeas = ideas.filter((idea) => !idea.groupId);
    ungroupedIdeas.forEach((idea, index) => {
      const category = categories.find((c) => c.id === idea.categoryId);
      const voteCount = idea._count?.votes ?? 0;

      items.push({
        id: idea.id,
        content: idea.content,
        categoryId: idea.categoryId,
        categoryName: category?.name ?? "Unknown",
        categoryColor: category?.color ?? "#6B7280",
        votes: voteCount,
        priority: index,
        isFromGroup: false,
      });
    });

    // Add groups
    groups.forEach((group, index) => {
      const category = categories.find((c) => c.id === group.categoryId);
      const groupIdeas = ideas.filter((i) => i.groupId === group.id);
      const totalVotes = groupIdeas.reduce(
        (sum, idea) => sum + (idea._count?.votes ?? 0),
        0,
      );

      items.push({
        id: group.id,
        content: groupIdeas.map((i) => i.content).join(", "),
        categoryId: group.categoryId,
        categoryName: category?.name ?? "Unknown",
        categoryColor: category?.color ?? "#6B7280",
        votes: totalVotes,
        priority: ungroupedIdeas.length + index,
        isFromGroup: true,
        groupTitle: group.title,
      });
    });

    // Sort by votes (descending)
    return items.sort((a, b) => b.votes - a.votes);
  });

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setActionItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          priority: index,
        }));
      });

      addToast("Priority order updated", "success");
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExport = (format: "csv" | "json" | "markdown") => {
    const selectedActionItems = actionItems.filter((item) =>
      selectedItems.has(item.id),
    );
    const itemsToExport =
      selectedActionItems.length > 0 ? selectedActionItems : actionItems;

    if (format === "csv") {
      const csv = [
        "Priority,Category,Content,Votes,Assigned To",
        ...itemsToExport.map(
          (item) =>
            `${item.priority + 1},"${item.categoryName}","${item.content.replace(/"/g, '""')}",${item.votes},"${item.assignedTo ?? ""}"`,
        ),
      ].join("\n");

      downloadFile(csv, "action-items.csv", "text/csv");
    } else if (format === "json") {
      const json = JSON.stringify(itemsToExport, null, 2);
      downloadFile(json, "action-items.json", "application/json");
    } else if (format === "markdown") {
      const markdown = [
        "# Action Items",
        "",
        ...itemsToExport.map(
          (item) =>
            `## ${item.priority + 1}. ${item.categoryName}\n\n${item.content}\n\n- **Votes:** ${item.votes}\n- **Assigned To:** ${item.assignedTo ?? "Unassigned"}\n`,
        ),
      ].join("\n");

      downloadFile(markdown, "action-items.md", "text/markdown");
    }

    addToast(
      `Exported ${itemsToExport.length} items as ${format.toUpperCase()}`,
      "success",
    );
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (actionItems.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No items to finalize"
        description="There are no ideas or groups to turn into action items yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Finalize Action Items
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Drag to reorder by priority. Select items to export.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">
            Export CSV
          </button>
          <button
            onClick={() => handleExport("json")}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">
            Export JSON
          </button>
          <button
            onClick={() => handleExport("markdown")}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">
            Export MD
          </button>
        </div>
      </div>

      {/* Action Items List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}>
        <SortableContext
          items={actionItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {actionItems.map((item, index) => (
              <SortableActionItem
                key={item.id}
                item={item}
                index={index}
                isSelected={selectedItems.has(item.id)}
                onToggleSelection={() => toggleSelection(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Summary */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {selectedItems.size > 0 ?
              `${selectedItems.size} selected`
            : `${actionItems.length} total items`}
          </span>
          {selectedItems.size > 0 && (
            <button
              onClick={() => setSelectedItems(new Set())}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Clear selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface SortableActionItemProps {
  item: ActionItem;
  index: number;
  isSelected: boolean;
  onToggleSelection: () => void;
}

function SortableActionItem({
  item,
  index,
  isSelected,
  onToggleSelection,
}: SortableActionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-white p-4 transition-all dark:bg-zinc-900 ${
        isSelected ?
          "ring-opacity-50 border-blue-500 ring-2 ring-blue-500"
        : "border-zinc-200 dark:border-zinc-800"
      }`}>
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-400">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
        />

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {index + 1}
            </span>
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.categoryColor }}
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {item.categoryName}
            </span>
            {item.isFromGroup && item.groupTitle && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                Group: {item.groupTitle}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              <svg
                className="h-4 w-4 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              {item.votes}
            </span>
          </div>

          <p className="text-sm text-zinc-900 dark:text-zinc-50">
            {item.content}
          </p>

          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
            <label className="flex items-center gap-2">
              <span>Assigned to:</span>
              <input
                type="text"
                placeholder="Name or email"
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
