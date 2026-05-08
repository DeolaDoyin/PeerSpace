import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import FloatingInput from "@/components/FloatingInput";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onOpenChange,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
      // Just a simple GET to wake the server up while the user is typing their email
      fetch('https://peerspace-aiyh.onrender.com/api/user')
          .catch(() => console.log("Waking up server..."));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      notify.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/api/forgot-password", { email });
      setIsSuccess(true);
      notify.success("Password reset link sent to your email");
    } catch (err: any) {
      if (err.response?.status === 422) {
        notify.error(err.response.data.errors?.email?.[0] || "Invalid email address");
      } else {
        notify.error("Something went wrong. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after modal is closed
    setTimeout(() => {
      setEmail("");
      setIsSuccess(false);
    }, 300);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={isSuccess ? handleClose : onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 z-50 animate-in zoom-in-95 duration-200 focus:outline-none">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-foreground">
              Reset Password
            </Dialog.Title>
            <Dialog.Close asChild onClick={handleClose}>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors p-2 -mr-2 rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Check your email</h3>
              <p className="text-muted-foreground mb-6">
                We've sent a password reset link to <br />
                <span className="font-semibold text-foreground">{email}</span>
              </p>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>
              
              <FloatingInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !email}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
