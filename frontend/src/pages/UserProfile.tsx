import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
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

      <main className="p-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <Card className="p-8 border-destructive bg-destructive/10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">Failed to load profile</p>
            <button className="text-sm underline mt-2" onClick={() => refetch()}>
              Try again
            </button>
          </Card>
        )}

        {!isLoading && !isError && profile && (
          <>
            <Card className="p-4">
              <h1 className="text-xl font-bold text-foreground">{profile.user.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {profile.posts.length} posts • {profile.comments.length} comments
              </p>
            </Card>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Posts
              </h2>
              {profile.posts.length === 0 ? (
                <Card className="p-4 text-sm text-muted-foreground">
                  No posts yet.
                </Card>
              ) : (
                profile.posts.map((post) => (
                  <Card key={post.id} className="p-4">
                    <Link to={`/posts/${post.slug}`} className="block">
                      <h3 className="font-semibold text-foreground mb-1 hover:underline">
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
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Comments
              </h2>
              {profile.comments.length === 0 ? (
                <Card className="p-4 text-sm text-muted-foreground">
                  No comments yet.
                </Card>
              ) : (
                profile.comments.map((comment) => (
                  <Card key={comment.id} className="p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span>
                        {comment.created_at
                          ? `${formatDistanceToNow(new Date(comment.created_at))} ago`
                          : "Recently"}
                      </span>
                      {comment.post && (
                        <Link
                          to={`/posts/${comment.post.slug}`}
                          className="ml-2 underline hover:text-foreground"
                        >
                          on {comment.post.title}
                        </Link>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default UserProfile;
