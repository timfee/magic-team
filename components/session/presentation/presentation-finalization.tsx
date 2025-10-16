"use client";

import type {
  MagicSessionWithDetails,
  Idea,
  IdeaGroup,
} from "@/lib/types/session";
import { useEffect, useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import { PresentationControls } from "./presentation-controls";

// Auto-advance duration in seconds (configurable)
const AUTO_ADVANCE_DURATION_SECONDS = 8;

interface PresentationFinalizationProps {
  session: MagicSessionWithDetails;
  ideas: Idea[];
  groups: IdeaGroup[];
}

interface ItemWithVotes {
  id: string;
  type: "idea" | "group";
  content: string;
  title?: string;
  voteCount: number;
  categoryId: string;
  ideas?: Idea[];
}

export function PresentationFinalization({
  session,
  ideas,
  groups,
}: PresentationFinalizationProps) {
  const [itemsWithVotes, setItemsWithVotes] = useState<ItemWithVotes[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch vote counts and build sorted list
  useEffect(() => {
    const fetchVotesAndSort = async () => {
      const votesRef = collection(db, "sessions", session.id, "votes");
      const votesQuery = query(votesRef);
      const votesSnapshot = await getDocs(votesQuery);

      const voteCounts: Record<string, number> = {};
      votesSnapshot.forEach((doc) => {
        const vote = doc.data();
        let key: string | undefined;
        if (typeof vote.ideaId === "string") {
          key = vote.ideaId;
        } else if (typeof vote.groupId === "string") {
          key = vote.groupId;
        }
        if (key) {
          voteCounts[key] = (voteCounts[key] ?? 0) + 1;
        }
      });

      // Build items array
      const items: ItemWithVotes[] = [];

      // Add ideas
      ideas
        .filter((idea) => !idea.groupId) // Only ungrouped ideas
        .forEach((idea) => {
          items.push({
            id: idea.id,
            type: "idea",
            content: idea.content,
            voteCount: voteCounts[idea.id] ?? 0,
            categoryId: idea.categoryId,
          });
        });

      // Add groups
      groups.forEach((group) => {
        const groupIdeas = ideas.filter((idea) => idea.groupId === group.id);
        items.push({
          id: group.id,
          type: "group",
          content: groupIdeas.map((i) => i.content).join(" • "),
          title: group.title ?? "Untitled Group",
          voteCount: voteCounts[group.id] ?? 0,
          categoryId: group.categoryId,
          ideas: groupIdeas,
        });
      });

      // Sort by vote count (highest first)
      items.sort((a, b) => b.voteCount - a.voteCount);

      setItemsWithVotes(items);
    };

    void fetchVotesAndSort();
  }, [session.id, ideas, groups, session.categories]);

  // Auto-advance through items (only when not paused)
  useEffect(() => {
    if (itemsWithVotes.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setShowDetails(false);
      setTimeout(() => {
        setCurrentIndex((prev) =>
          prev >= itemsWithVotes.length - 1 ? 0 : prev + 1,
        );
        setShowDetails(true);
      }, 500);
    }, AUTO_ADVANCE_DURATION_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [itemsWithVotes.length, isPaused]);

  useEffect(() => {
    // Show details after a brief delay when index changes
    const timeout = setTimeout(() => setShowDetails(true), 500);
    return () => clearTimeout(timeout);
  }, [currentIndex]);

  const handlePrevious = () => {
    setShowDetails(false);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev === 0 ? itemsWithVotes.length - 1 : prev - 1,
      );
      setShowDetails(true);
    }, 200);
  };

  const handleNext = () => {
    setShowDetails(false);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev >= itemsWithVotes.length - 1 ? 0 : prev + 1,
      );
      setShowDetails(true);
    }, 200);
  };

  const handlePauseToggle = () => {
    setIsPaused((prev) => !prev);
  };

  if (itemsWithVotes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-5xl font-bold">{session.name}</h1>
          <p className="mt-4 text-2xl text-zinc-400">No items to review yet</p>
        </div>
      </div>
    );
  }

  const currentItem = itemsWithVotes[currentIndex];
  const category = session.categories.find(
    (c) => c.id === currentItem.categoryId,
  );

  return (
    <div className="flex h-full flex-col text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold">{session.name}</h1>
          <p className="mt-2 text-2xl text-zinc-400">Top Ideas & Groups</p>
        </div>

        {/* Progress Indicator */}
        <div className="text-2xl font-semibold text-zinc-400">
          {currentIndex + 1} / {itemsWithVotes.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-5xl">
            {/* Vote Count Badge */}
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-12 py-6">
                <div className="text-center">
                  <div className="text-6xl font-bold">
                    {currentItem.voteCount}
                  </div>
                  <div className="mt-2 text-2xl">
                    {currentItem.voteCount === 1 ? "vote" : "votes"}
                  </div>
                </div>
              </div>
            </div>

            {/* Category & Type Badge */}
            <div className="mb-6 flex justify-center gap-4">
              <span
                className="rounded-full px-6 py-2 text-xl font-semibold"
                style={{ backgroundColor: category?.color ?? "#666" }}>
                {category?.name}
              </span>
              <span className="rounded-full bg-white/20 px-6 py-2 text-xl font-semibold">
                {currentItem.type === "group" ? "Group" : "Individual Idea"}
              </span>
            </div>

            {/* Content */}
            <div className="rounded-3xl bg-white/10 p-12 backdrop-blur-lg">
              {currentItem.type === "group" && currentItem.title && (
                <h2 className="mb-6 text-4xl font-bold">{currentItem.title}</h2>
              )}

              {currentItem.type === "group" && currentItem.ideas ?
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, staggerChildren: 0.1 }}
                      className="space-y-4">
                      {currentItem.ideas.map((idea, idx) => (
                        <motion.div
                          key={idea.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.15 }}
                          className="rounded-xl bg-white/10 p-6">
                          <p className="text-2xl leading-relaxed">
                            {idea.content}
                          </p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              : <p className="text-3xl leading-relaxed">
                  {currentItem.content}
                </p>
              }
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="mt-8 flex justify-center gap-2">
        {itemsWithVotes.slice(0, 10).map((_, idx) => (
          <div
            key={idx}
            className={`h-3 w-3 rounded-full transition-all ${
              idx === currentIndex ? "w-8 bg-blue-500" : "bg-white/20"
            }`}
          />
        ))}
        {itemsWithVotes.length > 10 && (
          <span className="text-zinc-500">+{itemsWithVotes.length - 10}</span>
        )}
      </div>

      {/* Presentation Controls */}
      <PresentationControls
        isFinalizationStage
        onPrevious={handlePrevious}
        onNext={handleNext}
        onPauseToggle={handlePauseToggle}
        isPaused={isPaused}
        currentIndex={currentIndex}
        totalItems={itemsWithVotes.length}
      />
    </div>
  );
}
