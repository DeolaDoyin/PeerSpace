import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  MoreVertical,
  Flag,
  User,
} from "lucide-react";
import api from "@/api/axios";
// use the project's notify wrapper for consistent toasts
import { getEcho } from "@/lib/echo";
import { notify } from "@/lib/notify";
import MessageBubble from "@/components/MessageBubble";
import ThemeToggleButton from "@/components/ThemeToggle";
import ChatInput from "@/components/ChatInput";
import AnonAvatar from "@/components/AnonAvatar";
import type { ChatListRow } from "@/pages/Chats";
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
    timestamp: m.created_at ? format(new Date(m.created_at), "p") : "",
  };
}

function mergeMessageIntoPage(
  prev: MessagesPage | undefined,
  incoming: ChatMessageApi,
): MessagesPage {
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
  const peerNameFromNav = (location.state as { peerName?: string } | null)
    ?.peerName;

  const scrollRef = useRef<HTMLDivElement>(null);
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
    enabled: Boolean(
      user?.id && !peerNameFromNav && Number.isFinite(chatIdNum),
    ),
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
      const { data } = await api.get<MessagesPage>(
        `/api/chats/${chatIdNum}/messages`,
      );
      return data;
    },
    enabled: Boolean(user?.id && Number.isFinite(chatIdNum) && chatIdNum > 0),
  });

  const messages: UiMessage[] = useMemo(() => {
    if (!messagesPage?.data || !user?.id) return [];
    return messagesPage.data.map((m) => toUiMessage(m, user.id));
  }, [messagesPage, user?.id]);

  useEffect(() => {
    // When entering the chat: Lock scrolling
    document.body.style.overflow = "hidden";

    return () => {
      // When leaving the chat: Restore scrolling
      document.body.style.overflow = "auto";
    };
  }, []); // Empty dependency array means this only runs on mount/unmount

  // Auto-scroll effect
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        (prev) => mergeMessageIntoPage(prev, apiRow),
      );
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    });

    return () => {
      echo.leave(room);
    };
  }, [user?.id, chatIdNum, queryClient]);

  const handleReportUser = async () => {
    if (!chatIdNum) return;
    try {
      // Calling the report endpoint for the specific chat/user
      const res = await api.post(`/api/chats/${chatIdNum}/report-user`);
      notify.success(
        res.data.message ||
          "User reported. Thank you for keeping PeerSpace safe.",
      );
    } catch (e: any) {
      console.error("Failed to report user", e);
      notify.error(e.response?.data?.message || "Failed to send report.");
    }
  };

  const handleSend = useCallback(
    async (text: string) => {
      if (!user?.id || !Number.isFinite(chatIdNum)) return;

      setSending(true);
      try {
        const { data } = await api.post<ChatMessageApi>(
          `/api/chats/${chatIdNum}/messages`,
          {
            body: text,
          },
        );

        queryClient.setQueryData<MessagesPage | undefined>(
          ["chat-messages", chatIdNum],
          (prev) => mergeMessageIntoPage(prev, data),
        );

        queryClient.invalidateQueries({ queryKey: ["chats"] });
      } catch (err) {
        console.error("ChatRoom Send Error:", err);
        notify.error("Message failed to send.");
      } finally {
        setSending(false);
      }
    },
    [chatIdNum, queryClient, user],
  );

  const invalid = !Number.isFinite(chatIdNum) || chatIdNum <= 0;

  if (invalid) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive text-sm mb-4">Invalid chat.</p>
        <button
          type="button"
          className="text-primary underline"
          onClick={() => navigate("/chats")}
        >
          Back to chats
        </button>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full bg-background flex flex-col overflow-hidden transition-colors duration-300">
      <header className="flex-none bg-card border-b border-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/chats")}
              className="p-1 -ml-1 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </button>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <AnonAvatar size="sm" />
              <h1 className="text-lg font-semibold text-foreground truncate">
                {peerName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggleButton />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-2 hover:bg-muted rounded-full transition-colors focus:outline-none"
                >
                  <MoreVertical className="text-primary h-5 w-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                {/* Link to Profile Page */}
                <DropdownMenuItem asChild>
                  <Link
                    to="/profile"
                    className="flex items-center cursor-pointer"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>View Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Report User Alert Dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      <span>Report User</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-xs sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Report this peer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Is this user violating our community guidelines? Our
                        moderators will review this chat shortly. This action is
                        anonymous.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReportUser}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Report
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main scrolling message area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {isError && (
          <div className="text-center text-destructive text-sm py-8">
            Could not load messages.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => refetch()}
            >
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
              showAvatar={
                !msg.isSent && (index === 0 || messages[index - 1]?.isSent)
              }
            />
          ))}
        {!isLoading && !isError && messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Say hello to start the conversation.
          </p>
        )}
      </div>

      {/* Input bar stays fixed at the bottom */}
      <footer className="flex-none bg-card border-t border-border">
        <ChatInput onSend={handleSend} disabled={sending || isLoading} />
      </footer>
    </div>
  );
};

export default ChatRoom;
