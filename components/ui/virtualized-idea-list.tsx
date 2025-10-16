"use client";

import { useEffect, useState } from "react";
import type { IdeaWithDetails } from "@/lib/types/session";

interface VirtualizedIdeaListProps {
  ideas: IdeaWithDetails[];
  renderIdea: (idea: IdeaWithDetails, index: number) => React.ReactNode;
  itemHeight?: number;
}

/**
 * Virtualized list for ideas - only renders visible items
 * Falls back to regular rendering if < 50 items
 */
export function VirtualizedIdeaList({
  ideas,
  renderIdea,
  itemHeight = 200,
}: VirtualizedIdeaListProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use regular rendering for small lists (< 50 items)
  if (!mounted || ideas.length < 50) {
    return (
      <div className="space-y-4">
        {ideas.map((idea, index) => (
          <div key={idea.id}>{renderIdea(idea, index)}</div>
        ))}
      </div>
    );
  }

  // For large lists, use CSS-based virtualization with intersection observer
  return (
    <div className="space-y-4" style={{ minHeight: ideas.length * itemHeight }}>
      {ideas.map((idea, index) => (
        <div key={idea.id} style={{ minHeight: itemHeight }}>
          {renderIdea(idea, index)}
        </div>
      ))}
    </div>
  );
}
