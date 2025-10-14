"use client";

import { Button } from "@/components/ui/button";
import {
  createComment,
  deleteComment,
  updateComment,
} from "@/lib/actions/comments";
import type { CommentWithDetails } from "@/lib/types/session";
import { formatDistanceToNow } from "date-fns";
import { useState, useTransition } from "react";

interface CommentThreadProps {
  sessionId: string;
  ideaId?: string;
  groupId?: string;
  comments: CommentWithDetails[];
  currentUserId: string | null;
  isAdmin?: boolean;
  onCommentAdded?: () => void;
}

interface SingleCommentProps {
  comment: CommentWithDetails;
  sessionId: string;
  currentUserId: string | null;
  isAdmin?: boolean;
  onReply: (commentId: string, userName: string | null) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => Promise<void>;
  depth?: number;
}

const MAX_DEPTH = 3; // Limit nesting depth

const SingleComment = ({
  comment,
  sessionId,
  currentUserId,
  isAdmin,
  onReply,
  onDelete,
  onEdit,
  depth = 0,
}: SingleCommentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isPending, startTransition] = useTransition();

  const canEdit = currentUserId === comment.userId;
  const canDelete = isAdmin ?? currentUserId === comment.userId;

  const handleEdit = () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    startTransition(() => {
      void onEdit(comment.id, editContent.trim())
        .then(() => setIsEditing(false))
        .catch((error: unknown) => {
          console.error("Failed to edit comment:", error);
        });
    });
  };

  return (
    <div
      className={`flex gap-3 ${depth > 0 ? "ml-8 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800" : ""}`}
      data-testid="comment">
      {/* User Avatar */}
      <div className="flex-shrink-0">
        {comment.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.user.image}
            alt={comment.user.name ?? "User"}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium">
            {(comment.user.name ?? "U").charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">
            {comment.user.name ?? "Unknown User"}
          </span>
          <span className="text-xs text-zinc-500">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
          </span>
          {comment.updatedAt.getTime() - comment.createdAt.getTime() > 1000 && (
            <span className="text-xs text-zinc-400 italic">(edited)</span>
          )}
        </div>

        {/* Reply-to indicator */}
        {comment.replyTo && (
          <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 rounded px-2 py-1 inline-block">
            Replying to{" "}
            <span className="font-medium">{comment.replyTo.user.name}</span>
          </div>
        )}

        {/* Content or edit form */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              rows={2}
              disabled={isPending}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={isPending || !editContent.trim()}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isPending}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-3 text-xs">
            {depth < MAX_DEPTH && (
              <button
                onClick={() => onReply(comment.id, comment.user.name)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                data-testid="reply-button">
                Reply
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-zinc-600 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                data-testid="edit-button">
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                data-testid="delete-button">
                Delete
              </button>
            )}
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <SingleComment
                key={reply.id}
                comment={reply}
                sessionId={sessionId}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onReply={onReply}
                onDelete={onDelete}
                onEdit={onEdit}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CommentThread = ({
  sessionId,
  ideaId,
  groupId,
  comments,
  currentUserId,
  isAdmin,
  onCommentAdded,
}: CommentThreadProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    userName: string | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !currentUserId) return;

    startTransition(async () => {
      try {
        // Build comment input based on discriminated union
        const baseInput = {
          sessionId,
          content: newComment.trim(),
          ...(replyingTo && { replyToId: replyingTo.id }),
        };

        const commentInput = ideaId
          ? { ...baseInput, ideaId }
          : { ...baseInput, groupId: groupId! };

        await createComment(commentInput, currentUserId);

        setNewComment("");
        setReplyingTo(null);
        onCommentAdded?.();
      } catch (error) {
        console.error("Failed to post comment:", error);
      }
    });
  };

  const handleReply = (commentId: string, userName: string | null) => {
    setReplyingTo({ id: commentId, userName });
    // Focus on input (could use ref for better UX)
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;

    startTransition(async () => {
      try {
        await deleteComment(commentId, sessionId);
        onCommentAdded?.(); // Refresh comments
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    });
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await updateComment(commentId, sessionId, content);
      onCommentAdded?.(); // Refresh comments
    } catch (error) {
      console.error("Failed to update comment:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-4" data-testid="comment-thread">
      {/* Comment Input */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-2">
          {replyingTo && (
            <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-sm dark:bg-blue-950/30">
              <span className="text-blue-700 dark:text-blue-300">
                Replying to{" "}
                <span className="font-medium">{replyingTo.userName}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Cancel
              </button>
            </div>
          )}

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-400"
            rows={3}
            disabled={isPending}
            data-testid="comment-input"
          />

          <Button
            type="submit"
            size="sm"
            disabled={isPending || !newComment.trim()}
            data-testid="post-comment-button">
            {isPending
              ? "Posting..."
              : replyingTo
                ? "Post Reply"
                : "Post Comment"}
          </Button>
        </form>
      )}

      {!currentUserId && (
        <div className="rounded-md bg-zinc-100 p-4 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          Sign in to comment
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="rounded-md border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <SingleComment
              key={comment.id}
              comment={comment}
              sessionId={sessionId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReply={handleReply}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};
