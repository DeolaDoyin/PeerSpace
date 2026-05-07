import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";
import type { CommentRow, CommentNode, CommentCreatedPayload, PostCacheRow, User } from "@/types";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggleButton from "@/components/ThemeToggle";
import { getEcho } from "@/lib/echo";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Trash2,
  Flag,
  MoreHorizontal,
  Bookmark,
  EyeOff,
  Bell,
  Minus,
  Plus,
  Pin,
} from "lucide-react";
import LikeButton from "@/components/LikeButton";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function getValidationErrors(
  err: unknown,
): Record<string, string[]> | null {
  if (err && typeof err === "object" && "response" in err) {
    const e = err as {
      response?: {
        status?: number;
        data?: { errors?: Record<string, string[]> };
      };
    };
    if (e?.response?.status === 422 && e.response.data?.errors) {
      return e.response.data.errors;
    }
  }
  return null;
}

const buildCommentTree = (comments: CommentRow[]): CommentNode[] => {
  const map = new Map<number, CommentNode>();
  comments.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  const roots: CommentNode[] = [];
  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};

interface CommentItemProps {
  node: CommentNode;
  depth?: number;
  replyingToCommentId: number | null;
  setReplyingToCommentId: (id: number | null) => void;
  setIsReplyingToPost: (b: boolean) => void;
  commentText: string;
  setCommentText: (s: string) => void;
  handleCommentSubmit: (e: React.FormEvent, parentId: number | null) => void;
  openReportModal: (id: number, type: "post" | "comment") => void;
  canDeleteComment: (c: CommentRow) => boolean;
  handleDeleteComment: (id: number) => void;
  handleStartChat: (id: number, name: string) => void;
  submitting: boolean;
  currentUser: User | undefined;
  commentError: string;
  setCommentError: (s: string) => void;
}

