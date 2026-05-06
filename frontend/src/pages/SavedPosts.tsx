import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  MessageCircle,
  BookmarkMinus,
} from "lucide-react";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import LikeButton from "@/components/LikeButton";

interface SavedPost {
  id: number;
  slug: string;
  title: string;
  body: string;
  created_at: string;
  comments_count: number;
  likes_count: number;
  is_liked?: boolean;
  is_pinned: boolean;
  creator?: { id: number; name: string };
}

interface PaginatedSavedPosts {
  data: SavedPost[];
}

const SavedPosts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: async () => {
      const { data } = await api.get("/api/posts/saved");
      return data as PaginatedSavedPosts;
    },
  });

  const posts = data?.data ?? [];

  const handleUnsave = async (postId: number) => {
    try {
      await api.post(`/api/posts/${postId}/save`);
      notify.success("Post removed from saved");
      await queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      await queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      await queryClient.invalidateQueries({ queryKey: ["post"] });
    } catch (error) {
      notify.error(extractErrorMessage(error) || "Failed to unsave post.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppNavbar />

      <div className="sticky top-16 z-10 bg-card border-b border-border px-4 py-3">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Saved Posts
        </button>
      </div>

      <main className="p-4 space-y-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <Card className="p-8 border-destructive bg-destructive/10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">
              Failed to load saved posts
            </p>
            <button onClick={() => refetch()} className="text-sm underline mt-2">
              Try again
            </button>
          </Card>
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-foreground font-medium">No saved posts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Save posts from the forum to revisit them here.
            </p>
          </Card>
        )}

        {!isLoading &&
          !isError &&
          posts.map((post) => (
            <Card
              key={post.id}
              className="p-4 hover:shadow-md transition-shadow border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {post.creator?.name?.[0] || "A"}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    {post.creator?.name || "Anonymous"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {post.created_at
                      ? `${formatDistanceToNow(new Date(post.created_at))} ago`
                      : "Recently"}
                  </span>
                </div>
              </div>

              <Link to={`/posts/${post.slug}`} className="block cursor-pointer">
                <h3 className="font-semibold text-foreground mb-1">
                  {Boolean(post.is_pinned) && "📌 "}
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.body}
                </p>
              </Link>

              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments_count ?? 0}
                  </span>
                  <LikeButton
                    itemId={post.id}
                    type="post"
                    initialCount={post.likes_count ?? 0}
                    initialIsLiked={post.is_liked ?? false}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleUnsave(post.id)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <BookmarkMinus className="h-3.5 w-3.5" />
                  Unsave
                </button>
              </div>
            </Card>
          ))}
      </main>

      <BottomNav />
    </div>
  );
};

export default SavedPosts;
