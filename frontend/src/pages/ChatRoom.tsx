import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2, MoreVertical, Flag, User, ShieldOff } from "lucide-react";
import api from "@/api/axios";
import { getEcho } from "@/lib/echo";
import { enqueueMessage, setupAutoFlush } from "@/lib/messageQueue";
import { notify } from "@/lib/notify"; 
import { toast } from "@/components/ui/toast";
import MessageBubble from "@/components/MessageBubble";
import ThemeToggleButton from "@/components/ThemeToggle";
import ChatInput from "@/components/ChatInput";
import AnonAvatar from "@/components/AnonAvatar";
import type { ChatListRow } from "@/pages/Chats";
import type { ChatMessageApi, MessageSentPayload } from "@/types";

// Crypto Helpers
import { encryptMessage, decryptMessage, importKeyFromString } from "@/lib/crypto";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface MessagesPage {
  data: ChatMessageApi[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

interface UiMessage {
  id: string;
  message: string;
  isSent: boolean;
  timestamp: string;
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
  const peerNameFromNav = (location.state as { peerName?: string } | null)?.peerName;

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);

  // State to store messages decrypted locally in memory
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});

  // If a key already exists in localStorage for this chat (e.g. page refresh),
  // mark it ready immediately so decryption doesn't wait for a new handshake.
  // If no key exists yet, stay false until the WebSocket handshake delivers one.
  const [roomKeyReady, setRoomKeyReady] = useState<boolean>(
    () => Boolean(localStorage.getItem(`room_key_${chatIdNum}`))
  );

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/user");
      return data as { id: number; name?: string };
    },
  });

  const { data: chatsResponse } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChatListRow[] }>("/api/chats");
      return data;
    },
    enabled: Boolean(user?.id && Number.isFinite(chatIdNum)),
  });

  const chatRows = chatsResponse?.data ?? [];

  const peerName = useMemo(() => {
    return (
      peerNameFromNav ??
      chatRows.find((c) => c.id === chatIdNum)?.peer?.name ??
      "Peer"
    );
  }, [peerNameFromNav, chatRows, chatIdNum]);

  const peerId = useMemo(() => {
    return chatRows.find((c) => c.id === chatIdNum)?.peer?.id;
  }, [chatRows, chatIdNum]);

  // Fetching raw payload records from backend
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

  // Decrypt page payloads — only runs if key is present
  const decryptPagePayloads = useCallback(async (rows: ChatMessageApi[]) => {
    const rawKeyStr = localStorage.getItem(`room_key_${chatIdNum}`);

    if (!rawKeyStr) {
      console.log("[Crypto] Decryption postponed: room key not established yet.");
      return;
    }

    console.log(`[Crypto] Attempting decryption of ${rows.length} rows with key: ${rawKeyStr.slice(0, 10)}...`);

    let cryptoKey: CryptoKey;
    try {
      cryptoKey = await importKeyFromString(rawKeyStr);
    } catch (err) {
      console.error("[Crypto] importKeyFromString failed — key string is malformed:", rawKeyStr, err);
      return;
    }

    const newDecryptedMap: Record<string, string> = {};

    await Promise.all(
      rows.map(async (row) => {
        if (!row.encrypted_payload || !row.iv) {
          console.warn(`[Crypto] Row ${row.id} skipped — missing encrypted_payload or iv:`, {
            has_payload: !!row.encrypted_payload,
            has_iv: !!row.iv,
            body: row.body,
          });
          return;
        }

        console.log(`[Crypto] Decrypting row ${row.id} — iv length: ${row.iv.length}, payload length: ${row.encrypted_payload.length}`);

        try {
          const plainText = await decryptMessage(row.encrypted_payload, row.iv, cryptoKey);
          newDecryptedMap[row.id] = plainText;
          console.log(`[Crypto] Row ${row.id} decrypted OK: "${plainText.slice(0, 30)}"`);
        } catch (e) {
          console.error(`[Crypto] Row ${row.id} FAILED. Key prefix: ${rawKeyStr.slice(0, 10)}, iv: ${row.iv}, payload prefix: ${row.encrypted_payload.slice(0, 20)}`, e);
          newDecryptedMap[row.id] = "[Error decrypting message payload]";
        }
      })
    );

    if (Object.keys(newDecryptedMap).length > 0) {
      setDecryptedMessages((prev) => ({ ...prev, ...newDecryptedMap }));
    }
  }, [chatIdNum]);

  // FIX: Use roomKeyReady instead of localStorage.getItem() in the dep array.
  // When the key arrives via WebSocket, setRoomKeyReady(true) triggers this effect.
  useEffect(() => {
    if (messagesPage?.data) {
      decryptPagePayloads(messagesPage.data);
    }
  }, [messagesPage?.data, decryptPagePayloads, roomKeyReady]);

  // Map messages dynamically for the visual layout pipeline
  const messages: UiMessage[] = useMemo(() => {
    if (!messagesPage?.data || !user?.id) return [];
    return messagesPage.data.map((m) => {
      return {
        id: String(m.id),
        message: decryptedMessages[m.id] || m.body || "Decrypting securely...",
        isSent: m.user_id === user.id,
        timestamp: m.created_at ? format(new Date(m.created_at), "p") : "",
      };
    });
  }, [messagesPage, user?.id, decryptedMessages]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Initialize Echo eagerly on mount so the socket ID resolver is registered
  // before any api.post calls are made (required for X-Socket-ID header).
  useEffect(() => {
    getEcho();
  }, []);

  useEffect(() => {
    if (!sending && !isLoading) {
      inputRef.current?.focus();
    }
  }, [sending, isLoading]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Key bootstrap: fetch from server or generate and save.
  // Using the server as the source of truth eliminates the WebSocket whisper
  // race condition where the key was sent before the peer had joined the channel.
  useEffect(() => {
    const uid = user?.id;
    if (!uid || !Number.isFinite(chatIdNum) || chatIdNum <= 0 || !peerId) return;

    const keyStorageKey = `room_key_${chatIdNum}`;

    const bootstrap = async () => {
      // Step 1: check localStorage first to avoid a network round-trip on refresh
      const cached = localStorage.getItem(keyStorageKey);
      if (cached) {
        setRoomKeyReady(true);
        return;
      }

      // Step 2: fetch key from server — it may already exist from the other peer
      try {
        const { data } = await api.get(`/api/chats/${chatIdNum}/room-key`);
        if (data.room_key) {
          localStorage.setItem(keyStorageKey, data.room_key);
          setRoomKeyReady(true);
          return;
        }
      } catch (e) {
        console.error("Failed to fetch room key from server:", e);
      }

      // Step 3: no key on server yet — lower-ID peer generates and saves it
      if (uid < peerId) {
        try {
          const { generateRandomRoomKeyString } = await import("@/lib/crypto");
          const newKey = await generateRandomRoomKeyString();

          // POST to server first — "first writer wins" so no race condition
          const { data } = await api.post(`/api/chats/${chatIdNum}/room-key`, {
            room_key: newKey,
          });

          // Use whatever the server saved (in case of a simultaneous write race)
          localStorage.setItem(keyStorageKey, data.room_key);
          setRoomKeyReady(true);
          toast.success("Secure end-to-end encryption established.");
          refetch();
        } catch (e) {
          console.error("Key generation failed:", e);
        }
      } else {
        // Higher-ID peer: server has no key yet, poll until the other peer saves one
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          try {
            const { data } = await api.get(`/api/chats/${chatIdNum}/room-key`);
            if (data.room_key) {
              clearInterval(poll);
              localStorage.setItem(keyStorageKey, data.room_key);
              setRoomKeyReady(true);
              toast.success("Secure channel synchronized.");
              refetch();
            }
          } catch (e) {
            console.error("Key poll failed:", e);
          }
          if (attempts >= 10) {
            clearInterval(poll);
            console.warn("Key exchange timed out after 10 attempts.");
          }
        }, 1500);

        return () => clearInterval(poll);
      }
    };

    bootstrap();
  }, [user?.id, chatIdNum, peerId, refetch]);

  // WebSocket for real-time messages only — key exchange is now server-side.
  // Intentionally does NOT depend on peerId so the listener registers immediately
  // on mount rather than waiting for the chats query to resolve.
  useEffect(() => {
    const uid = user?.id;
    if (!uid || !Number.isFinite(chatIdNum) || chatIdNum <= 0) return;

    const echo = getEcho();
    if (!echo) return;

    const room = `chat.${chatIdNum}`;
    const channel = echo.join(room);
    const keyStorageKey = `room_key_${chatIdNum}`;

    // refetch on join to catch any messages sent between page load and channel join
    channel.here(() => {
      refetch();
    });

    channel.listen(".message.sent", async (payload: MessageSentPayload) => {
      const row = payload.message;
      if (!row) return;

      // Always attempt decryption with whatever key is available at receive time
      const currentKey = localStorage.getItem(keyStorageKey);
      let targetMessageText = "[Encrypted]";

      if (currentKey && row.encrypted_payload && row.iv) {
        try {
          const cryptoKey = await importKeyFromString(currentKey);
          const plainText = await decryptMessage(row.encrypted_payload, row.iv, cryptoKey);
          targetMessageText = plainText;
          setDecryptedMessages((prev) => ({ ...prev, [row.id]: plainText }));
        } catch (e) {
          console.error("Real-time decryption failure:", e);
          targetMessageText = "[Encrypted Content Locked]";
        }
      }

      if (row.user_id !== uid) {
        try {
          notify.info(`${peerName || "Peer"}: ${targetMessageText}`);
        } catch (err) {
          console.error("Notification error:", err);
        }
      }

      const apiRow: ChatMessageApi = {
        id: row.id,
        chat_id: row.chat_id,
        user_id: row.user_id,
        body: row.body,
        encrypted_payload: row.encrypted_payload,
        iv: row.iv,
        created_at: row.created_at ?? new Date().toISOString(),
        sender: row.sender,
      };

      // Only add to state if it's from the other user — we already optimistically
      // added our own message in handleSend, so skip to avoid duplicates.
      if (row.user_id !== uid) {
        queryClient.setQueryData<MessagesPage | undefined>(
          ["chat-messages", chatIdNum],
          (prev) => mergeMessageIntoPage(prev, apiRow),
        );
      }
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    });

    return () => {
      echo.leave(room);
    };
  }, [user?.id, chatIdNum, queryClient, peerName]);

  useEffect(() => {
    const cleanup = setupAutoFlush();
    return cleanup;
  }, []);

  const handleReportUser = async () => {
    if (!chatIdNum) return;
    try {
      const res = await api.post(`/api/chats/${chatIdNum}/report-user`);
      notify.success(res.data.message || "User reported.");
    } catch (e) {
      console.error(e);
      notify.error("Failed to send report.");
    }
  };

  // Encrypt output string payloads before sending them over the wire
  const handleSend = useCallback(
    async (text: string) => {
      if (!user?.id || !Number.isFinite(chatIdNum)) return;

      const rawKeyStr = localStorage.getItem(`room_key_${chatIdNum}`);
      if (!rawKeyStr) {
        notify.error("Encryption key missing. Cannot send safe messages.");
        return;
      }

      setSending(true);
      try {
        const cryptoKey = await importKeyFromString(rawKeyStr);
        const { ciphertext, iv } = await encryptMessage(text, cryptoKey);

        const { data } = await api.post<ChatMessageApi>(
          `/api/chats/${chatIdNum}/messages`,
          {
            encrypted_payload: ciphertext,
            iv: iv,
          },
        );

        setDecryptedMessages((prev) => ({ ...prev, [data.id]: text }));

        queryClient.setQueryData<MessagesPage | undefined>(
          ["chat-messages", chatIdNum],
          (prev) => mergeMessageIntoPage(prev, data),
        );

        queryClient.invalidateQueries({ queryKey: ["chats"] });
      } catch (err) {
        console.error("ChatRoom Send Error:", err);
        enqueueMessage(chatIdNum, text);
        notify.error("Message queued due to an issue.");
      } finally {
        setSending(false);
      }
    },
    [chatIdNum, queryClient, user?.id],
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

  const handleBlockUser = async () => {
    if (!chatIdNum) return;
    try {
      const res = await api.post(`/api/chats/${chatIdNum}/block-user`);
      toast.success(res.data.message || "User blocked successfully.");
      navigate("/chats");
    } catch (e: any) {
      toast.error("Failed to block user.");
    }
  };

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
                  <MoreVertical className="text-primary h-5 w-5" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    to={peerId ? `/users/${peerId}` : "#"}
                    onClick={(e) => {
                      if (!peerId) e.preventDefault();
                    }}
                    className="flex items-center cursor-pointer"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>View Profile</span>
                  </Link>
                </DropdownMenuItem>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-amber-500 focus:text-amber-600 focus:bg-amber-500/10 cursor-pointer"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      <span>Report User</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-xs sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Report this user?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Anonymously flag misconduct or safety violations to system moderators.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReportUser}
                        className="bg-amber-500 text-white hover:bg-amber-600"
                      >
                        Report
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <DropdownMenuSeparator />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                    >
                      <ShieldOff className="h-4 w-4 mr-2" />
                      <span>Block User</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-xs sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Block this peer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will no longer receive messages from this user.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBlockUser}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Block
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

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

      <footer className="flex-none bg-card border-t border-border">
        <ChatInput ref={inputRef} onSend={handleSend} disabled={sending || isLoading} />
      </footer>
    </div>
  );
};

export default ChatRoom;