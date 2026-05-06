import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import FloatingInput from "@/components/FloatingInput";
import ThemeToggleButton from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Extract token and email from URL parameters
    const params = new URLSearchParams(location.search);
    const urlEmail = params.get("email");
    const urlToken = params.get("token");

    if (!urlToken) {
      notify.error("Invalid or missing password reset token");
      navigate("/auth");
      return;
    }

    if (urlEmail) setEmail(urlEmail);
    if (urlToken) setToken(urlToken);
  }, [location, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!password || password.length < 8) {
      newErrors.password = "Min 8 characters required";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/api/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });
      
      notify.success("Password has been reset successfully. You can now login.");
      navigate("/auth");
    } catch (err: any) {
      if (err.response?.status === 422) {
        const serverErrors: any = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          serverErrors[key] = err.response.data.errors[key][0];
        });
        setErrors(serverErrors);
        notify.error("Please fix the validation errors");
      } else {
        notify.error("Failed to reset password. The link may have expired.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300 relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggleButton />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Set New Password</h1>
            <p className="text-muted-foreground">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FloatingInput
              label="Email Address"
              type="email"
              value={email}
              disabled
              readOnly
            />

            <FloatingInput
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.password;
                  return copy;
                });
              }}
              error={errors.password}
              autoComplete="new-password"
            />

            <FloatingInput
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.confirmPassword;
                  return copy;
                });
              }}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="w-full h-12 text-base rounded-xl mt-4"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </Button>
            
            <div className="text-center mt-4">
              <Button
                variant="link"
                type="button"
                onClick={() => navigate("/auth")}
                className="text-muted-foreground"
              >
                Back to Login
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
