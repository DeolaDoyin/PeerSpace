import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";
import ChatListItem from "@/components/ChatListItem";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggleButton from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, LibraryBig, User, Menu } from "lucide-react";

export interface ChatListRow {
  id: number;
  type: string;
  peer: { id: number; name: string } | null;
  last_message: {
    id: number;
    body: string;
    created_at?: string;
  } | null;
  updated_at: string;
}

const Chats = () => {
  const navigate = useNavigate();
  const [newPeerId, setNewPeerId] = useState("");
  const [starting, setStarting] = useState(false);

  const CHATS_POLL_MS = 60_000;

  const {
    data: chats = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data } = await api.get<ChatListRow[]>("/api/chats");
      return data;
    },
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? CHATS_POLL_MS
        : false,
    refetchOnWindowFocus: true,
  });

  const previewText = (chat: ChatListRow) => {
    if (chat.last_message?.body) {
      return chat.last_message.body.length > 80
        ? `${chat.last_message.body.slice(0, 80)}…`
        : chat.last_message.body;
    }
    return "No messages yet";
  };

  const previewTime = (chat: ChatListRow) => {
    const t = chat.last_message?.created_at ?? chat.updated_at;
    try {
      return formatDistanceToNow(new Date(t), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const startChat = async () => {
    const id = Number.parseInt(newPeerId.trim(), 10);
    if (!Number.isFinite(id) || id <= 0) return;
    setStarting(true);
    try {
      const { data } = await api.post<ChatListRow>("/api/chats", {
        user_id: id,
      });
      setNewPeerId("");
      await refetch();
      navigate(`/chat/${data.id}`, {
        state: { peerName: data.peer?.name ?? "Peer" },
      });
    } catch (e) {
      const err = e as any;
      const msg =
        extractErrorMessage(err) || "Could not start chat. Please try again.";
      try {
        notify.error(msg);
      } catch {}
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/">
              <h1 className="text-xl font-bold text-primary">PeerSpace</h1>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {/* Web-only quick links to other pages */}
            <div className="hidden md:flex items-center gap-2 ml-2">
              <Link
                to="/profile"
                title="Profile"
                className="text-primary p-2 hover:bg-muted rounded-full"
              >
                <User className="h-5 w-5" />
              </Link>
              <Link
                to="/forum"
                title="Forum"
                className="text-primary p-2 hover:bg-muted rounded-full"
              >
                <LibraryBig className="h-5 w-5" />
              </Link>
              <ThemeToggleButton />
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-3 border-b border-border bg-card/80 space-y-2">
        <p className="text-xs text-muted-foreground">
          Start a chat with another member (user ID)
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={newPeerId}
            onChange={(e) => setNewPeerId(e.target.value)}
            placeholder="User ID"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button
            type="button"
            onClick={() => void startChat()}
            disabled={starting || !newPeerId.trim()}
          >
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-card overflow-y-auto pb-20">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center gap-2 py-16 px-4 text-center text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">Could not load chats.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}
        {!isLoading &&
          !isError &&
          chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              name={chat.peer?.name ?? "Peer"}
              lastMessage={previewText(chat)}
              time={previewTime(chat)}
              onClick={() =>
                navigate(`/chat/${chat.id}`, {
                  state: { peerName: chat.peer?.name ?? "Peer" },
                })
              }
            />
          ))}
        {!isLoading && !isError && chats.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-16 px-4">
            No conversations yet. Enter another user&apos;s ID above to start.
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chats;
