import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Paperclip, MoreVertical } from "lucide-react";
import api from "@/api/axios";
import { getEcho } from "@/lib/echo";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import AnonAvatar from "@/components/AnonAvatar";
import type { ChatListRow } from "@/pages/Chats";

interface ChatMessageApi {
  id: number;
  chat_id: number;
  user_id: number;
  body: string;
  created_at: string;
  sender?: { id: number; name: string } | null;
}

interface MessagesPage {
  data: ChatMessageApi[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

interface MessageSentPayload {
  message: {
    id: number;
    chat_id: number;
    user_id: number;
    body: string;
    created_at?: string;
    sender: { id: number; name: string } | null;
  };
}

interface UiMessage {
  id: string;
  message: string;
  isSent: boolean;
  timestamp: string;
}

function toUiMessage(m: ChatMessageApi, currentUserId: number): UiMessage {
  return {
    id: String(m.id),
    message: m.body,
    isSent: m.user_id === currentUserId,
    timestamp: m.created_at
      ? format(new Date(m.created_at), "p")
      : "",
  };
}

function mergeMessageIntoPage(prev: MessagesPage | undefined, incoming: ChatMessageApi): MessagesPage {
  if (!prev) {
    return {
      data: [incoming],
      total: 1,
      current_page: 1,
      last_page: 1,
      per_page: 50,
    };
  }
  if (prev.data.some((row) => row.id === incoming.id)) {
    return prev;
  }
  return {
    ...prev,
    data: [...prev.data, incoming],
    total: prev.total + 1,
  };
}

const ChatRoom = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const chatIdNum = Number.parseInt(chatId ?? "", 10);
  const peerNameFromNav = (location.state as { peerName?: string } | null)?.peerName;

  const [sending, setSending] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/user");
      return data as { id: number; name?: string };
    },
  });

  const { data: chatRows } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data } = await api.get<ChatListRow[]>("/api/chats");
      return data;
    },
    enabled: Boolean(user?.id && !peerNameFromNav && Number.isFinite(chatIdNum)),
  });

  const peerName =
    peerNameFromNav ??
    chatRows?.find((c) => c.id === chatIdNum)?.peer?.name ??
    "Peer";

  const {
    data: messagesPage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["chat-messages", chatIdNum],
    queryFn: async () => {
      const { data } = await api.get<MessagesPage>(`/api/chats/${chatIdNum}/messages`);
      return data;
    },
    enabled: Boolean(user?.id && Number.isFinite(chatIdNum) && chatIdNum > 0),
  });

  const messages: UiMessage[] = useMemo(() => {
    if (!messagesPage?.data || !user?.id) return [];
    return messagesPage.data.map((m) => toUiMessage(m, user.id));
  }, [messagesPage, user?.id]);

  useEffect(() => {
    const uid = user?.id;
    if (!uid || !Number.isFinite(chatIdNum) || chatIdNum <= 0) return;

    const echo = getEcho();
    if (!echo) return;

    const room = `chat.${chatIdNum}`;
    const channel = echo.join(room);

    channel.listen(".message.sent", (payload: MessageSentPayload) => {
      const row = payload.message;
      const apiRow: ChatMessageApi = {
        id: row.id,
        chat_id: row.chat_id,
        user_id: row.user_id,
        body: row.body,
        created_at: row.created_at ?? new Date().toISOString(),
        sender: row.sender,
      };

      queryClient.setQueryData<MessagesPage | undefined>(
        ["chat-messages", chatIdNum],
        (prev) => mergeMessageIntoPage(prev, apiRow)
      );
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    });

    return () => {
      echo.leave(room);
    };
  }, [user?.id, chatIdNum, queryClient]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!user?.id || !Number.isFinite(chatIdNum)) return;
      setSending(true);
      try {
        const { data } = await api.post<ChatMessageApi>(`/api/chats/${chatIdNum}/messages`, {
          body: text,
        });
        const created: ChatMessageApi = {
          ...data,
          sender: data.sender ?? { id: user.id, name: user.name ?? "You" },
        };
        queryClient.setQueryData<MessagesPage | undefined>(
          ["chat-messages", chatIdNum],
          (prev) => mergeMessageIntoPage(prev, created)
        );
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      } catch {
        console.error("Failed to send message");
        throw new Error("send failed");
      } finally {
        setSending(false);
      }
    },
    [chatIdNum, queryClient, user]
  );

  const invalid = !Number.isFinite(chatIdNum) || chatIdNum <= 0;

  if (invalid) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive text-sm mb-4">Invalid chat.</p>
        <button type="button" className="text-primary underline" onClick={() => navigate("/chats")}>
          Back to chats
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/chats")}
            className="p-1 -ml-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AnonAvatar size="sm" />
            <h1 className="text-lg font-semibold text-foreground truncate">{peerName}</h1>
          </div>

          <button type="button" className="p-2 hover:bg-muted rounded-full transition-colors">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </button>
          <button type="button" className="p-2 hover:bg-muted rounded-full transition-colors">
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {isError && (
          <div className="text-center text-destructive text-sm py-8">
            Could not load messages.{" "}
            <button type="button" className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}
        {!isLoading &&
          !isError &&
          messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg.message}
              isSent={msg.isSent}
              timestamp={msg.timestamp}
              showAvatar={!msg.isSent && (index === 0 || messages[index - 1]?.isSent)}
            />
          ))}
        {!isLoading && !isError && messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Say hello to start the conversation.</p>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={sending || isLoading} />
    </div>
  );
};

export default ChatRoom;
