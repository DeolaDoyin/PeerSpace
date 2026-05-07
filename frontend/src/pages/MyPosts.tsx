import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import api from "@/api/axios";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";

interface ProfilePost {
  id: number;
  slug: string;
  title: string;
  body: string;
  created_at: string;
  comments_count: number;
}

interface ProfileComment {
  id: number;
  content: string;
  created_at: string;
  post?: { id: number; slug: string; title: string };
}

interface ProfileResponse {
  user: { id: number; name: string };
  posts: ProfilePost[];
  comments: ProfileComment[];
}

const MyPosts = () => {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/user");
      return data as { id: number };
    },
  });

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["my-posts", user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/${user!.id}/profile`);
      return data as ProfileResponse;
    },
    enabled: Boolean(user?.id),
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppNavbar />
      <div className="sticky top-16 z-10 bg-card border-b border-border px-4 py-3">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          My Posts
        </button>
      </div>

      <main className="max-w-2xl mx-auto">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <div className="m-4 p-4 border border-destructive bg-destructive/10 text-center rounded-lg">
            <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium text-sm">
              Failed to load posts
            </p>
            <button
              className="text-xs underline mt-2 text-destructive"
              onClick={() => refetch()}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && profile && (
          <>
            {/* Posts */}
            <div className="mt-4 bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="h-4 w-1 bg-blue-500 rounded-full" />
                <h2 className="text-sm font-medium text-blue-500 uppercase tracking-wide">
                  Posts
                </h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {profile.posts.length}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {profile.posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    You haven't posted anything yet.
                  </p>
                ) : (
                  profile.posts.map((post) => (
                    <Card
                      key={post.id}
                      className="rounded-xl border-border p-4 transition-colors hover:border-primary/40 bg-muted/30 shadow-none"
                    >
                      <Link to={`/posts/${post.slug}`} className="block">
                        <h3 className="mb-1 font-semibold text-foreground hover:underline">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {post.body}
                        </p>
                      </Link>
                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span>
                          {post.created_at
                            ? `${formatDistanceToNow(new Date(post.created_at))} ago`
                            : "Recently"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {post.comments_count ?? 0}
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="mt-4 bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="h-4 w-1 bg-purple-500 rounded-full" />
                <h2 className="text-sm font-medium text-purple-500 uppercase tracking-wide">
                  Comments
                </h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {profile.comments.length}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {profile.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    You haven't commented yet.
                  </p>
                ) : (
                  profile.comments.map((comment) => (
                    <Card
                      key={comment.id}
                      className="rounded-xl border-border p-4 transition-colors hover:border-primary/40 bg-muted/30 shadow-none"
                    >
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        <span>
                          {comment.created_at
                            ? `${formatDistanceToNow(new Date(comment.created_at))} ago`
                            : "Recently"}
                        </span>
                        {comment.post && (
                          <Link
                            to={`/posts/${comment.post.slug}`}
                            className="ml-2 underline hover:text-foreground font-medium"
                          >
                            on {comment.post.title}
                          </Link>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MyPosts;
