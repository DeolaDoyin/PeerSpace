import { useState, useEffect, useRef } from "react";
import api from "@/api/axios";
import { notify } from "@/lib/notify";

export default function VerifyEmailNotice() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  const resend = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post("/api/email/verification-notification");
      setMessage(
        res.data?.message || "Verification email sent. Check your inbox.",
      );
      notify.success(res.data?.message || "Verification email sent.");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        const retryHeader = err?.response?.headers?.["retry-after"];
        const retry = parseInt(retryHeader, 10) || 60;
        const waitMsg = `Too many requests — please wait ${retry} second${retry !== 1 ? "s" : ""} and try again.`;
        setMessage(waitMsg);
        notify.error(waitMsg);
        startCooldown(retry);
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to send verification email.";
        setMessage(msg);
        notify.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Verify your email</h1>
      <p className="mb-4">
        We sent a verification link to your email address when you registered.
        Please check your inbox and click the link to verify your account.
      </p>
      {message && <div className="mb-4 text-sm text-gray-700">{message}</div>}
      <button
        className="btn btn-primary"
        disabled={submitting || cooldown > 0}
        onClick={resend}
      >
        {submitting
          ? "Sending…"
          : cooldown > 0
            ? `Try again in ${cooldown}s`
            : "Resend verification email"}
      </button>
    </div>
  );
}
