"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import type { Category, IdeaWithDetails } from "@/lib/types/session";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { IdeaCard } from "../idea-card";

// Simple client-side idea creation - will be replaced with proper Firebase client SDK
import { db } from "@/lib/firebase/client";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

interface IdeaCollectionProps {
  sessionId: string;
  categories: Category[];
  initialIdeas: IdeaWithDetails[];
  userId: string | null;
}

export const IdeaCollection = ({
  sessionId,
  categories,
  initialIdeas: _initialIdeas,
  userId,
}: IdeaCollectionProps) => {
  const { ideas } = useSession();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id ?? "",
  );
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedCategoryId) return;

    setError(null);

    startTransition(async () => {
      try {
        // Create idea directly in Firebase
        const ideaId = crypto.randomUUID();
        const ideaRef = doc(db, "sessions", sessionId, "ideas", ideaId);
        
        await setDoc(ideaRef, {
          id: ideaId,
          sessionId,
          categoryId: selectedCategoryId,
          content: content.trim(),
          authorId: "anonymous-user",
          isAnonymous,
          groupId: null,
          order: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Reset form - Firebase context will handle real-time updates
        setContent("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create idea");
      }
    });
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const userIdeasInCategory = ideas.filter(
    (idea) =>
      idea.categoryId === selectedCategoryId &&
      (!idea.isAnonymous ? idea.authorId === userId : false),
  );

  const canAddMore =
    !selectedCategory?.maxEntriesPerPerson ||
    userIdeasInCategory.length < selectedCategory.maxEntriesPerPerson;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Submission Form */}
      <div className="lg:col-span-1">
        <div className="sticky top-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Share Your Ideas
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selector */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Category
              </label>
              <select
                id="category"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.maxEntriesPerPerson &&
                      ` (max ${category.maxEntriesPerPerson})`}
                  </option>
                ))}
              </select>
              {selectedCategory?.maxEntriesPerPerson && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {userIdeasInCategory.length} /{" "}
                  {selectedCategory.maxEntriesPerPerson} ideas submitted
                </p>
              )}
            </div>

            {/* Idea Input */}
            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Your Idea
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What would you like to share?"
                rows={4}
                maxLength={500}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {content.length} / 500 characters
              </p>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center">
              <input
                id="anonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
              />
              <label
                htmlFor="anonymous"
                className="ml-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                Submit anonymously
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !content.trim() || !canAddMore}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit Idea"}
            </button>

            {!canAddMore && (
              <p className="text-center text-xs text-red-600 dark:text-red-400">
                Maximum ideas reached for this category
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Ideas Display */}
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            All Ideas
          </h2>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
          </span>
        </div>

        {/* Ideas by Category */}
        {categories.map((category) => {
          const categoryIdeas = ideas.filter(
            (idea) => idea.categoryId === category.id,
          );
          if (categoryIdeas.length === 0) return null;

          return (
            <div key={category.id} className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  {category.name}
                </h3>
                <span className="text-sm text-zinc-500 dark:text-zinc-500">
                  ({categoryIdeas.length})
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {categoryIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    categoryColor={category.color}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {ideas.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                No ideas yet. Be the first to share!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
