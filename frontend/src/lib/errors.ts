import type { AxiosError } from "axios";

export function extractErrorMessage(err: unknown): string {
  const e = err as AxiosError & { response?: { data?: any } };
  // Validation errors from Laravel: response.data.errors (object) or message
  if (e?.response?.data) {
    const d = e.response.data;
    if (typeof d === "string") return d;
    if (d.message) return String(d.message);
    if (d.errors) {
      // Flatten validation messages to a single string
      try {
        const msgs = Object.values(d.errors).flat();
        return Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
      } catch {
        // fallthrough
      }
    }
  }
  if (e?.message) return e.message;
  return "An unexpected error occurred.";
}
