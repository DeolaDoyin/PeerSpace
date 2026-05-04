import { useState, useEffect, useRef } from "react";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  onSuccess?: () => void;
}

const ChangePasswordForm = ({ onSuccess }: Props) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentRef = useRef<HTMLInputElement | null>(null);

  // Focus the current password input when the form mounts (modal opened)
  useEffect(() => {
    try {
      currentRef.current?.focus();
    } catch (e) {}
  }, []);

  const submit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await api.patch("/api/user/password", {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      notify.success(res.data?.message || "Password updated");
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
      onSuccess?.();
    } catch (e: any) {
      if (e?.response?.status === 422 && e.response.data?.errors) {
        setErrors(e.response.data.errors || {});
      } else {
        notify.error(extractErrorMessage(e) || "Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  };

  const clientValid = () => {
    if (!currentPassword.trim()) return false;
    if (!password.trim()) return false;
    if (password !== passwordConfirmation) return false;
    if (password.length < 8) return false;
    return true;
  };

  const scorePassword = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score; // 0..4
  };

  const strength = scorePassword(password);
  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"][
    strength
  ];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Current password</label>
        <div className="relative mt-1">
          <input
            ref={currentRef}
            type={showCurrent ? "text" : "password"}
            aria-label="Current password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-muted border border-border p-2 rounded text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-1 rounded"
            aria-label={
              showCurrent ? "Hide current password" : "Show current password"
            }
          >
            {showCurrent ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.current_password && (
          <p className="text-xs text-destructive mt-1">
            {errors.current_password[0]}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">New password</label>
        <div className="relative mt-1">
          <input
            type={showNew ? "text" : "password"}
            aria-label="New password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-muted border border-border p-2 rounded text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNew((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-1 rounded"
            aria-label={showNew ? "Hide new password" : "Show new password"}
          >
            {showNew ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="mt-2">
          <div className="h-2 w-full bg-muted rounded overflow-hidden">
            <div
              className={`h-full transition-all ${
                strength >= 4
                  ? "bg-emerald-500"
                  : strength >= 3
                    ? "bg-yellow-400"
                    : "bg-destructive"
              } ${
                strength === 0
                  ? "w-0"
                  : strength === 1
                    ? "w-1/4"
                    : strength === 2
                      ? "w-1/2"
                      : strength === 3
                        ? "w-3/4"
                        : "w-full"
              }`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{strengthLabel}</p>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive mt-1">{errors.password[0]}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Confirm new password</label>
        <div className="relative mt-1">
          <input
            type={showConfirm ? "text" : "password"}
            aria-label="Confirm new password"
            placeholder="Confirm new password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="w-full bg-muted border border-border p-2 rounded text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-1 rounded"
            aria-label={
              showConfirm ? "Hide confirm password" : "Show confirm password"
            }
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password_confirmation && (
          <p className="text-xs text-destructive mt-1">
            {errors.password_confirmation[0]}
          </p>
        )}
      </div>

      <div className="pt-4">
        <div className="flex justify-center">
          <Button
            onClick={submit}
            disabled={!clientValid() || loading}
            className="bg-primary text-primary-foreground"
          >
            {loading ? "Saving..." : "Change password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