const CommentItem = ({
  node,
  depth = 0,
  replyingToCommentId,
  setReplyingToCommentId,
  setIsReplyingToPost,
  commentText,
  setCommentText,
  handleCommentSubmit,
  openReportModal,
  canDeleteComment,
  handleDeleteComment,
  handleStartChat,
  submitting,
  currentUser,
  commentError,
  setCommentError,
}: CommentItemProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isReplying = replyingToCommentId === node.id;

  return (
    <div className={`flex flex-col ${depth > 0 ? "mt-2" : "mt-4"}`}>
      <div className="flex">
        {/* Thread Line and Collapse toggle */}
        <div className="flex flex-col items-center mr-2 w-6 shrink-0">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary mb-1">
            {node.user?.name?.[0] || "A"}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-muted p-0.5 rounded text-muted-foreground z-10"
            title={isCollapsed ? "Expand comment" : "Collapse comment"}
            aria-pressed={Boolean(isCollapsed)}
            aria-label={isCollapsed ? "Expand comment" : "Collapse comment"}
          >
            {isCollapsed ? <Plus size={14} /> : <Minus size={14} />}
          </button>
          {!isCollapsed && (
            <div className="w-0.5 h-full bg-border mt-1 group-hover:bg-primary/50 transition-colors"></div>
          )}
        </div>

        <div className="flex-1 pb-2 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold text-foreground cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (node.user?.id)
                  handleStartChat(node.user.id, node.user.name);
              }}
            >
              {node.user?.name || "Anonymous"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              •{" "}
              {node.created_at
                ? formatDistanceToNow(new Date(node.created_at)) + " ago"
                : ""}
            </span>
          </div>

          {!isCollapsed ? (
            <>
              <p className="text-sm text-foreground mb-1 whitespace-pre-wrap">
                {node.content}
              </p>

              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <LikeButton
                  itemId={node.id}
                  type="comment"
                  initialCount={node.likes_count ?? 0}
                  initialIsLiked={node.is_liked ?? false}
                />
                <button
                  onClick={() => {
                    setReplyingToCommentId(isReplying ? null : node.id);
                    setIsReplyingToPost(false);
                    setCommentText("");
                  }}
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 hover:bg-muted rounded-full transition-colors"
                >
                  <MessageCircle size={14} /> Reply
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                      aria-label="Comment options"
                      title="Comment options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {currentUser?.role !== "admin" &&
                      currentUser?.role !== "moderator" && (
                        <DropdownMenuItem
                          onClick={() => openReportModal(node.id, "comment")}
                        >
                          <Flag className="h-4 w-4 mr-2" /> Report
                        </DropdownMenuItem>
                      )}
                    {canDeleteComment(node) && (
                      <>
                        {currentUser?.role !== "admin" &&
                          currentUser?.role !== "moderator" && (
                            <DropdownMenuSeparator />
                          )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(node.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isReplying && (
                <div className="mt-3 pr-4">
                  <form
                    onSubmit={(e) => handleCommentSubmit(e, node.id)}
                    className="space-y-2"
                  >
                    <textarea
                      autoFocus
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value);
                        setCommentError("");
                      }}
                      placeholder={`Replying to ${node.user?.name || "Anonymous"}...`}
                      rows={2}
                      className="w-full bg-card border border-border rounded-lg p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    {commentError && (
                      <p className="text-xs text-red-500 mt-1">
                        {commentError}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingToCommentId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submitting || !commentText.trim()}
                        className="rounded-full"
                      >
                        {submitting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Reply"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Nested Replies */}
              {node.replies.length > 0 && (
                <div className="mt-1">
                  {node.replies.map((r) => (
                    <CommentItem
                      key={r.id}
                      node={r}
                      depth={depth + 1}
                      replyingToCommentId={replyingToCommentId}
                      setReplyingToCommentId={setReplyingToCommentId}
                      setIsReplyingToPost={setIsReplyingToPost}
                      commentText={commentText}
                      setCommentText={setCommentText}
                      handleCommentSubmit={handleCommentSubmit}
                      openReportModal={openReportModal}
                      canDeleteComment={canDeleteComment}
                      handleDeleteComment={handleDeleteComment}
                      handleStartChat={handleStartChat}
                      submitting={submitting}
                      currentUser={currentUser}
                      commentError={commentError}
                      setCommentError={setCommentError}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic line-clamp-1 opacity-70">
              Comment collapsed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const PostDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [reportData, setReportData] = useState({
    isOpen: false,
    id: 0,
    type: "post" as "post" | "comment",
    reason: "",
  });
  const [reportError, setReportError] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [isReplyingToPost, setIsReplyingToPost] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(
    null,
  );

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/user");
      return data;
    },
  });

  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data } = await api.get(`/api/posts/${slug}`);
      return data;
    },
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["post-comments", post?.id],
    queryFn: async () => {
      const { data } = await api.get(`/api/posts/${post!.id}/comments`);
      return Array.isArray(data) ? data : data.data;
    },
    enabled: !!post?.id,
  });

  const commentTree = useMemo(
    () => buildCommentTree(comments as CommentRow[]),
    [comments],
  );

  useEffect(() => {
    const postId = post?.id;
    const slugKey = slug;
    if (!postId || !slugKey || !user?.id) {
      return;
    }

    const echo = getEcho();
    if (!echo) {
      return;
    }

    const room = `post.${postId}`;
    const channel = echo.join(room);

    channel.listen(".comment.created", (payload: CommentCreatedPayload) => {
      const row = payload.comment;
      const next: CommentRow = {
        id: row.id,
        content: row.content,
        user_id: row.user.id,
        parent_id: row.parent_id,
        user: row.user,
        created_at: row.created_at,
        likes_count: 0,
        is_liked: false,
      };

      queryClient.setQueryData<CommentRow[]>(
        ["post-comments", postId],
        (prev) => {
          const list = prev ?? [];
          if (list.some((c) => c.id === next.id)) {
            return list;
          }
          return [...list, next];
        },
      );

      queryClient.setQueryData<PostCacheRow>(["post", slugKey], (prev) =>
        prev
          ? {
              ...prev,
              comments_count: (prev.comments_count ?? 0) + 1,
            }
          : prev,
      );

      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      echo.leave(room);
    };
  }, [post?.id, slug, user?.id, queryClient]);

  const handleCommentSubmit = async (e: React.FormEvent, parentId: number | null = null) => {
    e.preventDefault();
    
    if (!comment.trim() || !post?.id) return;

    setSubmitting(true);
    setCommentError("");
    try {
      await api.post(`/api/posts/${post.id}/comments`, {
        content: comment,
        parent_id: parentId,
      });

      setComment("");
      setIsReplyingToPost(false);
      setReplyingToCommentId(null);
      
      await queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
      await queryClient.invalidateQueries({ queryKey: ["post", slug] });
    } catch (err) {
      const validation = getValidationErrors(err);
      if (validation) {
        const first = Object.values(validation)[0];
        setCommentError(Array.isArray(first) ? String(first[0]) : String(first));
      } else {
        const msg = extractErrorMessage(err) || "Failed to post comment";
        setCommentError(msg);
        notify.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!post?.id) return;
    try {
      await api.delete(`/api/comments/${commentId}`);
      await queryClient.invalidateQueries({
        queryKey: ["post-comments", post.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["post", slug] });
    } catch (err) {
      const msg =
        extractErrorMessage(err) || "Failed to delete comment. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const openReportModal = (id: number, type: "post" | "comment") => {
    setReportData({ isOpen: true, id, type, reason: "" });
  };

  const submitReport = async () => {
    if (!reportData.reason.trim()) return;
    setReportError("");
    setReportSubmitting(true);
    try {
      await api.post("/api/reports", {
        reportable_id: reportData.id,
        reportable_type: reportData.type,
        reason: reportData.reason,
      });
      setReportData({ isOpen: false, id: 0, type: "post", reason: "" });
      notify.success("Report submitted");
    } catch (err) {
      const validation = getValidationErrors(err);
      if (validation) {
        const first = Object.values(validation)[0];
        setReportError(Array.isArray(first) ? String(first[0]) : String(first));
      } else {
        const msg = extractErrorMessage(err) || "Failed to submit report";
        setReportError(msg);
        try { notify.error(msg); } catch {}
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  const canDeleteComment = (c: CommentRow) => {
    if (!user?.id) return false;
    if (c.user_id === user.id) return true;
    if (user.role === "admin" || user.role === "moderator") return true;
    return false;
  };

  const handleFollow = async () => {
    try {
      await api.post(`/api/posts/${post?.id}/follow`);
      refetch();
    } catch (err) {
      const msg =
        extractErrorMessage(err) || "Failed to follow post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handleSave = async () => {
    try {
      await api.post(`/api/posts/${post?.id}/save`);
      refetch();
    } catch (err) {
      const msg =
        extractErrorMessage(err) || "Failed to save post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handleHide = async () => {
    try {
      await api.post(`/api/posts/${post?.id}/hide`);
      navigate(-1);
    } catch (err) {
      const msg =
        extractErrorMessage(err) || "Failed to hide post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handlePin = async () => {
    try {
      await api.patch(`/api/posts/${post?.id}/pin`);
      refetch();
    } catch (err) {
      const msg =
        extractErrorMessage(err) || "Failed to pin/unpin post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handleDeletePost = async () => {
    try {
      await api.delete(`/api/posts/${post?.id}`);
      navigate("/");
    } catch (err) {
      const msg =
        extractErrorMessage(err) || "Failed to delete post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  if (error || !post)
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load post.{" "}
        <button type="button" onClick={() => refetch()} className="underline">
          Retry
        </button>
      </div>
    );

  const handleStartChat = async (userId: number, peerName: string) => {
    if (!user || user.id === userId) return;
    try {
      const { data } = await api.post("/api/chats", { user_id: userId });
      navigate(`/chat/${data.id}`, { state: { peerName } });
    } catch (err) {
      const msg =
        extractErrorMessage(err) || "Could not start chat. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Back Button positioned like the Menu button in Chats */}
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <h1 className="text-xl font-bold text-foreground">Post</h1>
          </div>

          <div className="flex items-center gap-1">
            {/* Keeping consistent global tools */}
            <div className="flex items-center gap-2 ml-2">
              <ThemeToggleButton />
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* Main Post Area - Borderless integration */}
        <div className="p-4 bg-background">
          {/* Post Header: Avatar, Meta, Dropdown */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {post.creator?.name?.[0] || "A"}
              </div>
              <div
                className="flex flex-col cursor-pointer group"
                onClick={() => {
                  if (post.creator?.id)
                    handleStartChat(
                      post.creator.id,
                      post.creator.name || "Peer",
                    );
                }}
              >
                <span className="text-sm font-semibold text-foreground group-hover:underline">
                  {post.creator?.name || "Anonymous"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {post.created_at
                    ? formatDistanceToNow(new Date(post.created_at)) + " ago"
                    : "Recently"}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground focus:outline-none"
                  aria-label="Post options"
                  title="Post options"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleFollow}>
                  <Bell className="h-4 w-4 mr-2" />
                  <span>
                    {post.is_followed ? "Unfollow Post" : "Follow Post"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSave}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  <span>{post.is_saved ? "Unsave" : "Save"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleHide}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  <span>Hide</span>
                </DropdownMenuItem>

                {user?.role !== "admin" && user?.role !== "moderator" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => openReportModal(post.id, "post")}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      <span>Report</span>
                    </DropdownMenuItem>
                  </>
                )}

                {(user?.role === "admin" || user?.role === "moderator") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handlePin}>
                      <Pin className="h-4 w-4 mr-2" />
                      <span>{post.is_pinned ? "Unpin" : "Pin"}</span>
                    </DropdownMenuItem>
                  </>
                )}
                {(user?.role === "admin" ||
                  user?.role === "moderator" ||
                  user?.id === post?.creator?.id) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-xs sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the post and all associated comments safely.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeletePost}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post Title & Body */}
          <h2 className="text-xl font-bold text-foreground mb-3">
            {Boolean(post.is_pinned) && "📌 "}
            {post.title}
          </h2>
          <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed mb-4">
            {post.body}
          </p>

          {/* Post Actions Row */}
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            {/* Pill layouts for actions */}
            <div className="flex items-center rounded-full bg-muted/50">
              <LikeButton
                itemId={post.id}
                type="post"
                initialCount={post.likes_count ?? 0}
                initialIsLiked={post.is_liked ?? false}
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium">
              <MessageCircle className="h-4 w-4" /> {post.comments_count ?? 0}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-2 w-full bg-muted/30"></div>

        {/* Comments Section */}
        <div className="p-4">
          {/* Join Conversation Input */}
          <div className="mb-6">
            {!isReplyingToPost ? (
              <div
                onClick={() => {
                  setIsReplyingToPost(true);
                  setReplyingToCommentId(null);
                }}
                className="w-full bg-muted/30 border border-border rounded-full py-2.5 px-4 text-sm text-muted-foreground cursor-text hover:border-primary/50 transition-colors flex items-center justify-between"
              >
                <span>Join the conversation</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => handleCommentSubmit(e, null)}
                className="space-y-3 bg-muted/10 p-3 rounded-xl border border-border"
              >
                <textarea
                  autoFocus
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    setCommentError("");
                  }}
                  placeholder="What are your thoughts?"
                  rows={3}
                  className="w-full bg-transparent border-none text-foreground resize-none focus:outline-none"
                />
                {commentError && (
                  <p className="text-xs text-red-500 mt-1">{commentError}</p>
                )}
                <div className="flex justify-end gap-2 border-t border-border pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplyingToPost(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting || !comment.trim()}
                    className="rounded-full"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Reply"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-2">
            {commentsLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!commentsLoading &&
              commentTree.map((node) => (
                <CommentItem
                  key={node.id}
                  node={node}
                  replyingToCommentId={replyingToCommentId}
                  setReplyingToCommentId={setReplyingToCommentId}
                  setIsReplyingToPost={setIsReplyingToPost}
                  commentText={comment}
                  setCommentText={setComment}
                  handleCommentSubmit={handleCommentSubmit}
                  openReportModal={openReportModal}
                  canDeleteComment={canDeleteComment}
                  handleDeleteComment={handleDeleteComment}
                  handleStartChat={handleStartChat}
                  submitting={submitting}
                  currentUser={user}
                  commentError={commentError}
                  setCommentError={setCommentError}
                />
              ))}

            {!commentsLoading && commentTree.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  No comments yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Report Dialog */}
      <AlertDialog
        open={reportData.isOpen}
        onOpenChange={(isOpen) => setReportData((s) => ({ ...s, isOpen }))}
      >
        <AlertDialogContent className="sm:max-w-md w-[90vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Report Content</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a detailed reason for reporting this content. Our
              moderation team will review it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <textarea
              autoFocus
              value={reportData.reason}
              onChange={(e) => {
                setReportData((s) => ({ ...s, reason: e.target.value }));
                setReportError("");
              }}
              placeholder="E.g., Spam, harassing, inappropriate..."
              className="w-full min-h-25 bg-muted border border-border rounded-md p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            {reportError && (
              <p className="text-xs text-red-500 mt-2">{reportError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitReport}
              disabled={!reportData.reason.trim() || reportSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {reportSubmitting ? "Submitting..." : "Submit Report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostDetail;
