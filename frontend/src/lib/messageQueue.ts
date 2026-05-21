import api from "@/api/axios";

interface QueuedMessage {
  id: string;
  chatId: number;
  body: string;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = "peerspace_message_queue";
const MAX_RETRIES = 5;

function getQueue(): QueuedMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMessage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueMessage(chatId: number, body: string): string {
  const queue = getQueue();
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({ id, chatId, body, timestamp: Date.now(), retries: 0 });
  saveQueue(queue);
  return id;
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((m) => m.id !== id);
  saveQueue(queue);
}

export function getQueuedMessages(chatId?: number): QueuedMessage[] {
  const queue = getQueue();
  return chatId ? queue.filter((m) => m.chatId === chatId) : queue;
}

export async function flushQueue(): Promise<{ sent: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const remaining: QueuedMessage[] = [];

  for (const msg of queue) {
    try {
      await api.post(`/api/chats/${msg.chatId}/messages`, { body: msg.body });
      sent++;
    } catch {
      msg.retries++;
      if (msg.retries < MAX_RETRIES) {
        remaining.push(msg);
      } else {
        failed++;
      }
    }
  }

  saveQueue(remaining);
  return { sent, failed };
}

export function setupAutoFlush(): () => void {
  const handler = () => {
    if (navigator.onLine) {
      flushQueue();
    }
  };

  window.addEventListener("online", handler);
  const interval = setInterval(handler, 30_000);

  return () => {
    window.removeEventListener("online", handler);
    clearInterval(interval);
  };
}
