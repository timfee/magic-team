"use client";

import { IdeaCard } from "@/components/idea-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CommentThread } from "@/components/session/comment-thread";
import { getCommentsWithDetails } from "@/lib/actions/comments";
import type { CommentWithDetails, IdeaWithDetails } from "@/lib/types/session";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

interface IdeaCardWithCommentsProps {
  idea: IdeaWithDetails;
  categoryColor: string;
  sessionId: string;
  currentUserId: string | null;
  isAdmin?: boolean;
  draggable?: boolean;
  isOverlay?: boolean;
  isDraggedOver?: boolean;
  dropIndicator?: "create-group" | "join-group" | "move-to-group" | null;
  showVotes?: boolean;
  showComments?: boolean;
}

export const IdeaCardWithComments = ({
  idea,
  categoryColor,
  sessionId,
  currentUserId,
  isAdmin,
  draggable = false,
  isOverlay = false,
  isDraggedOver = false,
  dropIndicator = null,
  showVotes = true,
  showComments = true,
}: IdeaCardWithCommentsProps) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [commentCount, setCommentCount] = useState(idea._count?.comments ?? 0);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time comment count listener
  useEffect(() => {
    if (!showComments) return;

    const commentsQuery = query(
      collection(db, "sessions", sessionId, "comments"),
      where("ideaId", "==", idea.id),
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      setCommentCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [sessionId, idea.id, showComments]);

  // Load full comment details when dialog opens
  useEffect(() => {
    if (!isCommentsOpen) return;

    const loadComments = async () => {
      setIsLoading(true);
      try {
        const fetchedComments = await getCommentsWithDetails(
          sessionId,
          idea.id,
        );
        setComments(fetchedComments);
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadComments();

    // Real-time updates for comments
    const commentsQuery = query(
      collection(db, "sessions", sessionId, "comments"),
      where("ideaId", "==", idea.id),
    );

    const unsubscribe = onSnapshot(commentsQuery, () => {
      void loadComments(); // Reload when comments change
    });

    return () => unsubscribe();
  }, [isCommentsOpen, sessionId, idea.id]);

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!draggable || !isOverlay) {
      // Don't open during drag
      setIsCommentsOpen(true);
    }
  };

  return (
    <>
      <div className="relative">
        <IdeaCard
          idea={idea}
          categoryColor={categoryColor}
          draggable={draggable}
          isOverlay={isOverlay}
          isDraggedOver={isDraggedOver}
          dropIndicator={dropIndicator}
          showVotes={showVotes}
        />

        {/* Comment Button Overlay */}
        {showComments && !isOverlay && !draggable && (
          <button
            onClick={handleCommentClick}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-zinc-600 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
            data-testid="comment-button">
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
            <span className="font-medium">{commentCount}</span>
          </button>
        )}
      </div>

      {/* Comments Dialog */}
      {showComments && (
        <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <DialogContent
            title={`Comments on Idea`}
            onClose={() => setIsCommentsOpen(false)}>
            <div className="space-y-4">
              {/* Idea Preview */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <p className="text-sm text-zinc-900 dark:text-zinc-50">
                  {idea.content}
                </p>
                {!idea.isAnonymous && idea.author && (
                  <p className="mt-2 text-xs text-zinc-500">
                    by <span className="font-medium">{idea.author.name}</span>
                  </p>
                )}
              </div>

              {/* Comments */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-800 dark:border-t-blue-400" />
                </div>
              ) : (
                <CommentThread
                  sessionId={sessionId}
                  ideaId={idea.id}
                  comments={comments}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onCommentAdded={async () => {
                    // Refresh will happen via real-time listener
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
