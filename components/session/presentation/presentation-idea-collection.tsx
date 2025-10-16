"use client";

import type { MagicSessionWithDetails, Idea } from "@/lib/types/session";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PresentationIdeaCollectionProps {
  session: MagicSessionWithDetails;
  ideas: Idea[];
  userCount: number;
  timerEnd?: Date | null;
  submissionsEnabled: boolean;
}

export function PresentationIdeaCollection({
  session,
  ideas,
  userCount,
  timerEnd,
  submissionsEnabled,
}: PresentationIdeaCollectionProps) {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(
    timerEnd ? "" : null,
  );
  const [isExpired, setIsExpired] = useState(false);

  // Calculate time until expiration
  useEffect(() => {
    if (!timerEnd) {
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(timerEnd);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Time's up!");
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }

      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timerEnd]);

  // Count submissions per category
  const categoryStats = session.categories.map((category) => ({
    ...category,
    count: ideas.filter((idea) => idea.categoryId === category.id).length,
  }));

  const totalIdeas = ideas.length;
  const activeSubmitters = new Set(ideas.map((idea) => idea.authorId)).size;

  return (
    <div className="flex h-full flex-col text-white">
      {/* Header with Timer */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold">{session.name}</h1>
          <p className="mt-2 text-2xl text-zinc-400">
            Share your ideas anonymously
          </p>
        </div>

        {/* Timer */}
        {timeRemaining && (
          <div
            className={`rounded-2xl px-8 py-4 text-center ${
              isExpired ?
                "bg-red-500/20 text-red-400"
              : "bg-blue-500/20 text-blue-400"
            }`}>
            <div className="text-lg font-semibold">
              {isExpired ? "Time's up!" : "Time remaining"}
            </div>
            <div className="mt-1 text-4xl font-bold">{timeRemaining}</div>
          </div>
        )}

        {!timeRemaining && !submissionsEnabled && (
          <div className="rounded-2xl bg-amber-500/20 px-8 py-4 text-center text-amber-400">
            <div className="text-lg font-semibold">Submissions Closed</div>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
          <div className="text-5xl font-bold">{totalIdeas}</div>
          <div className="mt-2 text-xl text-zinc-400">
            {totalIdeas === 1 ? "idea" : "ideas"} submitted
          </div>
        </div>

        <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
          <div className="text-5xl font-bold">{activeSubmitters}</div>
          <div className="mt-2 text-xl text-zinc-400">
            {activeSubmitters === 1 ? "person" : "people"} contributing
          </div>
        </div>

        <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
          <div className="text-5xl font-bold">{userCount}</div>
          <div className="mt-2 text-xl text-zinc-400">
            {userCount === 1 ? "participant" : "participants"} present
          </div>
        </div>
      </div>

      {/* Category Progress */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {categoryStats.map((category) => (
          <div
            key={category.id}
            className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
            style={{ borderLeft: `4px solid ${category.color}` }}>
            <div className="text-xl font-semibold">{category.name}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{category.count}</span>
              <span className="text-lg text-zinc-400">
                {category.count === 1 ? "idea" : "ideas"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Ideas Display - Anonymous Blocks */}
      <div className="flex-1 overflow-hidden">
        <h2 className="mb-4 text-2xl font-semibold text-zinc-400">
          Ideas appearing...
        </h2>
        <div className="grid h-full grid-cols-4 gap-4 overflow-y-auto pr-4 lg:grid-cols-6">
          <AnimatePresence>
            {ideas.map((idea) => {
              const category = session.categories.find(
                (c) => c.id === idea.categoryId,
              );
              return (
                <motion.div
                  key={idea.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="aspect-square rounded-xl p-4"
                  style={{
                    backgroundColor: category?.color ?? "#666",
                    opacity: 0.8,
                  }}>
                  {/* Just show colored block - content hidden until reveal */}
                  <div className="flex h-full items-center justify-center">
                    <div className="text-6xl">💡</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom instruction */}
      <div className="mt-8 text-center text-xl text-zinc-500">
        Ideas will be revealed in the next stage
      </div>
    </div>
  );
}
