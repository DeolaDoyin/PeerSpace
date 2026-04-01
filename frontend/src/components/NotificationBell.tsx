import { Bell, Check, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DbNotification {
  id: string;
  type?: string;
  created_at: string;
  data: {
    type?: string;
    message?: string;
    post_slug?: string;
  };
}

const POLL_MS = 45_000;

const NotificationBell = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<DbNotification[]>("/api/notifications");
      return data;
    },
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? POLL_MS
        : false,
    refetchOnWindowFocus: true,
  });

  const unreadCount = notifications?.length || 0;

  const handleRead = async (id: string, slug: string | undefined) => {
    if (!slug) return;
    try {
      api.post(`/api/notifications/${id}/read`).then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      });
      setIsOpen(false);
      navigate(`/posts/${slug}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.post("/api/notifications/mark-all-read");
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) void refetch();
      }}
    >
      <SheetTrigger asChild>
        <button className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors relative">
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Activity</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAll} className="h-8 text-xs text-muted-foreground p-0 px-2">
                <Check className="h-3 w-3 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          <SheetDescription>
            Your recent notifications and alerts.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mt-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications?.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            notifications?.map((notif) => (
              <div 
                key={notif.id} 
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    void handleRead(notif.id, notif.data?.post_slug);
                }}
                onClick={() => void handleRead(notif.id, notif.data?.post_slug)}
                className="p-3 bg-muted/50 hover:bg-muted rounded-lg border border-border cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {notif.data?.type === "like" ? "❤️" : "💬"}
                  </div>
                  <div>
                    <p className="text-xs text-foreground font-medium leading-tight">
                      {notif.data?.message ?? "Notification"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;
