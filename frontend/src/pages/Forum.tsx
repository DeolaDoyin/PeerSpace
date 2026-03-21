import { useQuery } from "@tanstack/react-query";
import api from '@/api/axios';
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { MessageCircle, Users, Loader2, AlertCircle } from "lucide-react";

interface Post {
  id: number;
  title: string;
  content: string;
  replies_count?: number;
  participants_count?: number;
}

const Forum = () => {
  // 1. Define the fetcher function
  const fetchPosts = async (): Promise<Post[]> => {
    const { data } = await api.get('/api/posts');
    return data;
  };

  // 2. Use the useQuery hook
  const { data: posts, isLoading, isError, refetch } = useQuery({
    queryKey: ['forum-posts'], // Unique key for caching
    queryFn: fetchPosts,
    staleTime: 1000 * 60 * 5, // Data stays "fresh" for 5 minutes
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-card border-b border-border px-4 py-4 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Forum</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect with peers</p>
        </div>
        {/* Bonus: Refresh button */}
        <button onClick={() => refetch()} className="text-xs text-primary font-medium">
          Refresh
        </button>
      </header>

      <div className="p-4 space-y-3">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="p-8 border-destructive bg-destructive/10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">Failed to load topics</p>
            <button onClick={() => refetch()} className="text-sm underline mt-2">Try again</button>
          </Card>
        )}

        {/* Success State */}
        {!isLoading && posts?.map((post) => (
          <Card key={post.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.replies_count ?? 0}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {post.participants_count ?? 0}</span>
            </div>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Forum;