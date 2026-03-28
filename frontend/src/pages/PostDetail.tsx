import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import LikeButton from "@/components/LikeButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';

const PostDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch Post
  const { data: post, isLoading, error, refetch } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const { data } = await api.get(`/api/posts/${slug}`);
      return data;
    }
  });

  // Submit Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/api/posts/${post.id}/comments`, { body: comment });
      setComment("");
      refetch(); // Reload post to show new comment
    } catch (err) {
      console.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background flex flex-col items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (error || !post) return <div className="p-8 text-center text-destructive">Failed to load post. <button onClick={() => refetch()} className="underline">Retry</button></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-card border-b border-border px-4 py-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Support Post</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        <Card className="p-5 border-border">
          <h2 className="text-xl font-bold text-foreground mb-2">
            {Boolean(post.is_pinned) && "📌 "}{post.title}
          </h2>
          <div className="flex gap-2 text-xs text-muted-foreground mb-4">
            <span className="text-primary font-medium">by {post.creator?.name || 'Anonymous'}</span>
            <span>•</span>
            <span>{post.created_at ? formatDistanceToNow(new Date(post.created_at)) + " ago" : "Recently"}</span>
          </div>
          <p className="text-foreground whitespace-pre-wrap mb-4">{post.body}</p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
            <LikeButton 
              itemId={post.id} 
              type="post" 
              initialCount={post.likes_count ?? 0} 
              initialIsLiked={post.is_liked ?? false} 
            />
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> {post.comments_count ?? 0}
            </span>
          </div>
        </Card>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add an encouraging reply..."
            rows={3}
            className="w-full bg-card border border-border rounded-lg p-3 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !comment.trim()} className="rounded-xl">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reply"}
            </Button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Comments ({post.comments?.length || 0})</h3>
          {post.comments?.map((c: any) => (
            <Card key={c.id} className="p-4 border-border bg-card/50">
              <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                <span className="text-primary font-medium">{c.creator?.name || 'Anonymous'}</span>
                <span>•</span>
                <span>{c.created_at ? formatDistanceToNow(new Date(c.created_at)) + " ago" : ""}</span>
              </div>
              <p className="text-sm text-foreground mb-3">{c.body}</p>
              <div className="flex justify-end border-t border-border pt-2 mt-2">
                <LikeButton 
                  itemId={c.id} 
                  type="comment" 
                  initialCount={c.likes_count ?? 0} 
                  initialIsLiked={c.is_liked ?? false} 
                />
              </div>
            </Card>
          ))}
          {!post.comments?.length && (
            <p className="text-sm text-muted-foreground italic text-center py-4">Be the first to share your thoughts.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default PostDetail;
