import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import api from '@/api/axios';
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import LikeButton from '@/components/LikeButton';
import { MessageCircle, Loader2, AlertCircle, Plus, Pin, Trash2 } from "lucide-react";
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

interface Post {
  id: number;
  slug: string;
  name: string;
  title: string;
  body: string;
  created_at: string;
  comments_count: number;
  likes_count: number;
  is_liked?: boolean;
  is_pinned: boolean;
}

interface PaginatedResponse {
  data: Post[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  current_page?: number;
  last_page?: number;
}

const Forum = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | number>("All");

  // Fetch Current User for Roles
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await api.get('/api/user');
      return data;
    }
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/api/categories');
      return data;
    }
  });

  const fetchPosts = async ({ pageParam = 1 }): Promise<PaginatedResponse> => {
    const url = selectedCategory === "All" 
      ? `/api/posts?page=${pageParam}` 
      : `/api/categories/${selectedCategory}/posts?page=${pageParam}`;
    const { data } = await api.get(url);
    return data;
  };

  // useInfiniteQuery
  const FORUM_POLL_MS = 60_000;

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["forum-posts", selectedCategory],
    queryFn: fetchPosts,
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse) => {
      const current_page = lastPage.meta?.current_page ?? lastPage.current_page ?? 1;
      const last_page = lastPage.meta?.last_page ?? lastPage.last_page ?? 1;
      return current_page < last_page ? current_page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? FORUM_POLL_MS
        : false,
    refetchOnWindowFocus: true,
  });

  const handlePin = async (id: number) => {
    try {
      await api.patch(`/api/posts/${id}/pin`);
      await queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    } catch (e) {
      console.error("Failed to pin", e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/posts/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />

      {/* Category Pills */}
      <div className="px-4 py-3 border-b border-border bg-card overflow-x-auto whitespace-nowrap hide-scrollbar">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === "All" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category Description */}
      {selectedCategory !== "All" && (
        <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
          <p className="text-sm text-foreground">
            {categories?.find((c: any) => c.id === selectedCategory)?.description || "Posts inside this category."}
          </p>
        </div>
      )}

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

        {/* Success State - Flattening the pages array */}
        {data?.pages.map((page: PaginatedResponse, i: number) => (
          <React.Fragment key={i}>
            {page.data.map((post: Post) => (
              <Card key={post.id} className="p-4 hover:shadow-md transition-shadow border-border">
                <Link to={`/posts/${post.slug}`} className="block cursor-pointer">
                  <h3 className="font-semibold text-foreground mb-1">
                    {Boolean(post.is_pinned) && "📌 "}{post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.body}</p> 
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" /> {post.comments_count ?? 0}
                    </span>
                    <LikeButton 
                      itemId={post.id} 
                      type="post" 
                      initialCount={post.likes_count ?? 0} 
                      initialIsLiked={post.is_liked ?? false} 
                    />
                  </div>

                  {(user?.role === 'admin' || user?.role === 'moderator') && (
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.preventDefault(); handlePin(post.id); }} className="text-muted-foreground hover:text-primary p-2 -my-2 rounded-full transition-colors">
                        <Pin className="h-4 w-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="text-muted-foreground hover:text-destructive p-2 -my-2 rounded-full transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-xs sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the post and all associated comments safely.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(post.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </React.Fragment>
        ))}

        {/* Load More Trigger */}
        <div className="pt-4 flex justify-center">
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm font-medium text-primary py-2 px-4 rounded-md hover:bg-primary/10 disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading more...
                </span>
              ) : (
                "Show older stories"
              )}
            </button>
          )}
          {!hasNextPage && !isLoading && (
            <p className="text-xs text-muted-foreground italic py-4">You've reached the end of the space.</p>
          )}
        </div>
      </div>

      {/* Create Post FAB */}
      <Link 
        to="/posts/create" 
        className="fixed bottom-24 right-4 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-primary/30 z-50"
        aria-label="Create new post"
      >
        <Plus size={24} />
      </Link>

      <BottomNav />
    </div>
  );
};

export default Forum;