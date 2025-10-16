"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  createCategory,
  deleteCategory,
  getSessionCategories,
  updateCategory,
} from "@/lib/actions/categories";
import { updateSession } from "@/lib/actions/session";
import {
  getSessionSettings,
  updateSessionSettings,
} from "@/lib/actions/settings";
import { useSession } from "@/lib/contexts/firebase-session-context";
import type {
  Category,
  CreateCategoryInput,
  SessionSettings,
  UpdateMagicSessionInput,
} from "@/lib/types/session";
import { announce } from "@/lib/utils/a11y";
import { cn } from "@/lib/utils/cn";
import { useEffect, useState, useTransition } from "react";

interface SessionConfigProps {
  sessionId: string;
}

export const SessionConfig = ({ sessionId }: SessionConfigProps) => {
  const { session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<
    "general" | "categories" | "settings"
  >("general");
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load settings and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, categoriesData] = await Promise.all([
          getSessionSettings(sessionId),
          getSessionCategories(sessionId),
        ]);
        setSettings(settingsData);
        setCategories(categoriesData.sort((a, b) => a.order - b.order));
      } catch (err) {
        console.error("Error loading session config data:", err);
        setError("Failed to load session configuration");
      }
    };

    loadData();
  }, [sessionId]);

  const showMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccess(message);
      setError(null);
      announce(message, "polite");
    } else {
      setError(message);
      setSuccess(null);
      announce(message, "assertive");
    }

    // Clear messages after 5 seconds
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 5000);
  };

  const handleUpdateSession = async (updates: UpdateMagicSessionInput) => {
    startTransition(async () => {
      try {
        await updateSession(sessionId, updates);
        showMessage("Session updated successfully", "success");
      } catch (err) {
        console.error("Error updating session:", err);
        showMessage("Failed to update session", "error");
      }
    });
  };

  const handleUpdateSettings = async (updates: Partial<SessionSettings>) => {
    startTransition(async () => {
      try {
        await updateSessionSettings(sessionId, updates);
        setSettings((prev) => (prev ? { ...prev, ...updates } : null));
        showMessage("Settings updated successfully", "success");
      } catch (err) {
        console.error("Error updating settings:", err);
        showMessage("Failed to update settings", "error");
      }
    });
  };

  const handleAddCategory = async () => {
    const name = prompt("Enter category name:");
    if (!name?.trim()) return;

    const color = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
    const order = categories.length;

    startTransition(async () => {
      try {
        const input: CreateCategoryInput = {
          sessionId,
          name: name.trim(),
          color,
          order,
        };

        const result = await createCategory(input);
        const newCategory: Category = {
          id: result.categoryId,
          sessionId,
          name: name.trim(),
          color,
          order,
        };

        setCategories((prev) => [...prev, newCategory]);
        showMessage("Category added successfully", "success");
      } catch (err) {
        console.error("Error adding category:", err);
        showMessage("Failed to add category", "error");
      }
    });
  };

  const handleUpdateCategory = async (
    categoryId: string,
    updates: Partial<Category>,
  ) => {
    startTransition(async () => {
      try {
        await updateCategory(sessionId, categoryId, updates);
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === categoryId ? { ...cat, ...updates } : cat,
          ),
        );
        showMessage("Category updated successfully", "success");
      } catch (err) {
        console.error("Error updating category:", err);
        showMessage("Failed to update category", "error");
      }
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCategory(sessionId, categoryId);
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
        showMessage("Category deleted successfully", "success");
      } catch (err) {
        console.error("Error deleting category:", err);
        showMessage("Failed to delete category", "error");
      }
    });
  };

  if (!session) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-6 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Session Configuration
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage session settings, categories, and behavior
        </p>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              {success}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex space-x-8 px-6">
          {[
            { id: "general", label: "General" },
            { id: "categories", label: "Categories" },
            { id: "settings", label: "Behavior" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "border-b-2 py-4 text-sm font-medium transition-colors",
                activeTab === tab.id ?
                  "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
              )}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                defaultValue={session.name}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const newName = e.target.value.trim();
                  if (newName && newName !== session.name) {
                    handleUpdateSession({ name: newName });
                  }
                }}
                disabled={isPending}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="session-description">Description</Label>
              <textarea
                id="session-description"
                defaultValue={session.description || ""}
                onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                  const newDescription = e.target.value.trim();
                  if (newDescription !== session.description) {
                    handleUpdateSession({
                      description: newDescription || undefined,
                    });
                  }
                }}
                disabled={isPending}
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-400"
              />
            </div>

            <div>
              <Label htmlFor="session-visibility">Visibility</Label>
              <select
                id="session-visibility"
                defaultValue={session.visibility}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const visibility = e.target.value as
                    | "public"
                    | "private"
                    | "protected";
                  handleUpdateSession({ visibility });
                }}
                disabled={isPending}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Invite only</option>
                <option value="protected">Protected - Link required</option>
              </select>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                Session Categories
              </h3>
              <Button
                onClick={handleAddCategory}
                disabled={isPending}
                size="sm">
                Add Category
              </Button>
            </div>

            {categories.length === 0 ?
              <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No categories found. Add your first category to get started.
                </p>
              </div>
            : <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <Input
                        defaultValue={category.name}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          const newName = e.target.value.trim();
                          if (newName && newName !== category.name) {
                            handleUpdateCategory(category.id, {
                              name: newName,
                            });
                          }
                        }}
                        disabled={isPending}
                        className="border-none bg-transparent p-0 text-sm font-medium focus:ring-0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={category.color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          handleUpdateCategory(category.id, {
                            color: e.target.value,
                          });
                        }}
                        disabled={isPending}
                        className="h-8 w-8 rounded border border-zinc-300 dark:border-zinc-700"
                      />
                      <Button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950">
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && settings && (
          <div className="space-y-8">
            {/* Ideas Section */}
            <div>
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                Idea Collection
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-anonymous">
                      Allow Anonymous Ideas
                    </Label>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Let participants submit ideas without showing their name
                    </p>
                  </div>
                  <Switch
                    id="allow-anonymous"
                    checked={settings.allowAnonymousIdeas}
                    onCheckedChange={(checked: boolean) =>
                      handleUpdateSettings({ allowAnonymousIdeas: checked })
                    }
                    disabled={isPending}
                  />
                </div>

                <div>
                  <Label htmlFor="max-ideas">Max Ideas Per Person</Label>
                  <Input
                    id="max-ideas"
                    type="number"
                    min="1"
                    value={settings.maxIdeasPerPerson || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      handleUpdateSettings({
                        maxIdeasPerPerson: value ? parseInt(value) : undefined,
                      });
                    }}
                    placeholder="No limit"
                    disabled={isPending}
                    className="mt-1 w-32"
                  />
                </div>
              </div>
            </div>

            {/* Voting Section */}
            <div>
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                Voting
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-voting">Enable Voting</Label>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Allow participants to vote on ideas and groups
                    </p>
                  </div>
                  <Switch
                    id="allow-voting"
                    checked={settings.allowVoting}
                    onCheckedChange={(checked: boolean) =>
                      handleUpdateSettings({ allowVoting: checked })
                    }
                    disabled={isPending}
                  />
                </div>

                {settings.allowVoting && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="votes-per-user">Votes Per User</Label>
                        <Input
                          id="votes-per-user"
                          type="number"
                          min="1"
                          value={settings.votesPerUser || ""}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            const value = e.target.value;
                            handleUpdateSettings({
                              votesPerUser: value ? parseInt(value) : undefined,
                            });
                          }}
                          placeholder="No limit"
                          disabled={isPending}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-votes-per-idea">
                          Max Votes Per Idea
                        </Label>
                        <Input
                          id="max-votes-per-idea"
                          type="number"
                          min="1"
                          value={settings.maxVotesPerIdea || ""}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            const value = e.target.value;
                            handleUpdateSettings({
                              maxVotesPerIdea:
                                value ? parseInt(value) : undefined,
                            });
                          }}
                          placeholder="No limit"
                          disabled={isPending}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allow-voting-ideas">
                          Allow Voting on Ideas
                        </Label>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Participants can vote on individual ideas
                        </p>
                      </div>
                      <Switch
                        id="allow-voting-ideas"
                        checked={settings.allowVotingOnIdeas}
                        onCheckedChange={(checked: boolean) =>
                          handleUpdateSettings({ allowVotingOnIdeas: checked })
                        }
                        disabled={isPending}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allow-voting-groups">
                          Allow Voting on Groups
                        </Label>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Participants can vote on entire groups of ideas
                        </p>
                      </div>
                      <Switch
                        id="allow-voting-groups"
                        checked={settings.allowVotingOnGroups}
                        onCheckedChange={(checked: boolean) =>
                          handleUpdateSettings({ allowVotingOnGroups: checked })
                        }
                        disabled={isPending}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                Comments & Discussion
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-comments">Allow Comments</Label>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Let participants comment on ideas and groups
                    </p>
                  </div>
                  <Switch
                    id="allow-comments"
                    checked={settings.allowComments}
                    onCheckedChange={(checked: boolean) =>
                      handleUpdateSettings({ allowComments: checked })
                    }
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Section */}
            <div>
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                Advanced
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-group">Auto-group Similar Ideas</Label>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Automatically group ideas with similar content
                    </p>
                  </div>
                  <Switch
                    id="auto-group"
                    checked={settings.autoGroupSimilarIdeas}
                    onCheckedChange={(checked: boolean) =>
                      handleUpdateSettings({ autoGroupSimilarIdeas: checked })
                    }
                    disabled={isPending}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-timer">Enable Timer</Label>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Show countdown timer for stages
                    </p>
                  </div>
                  <Switch
                    id="enable-timer"
                    checked={settings.enableTimer}
                    onCheckedChange={(checked: boolean) =>
                      handleUpdateSettings({ enableTimer: checked })
                    }
                    disabled={isPending}
                  />
                </div>

                {settings.enableTimer && (
                  <div>
                    <Label htmlFor="timer-duration">
                      Timer Duration (minutes)
                    </Label>
                    <Input
                      id="timer-duration"
                      type="number"
                      min="1"
                      value={
                        settings.timerDuration ?
                          Math.floor(settings.timerDuration / 60)
                        : ""
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        handleUpdateSettings({
                          timerDuration:
                            value ? parseInt(value) * 60 : undefined,
                        });
                      }}
                      placeholder="15"
                      disabled={isPending}
                      className="mt-1 w-32"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
