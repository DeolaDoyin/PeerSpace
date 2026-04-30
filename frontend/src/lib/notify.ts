import { toast as sonner } from "@/components/ui/toast";

const recent = new Map<string, number>();
const DEDUPE_MS = 3000;

function shouldShow(key: string) {
  const now = Date.now();
  const prev = recent.get(key) ?? 0;
  if (now - prev < DEDUPE_MS) return false;
  recent.set(key, now);
  // Cleanup old entries occasionally
  if (recent.size > 100) {
    for (const [k, t] of recent.entries()) {
      if (now - t > DEDUPE_MS * 5) recent.delete(k);
    }
  }
  return true;
}

export const notify = {
  info: (msg: string) => {
    if (!shouldShow(`info:${msg}`)) return;
    sonner(msg);
  },
  success: (msg: string) => {
    if (!shouldShow(`success:${msg}`)) return;
    sonner(msg);
  },
  error: (msg: string) => {
    if (!shouldShow(`error:${msg}`)) return;
    sonner.error(msg);
  },
};

export default notify;
