import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";
import type { Post, PaginatedResponse, Category } from "@/types";
import BottomNav from "@/components/BottomNav";
import AppNavbar from "@/components/AppNavbar";
import { Card } from "@/components/ui/card";
import LikeButton from "@/components/LikeButton";
import {
  MessageCircle,
  Loader2,
  AlertCircle,
  Plus,
  Pin,
  Trash2,
  Flag,
  MoreHorizontal,
  Bookmark,
  EyeOff,
  Bell,
} from "lucide-react";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const Forum = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | number>(
    "All",
  );

  // Fetch Current User for Roles
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/user");
      return data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/api/categories");
      return data;
    },
  });


  async function fetchPosts({ pageParam = 1 }): Promise<PaginatedResponse> {
    const url = selectedCategory === "All"
      ? `/api/posts?page=${pageParam}`
      : `/api/categories/${selectedCategory}/posts?page=${pageParam}`;
    const { data } = await api.get(url);
    return data;
  }

  // useInfiniteQuery
  const FORUM_POLL_MS = 60_000;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["forum-posts", selectedCategory],
    queryFn: fetchPosts,
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse) => {
      const current_page =
        lastPage.meta?.current_page ?? lastPage.current_page ?? 1;
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

  // Listen for global refresh events (dispatched by the navbar)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      try {
        refetch();
      } catch {}
    };
    window.addEventListener(
      "peerspace:forum-refresh",
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "peerspace:forum-refresh",
        handler as EventListener,
      );
  }, [refetch]);

  const handlePin = async (id: number) => {
    try {
      await api.patch(`/api/posts/${id}/pin`);
      await queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    } catch (e) {
      const msg =
        extractErrorMessage(e) ||
        "Failed to pin/unpin post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/posts/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    } catch (e) {
      const msg =
        extractErrorMessage(e) || "Failed to delete post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handleStartChat = async (userId: number, peerName: string) => {
    if (!user || user.id === userId) return;
    try {
      const { data } = await api.post("/api/chats", { user_id: userId });
      navigate(`/chat/${data.id}`, { state: { peerName } });
    } catch (e) {
      const msg =
        extractErrorMessage(e) || "Could not start chat. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handleReport = async (postId: number) => {
    try {
      const res = await api.post(`/api/posts/${postId}/report`);
      notify.success(
        res.data.message ||
          "Post reported to moderators. Thank you for keeping PeerSpace safe.",
      );
    } catch (e) {
      const msg = extractErrorMessage(e) || "Failed to report post.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handleSave = async (id: number) => {
    try {
      await api.post(`/api/posts/${id}/save`);
      await queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    } catch (e) {
      const msg =
        extractErrorMessage(e) || "Failed to save post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handleHide = async (id: number) => {
    try {
      await api.post(`/api/posts/${id}/hide`);
      await queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    } catch (e) {
      const msg =
        extractErrorMessage(e) || "Failed to hide post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  const handleFollow = async (id: number) => {
    try {
      await api.post(`/api/posts/${id}/follow`);
      await queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    } catch (e) {
      const msg =
        extractErrorMessage(e) || "Failed to follow post. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navbar */}
      <AppNavbar />

      {/* Category Pills (mobile) */}
      <div className="px-4 py-3 border-b border-border bg-card overflow-x-auto whitespace-nowrap hide-scrollbar md:hidden">
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
          {(categories as Category[] | undefined)?.map((cat) => (
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

      {/* Responsive layout: sidebar (md+) + posts area */}
      <div className="p-4">
        <div className="md:flex md:gap-6">
          {/* Sidebar for md+ */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-card border border-border rounded-lg p-3 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Categories
              </h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === "All"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  All
                </button>
                {(categories as Category[] | undefined)?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {selectedCategory !== "All" && (
                <div className="pt-2 border-t border-border text-sm text-muted-foreground">
                  {(categories as Category[] | undefined)?.find(
                    (c) => c.id === selectedCategory,
                  )?.description || "Posts inside this category."}
                </div>
              )}
            </div>
          </aside>

          {/* Posts area */}
          <div className="flex-1 space-y-3">
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
                <p className="text-destructive font-medium">
                  Failed to load topics
                </p>
                <button
                  onClick={() => refetch()}
                  className="text-sm underline mt-2"
                >
                  Try again
                </button>
              </Card>
            )}

            {/* Success State - Flattening the pages array */}
            {data?.pages.map((page: PaginatedResponse, i: number) => (
              <React.Fragment key={i}>
                {page.data.map((post: Post) => {
                  const peerId = post.creator?.id;

                  return (
                  <Card
                    key={post.id}
                    className="p-4 hover:shadow-md transition-shadow border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {post.creator?.name?.[0] || "A"}
                      </div>
                      {/* <div
                        className="flex flex-col cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (post.creator?.id)
                            handleStartChat(
                              post.creator.id,
                              post.creator?.name || "Peer",
                            );
                        }}
                      > */}
                      <div className="flex flex-col group">
                        <Link
                          to={peerId ? `/users/${peerId}` : "#"}
                          onClick={(e) => {
                            if (!peerId) e.preventDefault();
                          }}
                          className="flex items-center cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-foreground group-hover:underline">
                            {post.creator?.name || "Anonymous"}
                          </span>
                        </Link>

                        <span className="text-[10px] text-muted-foreground">
                          {post.created_at
                            ? formatDistanceToNow(new Date(post.created_at)) +
                              " ago"
                            : "Recently"}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/posts/${post.slug}`}
                      className="block cursor-pointer"
                    >
                      <h3 className="font-semibold text-foreground mb-1">
                        {Boolean(post.is_pinned) && "📌 "}
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {post.body}
                      </p>
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {/* Comments count */}
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />{" "}
                          {post.comments_count ?? 0}
                        </span>

                        {/* Like Button */}
                        <LikeButton
                          itemId={post.id}
                          type="post"
                          initialCount={post.likes_count ?? 0}
                          initialIsLiked={post.is_liked ?? false}
                        />
                      </div>

                      <div className="flex items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground focus:outline-none">
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleFollow(post.id)}
                            >
                              <Bell className="h-4 w-4 mr-2" />
                              <span>
                                {post.is_followed
                                  ? "Unfollow Post"
                                  : "Follow Post"}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSave(post.id)}
                            >
                              <Bookmark className="h-4 w-4 mr-2" />
                              <span>{post.is_saved ? "Unsave" : "Save"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleHide(post.id)}
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              <span>Hide</span>
                            </DropdownMenuItem>
                            {user?.role !== "admin" &&
                              user?.role !== "moderator" && (
                                <>
                                  <DropdownMenuSeparator />

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                      >
                                        <Flag className="h-4 w-4 mr-2" />
                                        <span>Report</span>
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-xs sm:max-w-md">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Report this post?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Is this post violating our community
                                          guidelines? Our moderators will review
                                          it shortly. This action is anonymous.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleReport(post.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Report
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}

                            {(user?.role === "admin" ||
                              user?.role === "moderator") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handlePin(post.id)}
                                >
                                  <Pin className="h-4 w-4 mr-2" />
                                  <span>
                                    {post.is_pinned ? "Unpin" : "Pin"}
                                  </span>
                                </DropdownMenuItem>
                              </>
                            )}

                            {(user?.role === "admin" ||
                              user?.role === "moderator" ||
                              user?.id === post.creator?.id) && (
                              <>
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
                                      <AlertDialogTitle>
                                        Delete this post?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete the post and all
                                        associated comments safely.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(post.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                )})}
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading
                      more...
                    </span>
                  ) : (
                    "Show older stories"
                  )}
                </button>
              )}
              {!hasNextPage && !isLoading && (
                <p className="text-xs text-muted-foreground italic py-4">
                  You've reached the end of the space.
                </p>
              )}
            </div>
          </div>
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
