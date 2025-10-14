"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import type { Category } from "@/lib/types/session";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";

interface PostSessionProps {
  sessionId: string;
  sessionName: string;
  categories: Category[];
  createdAt: Date;
}

export const PostSession = ({
  sessionId: _sessionId,
  sessionName,
  categories,
  createdAt,
}: PostSessionProps) => {
  const { ideas, groups, activeUsers, userCount } = useSession();

  // Calculate statistics
  const totalIdeas = ideas.length;
  const totalVotes = ideas.reduce(
    (sum, idea) => sum + (idea._count?.votes ?? 0),
    0,
  );
  const totalGroups = groups.length;
  const totalComments = ideas.reduce(
    (sum, idea) => sum + (idea._count?.comments ?? 0),
    0,
  );

  const ideasByCategory = categories.map((category) => ({
    ...category,
    ideas: ideas.filter((idea) => idea.categoryId === category.id),
    groups: groups.filter((group) => group.categoryId === category.id),
  }));

  const topIdeas = [...ideas]
    .sort((a, b) => (b._count?.votes ?? 0) - (a._count?.votes ?? 0))
    .slice(0, 5);

  if (totalIdeas === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No results yet"
        description="This session doesn't have any ideas or results to display."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          {sessionName}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Session completed on {createdAt.toLocaleDateString()}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Session Complete
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="💡"
          label="Total Ideas"
          value={totalIdeas}
          color="blue"
        />
        <StatCard
          icon="❤️"
          label="Total Votes"
          value={totalVotes}
          color="red"
        />
        <StatCard
          icon="📦"
          label="Groups Formed"
          value={totalGroups}
          color="purple"
        />
        <StatCard
          icon="💬"
          label="Comments"
          value={totalComments}
          color="green"
        />
      </motion.div>

      {/* Top Ideas */}
      {topIdeas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            🏆 Top Ideas
          </h2>
          <div className="space-y-3">
            {topIdeas.map((idea, index) => {
              const category = categories.find((c) => c.id === idea.categoryId);
              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {category && (
                        <>
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {category.name}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-zinc-900 dark:text-zinc-50">
                      {idea.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-red-600 dark:text-red-400">
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {idea._count?.votes ?? 0}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Ideas by Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          📋 All Ideas by Category
        </h2>
        {ideasByCategory.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + categoryIndex * 0.1 }}
            className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {category.name}
              </h3>
              <span className="text-sm text-zinc-500 dark:text-zinc-500">
                ({category.ideas.length} ideas, {category.groups.length} groups)
              </span>
            </div>

            {category.ideas.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                No ideas in this category
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {category.ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700"
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor: category.color,
                    }}>
                    <p className="text-sm text-zinc-900 dark:text-zinc-50">
                      {idea.content}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {idea._count?.votes ?? 0}
                      </span>
                      {(idea._count?.comments ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                          </svg>
                          {idea._count.comments}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Participation Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-lg border border-zinc-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 dark:border-zinc-800 dark:from-blue-950/20 dark:to-purple-950/20">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          👥 Participation
        </h2>
        <p className="text-lg text-zinc-700 dark:text-zinc-300">
          <span className="font-semibold">{userCount}</span> participants
          contributed to this session
        </p>
        {activeUsers.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeUsers.slice(0, 10).map((user) => (
              <div
                key={user.id}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm dark:bg-zinc-900">
                {user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? "User"}
                    className="h-5 w-5 rounded-full"
                  />
                )}
                <span className="text-zinc-900 dark:text-zinc-50">
                  {user.name ?? "Anonymous"}
                </span>
              </div>
            ))}
            {activeUsers.length > 10 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
                +{activeUsers.length - 10} more
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: "blue" | "red" | "purple" | "green";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses[color]} text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
