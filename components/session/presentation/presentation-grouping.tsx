"use client";

import type {
  MagicSessionWithDetails,
  Idea,
  IdeaGroup,
} from "@/lib/types/session";
import { motion } from "framer-motion";

interface PresentationGroupingProps {
  session: MagicSessionWithDetails;
  ideas: Idea[];
  groups: IdeaGroup[];
}

export function PresentationGrouping({
  session,
  ideas,
  groups,
}: PresentationGroupingProps) {
  // Group ideas by category and groupId
  const categorizedData = session.categories.map((category) => {
    const categoryIdeas = ideas.filter(
      (idea) => idea.categoryId === category.id,
    );
    const categoryGroups = groups.filter(
      (group) => group.categoryId === category.id,
    );

    const ungroupedIdeas = categoryIdeas.filter((idea) => !idea.groupId);
    const groupedIdeas = categoryGroups.map((group) => ({
      group,
      ideas: categoryIdeas.filter((idea) => idea.groupId === group.id),
    }));

    return { category, ungroupedIdeas, groupedIdeas };
  });

  return (
    <div className="flex h-full flex-col text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold">{session.name}</h1>
        <p className="mt-2 text-2xl text-zinc-400">
          Organizing ideas into groups
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
          <div className="text-5xl font-bold">{ideas.length}</div>
          <div className="mt-2 text-xl text-zinc-400">total ideas</div>
        </div>

        <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
          <div className="text-5xl font-bold">{groups.length}</div>
          <div className="mt-2 text-xl text-zinc-400">groups formed</div>
        </div>

        <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
          <div className="text-5xl font-bold">
            {ideas.filter((i) => !i.groupId).length}
          </div>
          <div className="mt-2 text-xl text-zinc-400">ungrouped ideas</div>
        </div>
      </div>

      {/* Categories Display */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-4">
        {categorizedData.map(({ category, ungroupedIdeas, groupedIdeas }) => (
          <div key={category.id} className="rounded-2xl bg-white/5 p-6">
            {/* Category Header */}
            <div
              className="mb-4 flex items-center gap-3 border-l-4 pl-4"
              style={{ borderColor: category.color }}>
              <h2 className="text-3xl font-bold">{category.name}</h2>
              <span className="text-xl text-zinc-400">
                ({ungroupedIdeas.length + groupedIdeas.length} items)
              </span>
            </div>

            {/* Groups */}
            {groupedIdeas.length > 0 && (
              <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedIdeas.map(({ group, ideas: groupIdeas }) => (
                  <motion.div
                    key={group.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xl font-semibold">
                        {group.title ?? "Untitled Group"}
                      </h3>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
                        {groupIdeas.length}{" "}
                        {groupIdeas.length === 1 ? "idea" : "ideas"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {groupIdeas.slice(0, 3).map((idea) => (
                        <div
                          key={idea.id}
                          className="truncate rounded-lg bg-white/10 p-3 text-sm">
                          {idea.content}
                        </div>
                      ))}
                      {groupIdeas.length > 3 && (
                        <div className="text-center text-sm text-zinc-500">
                          +{groupIdeas.length - 3} more...
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Ungrouped Ideas */}
            {ungroupedIdeas.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-zinc-400">
                  Individual Ideas ({ungroupedIdeas.length})
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {ungroupedIdeas.map((idea) => (
                    <motion.div
                      key={idea.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-lg border-l-4 bg-white/10 p-3 text-sm backdrop-blur-sm"
                      style={{ borderColor: category.color }}>
                      <div className="line-clamp-3">{idea.content}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {ungroupedIdeas.length === 0 && groupedIdeas.length === 0 && (
              <div className="py-8 text-center text-zinc-500">
                No ideas in this category yet
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom instruction */}
      <div className="mt-6 text-center text-xl text-zinc-500">
        Watch as ideas are organized in real-time
      </div>
    </div>
  );
}
