"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/actions/session";
import type { CreateMagicSessionInput } from "@/lib/types/session";
import { useAuth } from "@/lib/contexts/auth-context";

const DEFAULT_CATEGORIES = [
  { name: "What went well", color: "#10b981" },
  { name: "What could be improved", color: "#f59e0b" },
  { name: "Action items", color: "#3b82f6" },
];

const COLOR_OPTIONS = [
  "#ef4444", // red
  "#f59e0b", // orange
  "#eab308", // yellow
  "#10b981", // green
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
];

export default function CreateSessionForm() {
  const router = useRouter();
  const { userId, user, isLoading, signIn } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<
    "public" | "private" | "protected"
  >("public");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [error, setError] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (categories.length >= 10) {
      setError("Maximum 10 categories allowed");
      return;
    }
    setCategories([
      ...categories,
      {
        name: "",
        color: COLOR_OPTIONS[categories.length % COLOR_OPTIONS.length],
      },
    ]);
  };

  const handleRemoveCategory = (index: number) => {
    if (categories.length <= 1) {
      setError("At least one category is required");
      return;
    }
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (
    index: number,
    field: "name" | "color",
    value: string,
  ) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setCategories(newCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("You must be signed in to create a session");
      return;
    }

    if (!name.trim()) {
      setError("Session name is required");
      return;
    }

    const emptyCategories = categories.filter((cat) => !cat.name.trim());
    if (emptyCategories.length > 0) {
      setError("All categories must have a name");
      return;
    }

    const input: CreateMagicSessionInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      visibility,
      categories: categories.map((cat) => ({
        name: cat.name.trim(),
        color: cat.color,
      })),
    };

    startTransition(async () => {
      try {
        const result = await createSession(input, userId);
        router.push(`/session/${result.sessionId}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create session",
        );
      }
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sign In Required
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          You must be signed in to create a session.
        </p>
        <button
          onClick={async () => {
            try {
              await signIn();
            } catch {
              setError("Failed to sign in");
            }
          }}
          type="button"
          className="mt-6 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Basic Information
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Session Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              placeholder="e.g., Sprint 23 Retrospective"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              placeholder="Brief description of this session..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Visibility
            </label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="public"
                  checked={visibility === "public"}
                  onChange={(e) =>
                    setVisibility(
                      e.target.value as "public" | "private" | "protected",
                    )
                  }
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Public - Anyone can join
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="private"
                  checked={visibility === "private"}
                  onChange={(e) =>
                    setVisibility(
                      e.target.value as "public" | "private" | "protected",
                    )
                  }
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Private - Hidden but accessible with link
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="protected"
                  checked={visibility === "protected"}
                  onChange={(e) =>
                    setVisibility(
                      e.target.value as "public" | "private" | "protected",
                    )
                  }
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Protected - Invitation required
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Categories ({categories.length}/10)
          </h2>
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={categories.length >= 10}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            Add Category
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="color"
                value={category.color}
                onChange={(e) =>
                  handleCategoryChange(index, "color", e.target.value)
                }
                className="h-10 w-10 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
              />
              <input
                type="text"
                value={category.name}
                onChange={(e) =>
                  handleCategoryChange(index, "name", e.target.value)
                }
                className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
                placeholder="Category name"
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveCategory(index)}
                disabled={categories.length <= 1}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? "Creating..." : "Create Session"}
        </button>
      </div>
    </form>
  );
}
