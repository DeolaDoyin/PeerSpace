import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/api/axios";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const hasVerified = useRef(false);

  useEffect(() => {
    // Prevent double verification on React Strict Mode
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyEmail = async () => {
      const params = new URLSearchParams(location.search);
      const id = params.get("id");
      const hash = params.get("hash");
      const expires = params.get("expires");
      const signature = params.get("signature");

      if (!id || !hash || !expires || !signature) {
        setStatus("error");
        setMessage("Invalid or missing verification link parameters.");
        return;
      }

      try {
        await api.get("/sanctum/csrf-cookie");
        const response = await api.get(`/api/email/verify/${id}/${hash}`, {
          params: { expires, signature },
        });

        setStatus("success");
        setMessage(response.data?.message || "Email verified successfully!");
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Failed to verify email. The link may have expired or is invalid."
        );
      }
    };

    verifyEmail();
  }, [location]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-foreground">{message}</h2>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Email Verified!
            </h2>
            <p className="text-muted-foreground mb-8">{message}</p>
            <Button
              onClick={() => navigate("/forum")}
              className="w-full"
              size="lg"
            >
              Continue to PeerSpace
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Verification Failed
            </h2>
            <p className="text-muted-foreground mb-8">{message}</p>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={() => navigate("/auth")}
                className="w-full"
                size="lg"
              >
                Go to Login
              </Button>
              <Button
                onClick={() => navigate("/verify-email")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Resend Verification Link
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
