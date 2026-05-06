import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, MailCheck, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";

export default function VerifyEmailNotice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(60);
  const intervalRef = useRef<number | null>(null);
  const loginState = (location.state || {}) as {
    login?: string;
    password?: string;
  };

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
    // #region agent log
    fetch('http://127.0.0.1:7692/ingest/3bec586b-ff7e-4500-8b67-d6e8fae76e58',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e43b30'},body:JSON.stringify({sessionId:'e43b30',runId:'initial',hypothesisId:'H1',location:'VerifyEmailNotice.tsx',message:'resend_clicked',data:{cooldown,submitting},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post("/api/email/verification-notification");
      // #region agent log
      fetch('http://127.0.0.1:7692/ingest/3bec586b-ff7e-4500-8b67-d6e8fae76e58',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e43b30'},body:JSON.stringify({sessionId:'e43b30',runId:'initial',hypothesisId:'H2',location:'VerifyEmailNotice.tsx',message:'resend_api_success',data:{status:res.status},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setMessage(
        res.data?.message || "Verification email sent. Check your inbox.",
      );
      notify.success(res.data?.message || "Verification email sent.");
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7692/ingest/3bec586b-ff7e-4500-8b67-d6e8fae76e58',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e43b30'},body:JSON.stringify({sessionId:'e43b30',runId:'initial',hypothesisId:'H3',location:'VerifyEmailNotice.tsx',message:'resend_api_error',data:{status:err?.response?.status,message:err?.response?.data?.message||err?.message},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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

  const goToForum = async () => {
    if (!submitting && loginState.login && loginState.password) {
      try {
        setSubmitting(true);
        await api.get("/sanctum/csrf-cookie");
        await api.post("/api/login", {
          login: loginState.login,
          password: loginState.password,
        });
      } catch {
        notify.error("Could not restore your session. Please log in again.");
        navigate("/auth", { replace: true });
        return;
      } finally {
        setSubmitting(false);
      }
    }
    navigate("/forum", { replace: true });
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && navigate(-1)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 focus:outline-none">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-foreground">
              Verify your email
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-2 -mr-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to your email address when you registered.
                Check your inbox and click the link to activate your account.
              </p>
            </div>

            {message && (
              <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {message}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={goToForum}>
                I&apos;ll do this later
              </Button>
              <Button
                disabled={submitting || cooldown > 0}
                onClick={resend}
                className="sm:min-w-[200px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : cooldown > 0 ? (
                  `Try again in ${cooldown}s`
                ) : (
                  "Resend verification email"
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
