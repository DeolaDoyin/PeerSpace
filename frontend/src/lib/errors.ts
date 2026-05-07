import type { AxiosError } from "axios";
import type { ApiValidationErrors } from "@/types";

export function extractErrorMessage(err: unknown): string {
  const e = err as AxiosError<ApiValidationErrors | { message?: string } | string>;
  if (e?.response?.data) {
    const d = e.response.data;
    if (typeof d === "string") return d;
    if (d.message) return String(d.message);
    if ("errors" in d && d.errors) {
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
