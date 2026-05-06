import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import api from "@/api/axios";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import AnonAvatar from "@/components/AnonAvatar";

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

interface UserProfileResponse {
  user: { id: number; name: string };
  posts: ProfilePost[];
  comments: ProfileComment[];
}

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/${userId}/profile`);
      return data as UserProfileResponse;
    },
    enabled: Boolean(userId),
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppNavbar />

      <div className="sticky top-16 z-10 bg-card border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          View Profile
        </button>
      </div>

      {/* Profile Header with Banner */}
      <div className="bg-card border-b border-border">
        {/* Colorful Gradient Banner */}
        <div className="h-28 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <div className="px-4 pb-6 relative">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {isError && (
            <div className="mt-4 p-4 border border-destructive bg-destructive/10 text-center rounded-lg max-w-md mx-auto">
              <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium text-sm">Failed to load profile</p>
              <button className="text-xs underline mt-2 text-destructive" onClick={() => refetch()}>
                Try again
              </button>
            </div>
          )}

          {!isLoading && !isError && profile && (
            <div className="-mt-12 flex items-end gap-4">
              <div className="rounded-full border-4 border-card bg-card shadow-sm">
                <AnonAvatar size="xl" />
              </div>
              <div className="flex-1 pb-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.user.name}
                </h1>
                <p className="text-sm font-medium text-primary mt-1">
                  {profile.posts.length} posts • {profile.comments.length} comments
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isLoading && !isError && profile && (
        <>
          {/* Posts Section */}
          <div className="mt-4 bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
              <h2 className="text-sm font-medium text-blue-500 uppercase tracking-wide">
                Posts
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {profile.posts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No posts yet.
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

          {/* Comments Section */}
          <div className="mt-4 bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="h-4 w-1 bg-purple-500 rounded-full"></div>
              <h2 className="text-sm font-medium text-purple-500 uppercase tracking-wide">
                Comments
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {profile.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet.
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

      <BottomNav />
    </div>
  );
};

export default UserProfile;
