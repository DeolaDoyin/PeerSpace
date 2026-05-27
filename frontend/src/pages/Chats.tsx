import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";
// 💡 Make sure to import your decryption helper function from your utilities file
import ChatListItem from "@/components/ChatListItem";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

export interface ChatListRow {
  id: number;
  type: string;
  peer: { id: number; name: string } | null;
  last_message: {
    id: number;
    body: string;
    // 💡 1. Add the encryption fields to your interface so TypeScript recognizes them
    encrypted_payload?: string | null;
    iv?: string | null;
    created_at?: string;
  } | null;
  updated_at: string;
}

interface ChatsPaginatedResponse {
  data: ChatListRow[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const Chats = () => {
  const navigate = useNavigate();
  const [newPeerName, setNewPeerName] = useState("");
  const [starting, setStarting] = useState(false);

  const CHATS_POLL_MS = 60_000;

  const {
    data: chatsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data } = await api.get<ChatsPaginatedResponse>("/api/chats");
      return data;
    },
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? CHATS_POLL_MS
        : false,
  });

  const chats = chatsResponse?.data ?? [];

  // 💡 2. Intercept and decrypt the encrypted payload before slicing it for the preview
// 💡 Update this function in your Chats.tsx file:
const previewText = (chat: ChatListRow) => {
  const lastMsg = chat.last_message;
  if (!lastMsg) return "No messages yet";

  // If it's encrypted, pass a fallback tag or the placeholder text 
  // because we will decrypt it dynamically inside the row item itself!
  if (lastMsg.encrypted_payload && lastMsg.iv) {
    return lastMsg.body; // or "[Encrypted Message]"
  }

  return lastMsg.body.length > 80 ? `${lastMsg.body.slice(0, 80)}…` : lastMsg.body;
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
    const name = newPeerName.trim();
    if (!name) return;

    setStarting(true);
    try {
      const { data } = await api.post<ChatListRow>("/api/chats", {
        username: name,
      });
      setNewPeerName("");
      await refetch();
      navigate(`/chat/${data.id}`, {
        state: { peerName: data.peer?.name ?? name },
      });
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { status?: number } };
        if (e?.response?.status === 422) {
          notify.error(`We couldn't find a member named "${name}".`);
        } else {
          notify.error(extractErrorMessage(err) || "Connection error. Please try again later.");
        }
      } else {
        notify.error("Connection error. Please try again later.");
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavbar />

      <div className="px-4 py-3 border-b border-border bg-card/80 space-y-2">
        <p className="text-xs text-muted-foreground">
          Start a chat with another member
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            min={1}
            value={newPeerName}
            onChange={(e) => setNewPeerName(e.target.value)}
            placeholder="Enter Username"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button
            type="button"
            onClick={() => void startChat()}
            disabled={starting || !newPeerName.trim()}
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
              id={chat.id}
              name={chat.peer?.name ?? "Peer"}
              lastMessage={previewText(chat)}
              time={previewTime(chat)}
              encryptedPayload={chat.last_message?.encrypted_payload}
              iv={chat.last_message?.iv}
              onClick={() =>
                navigate(`/chat/${chat.id}`, {
                  state: { peerName: chat.peer?.name ?? "Peer" },
                })
              }
            />
          ))}
        {!isLoading && !isError && chats.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-16 px-4">
            No conversations yet. Enter another user&apos;s Username above to
            start.
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chats;