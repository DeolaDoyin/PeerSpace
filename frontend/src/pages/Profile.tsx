import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Share2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import AppNavbar from "@/components/AppNavbar";
import AnonAvatar from "@/components/AnonAvatar";
import SettingsItem from "@/components/SettingsItem";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// ...existing code for Sheet removed; using AlertDialog modal instead
import ChangePasswordForm from "@/components/ChangePasswordForm";
import AboutUsModal from "@/components/AboutUsModal";

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileFieldErrors, setProfileFieldErrors] = useState<
    Record<string, string[]>
  >({});

  // Admin Category State
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  // Admin Promotion State
  const [promoteLogin, setPromoteLogin] = useState("");
  const [promoting, setPromoting] = useState(false);

  // Moderator Suspend State
  const [suspendLogin, setSuspendLogin] = useState("");
  const [suspending, setSuspending] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/user");
      return data;
    },
  });

  // Controlled sheet state for Change Password
  // Controlled dialog state for Change Password
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/api/user", { name: editName, email: editEmail });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      setIsEditing(false);
      setProfileFieldErrors({});
      setProfileError("");
      notify.success("Profile updated");
    } catch (error: any) {
      // Handle validation errors
      if (error?.response?.status === 422 && error.response.data?.errors) {
        setProfileFieldErrors(error.response.data.errors || {});
        const first = Object.values(error.response.data.errors)[0];
        setProfileError(
          Array.isArray(first) ? String(first[0]) : String(first),
        );
        return;
      }

      // Non-validation error
      setProfileError(extractErrorMessage(error) || "Failed to update profile");
      notify.error(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!catName.trim()) return;
    setCreatingCat(true);
    try {
      await api.post("/api/categories", {
        name: catName,
        description: catDesc,
      });
      setCatName("");
      setCatDesc("");
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      notify.success("Category created successfully!");
    } catch (error) {
      const e = error as any;
      const msg = extractErrorMessage(e) || "Failed to create category";
      try {
        notify.error(msg);
      } catch {}
    } finally {
      setCreatingCat(false);
    }
  };

  const handlePromote = async (role: string) => {
    if (!promoteLogin.trim()) return;
    setPromoting(true);
    try {
      const res = await api.post("/api/users/promote", {
        login: promoteLogin,
        role,
      });
      notify.success(res.data.message);
      setPromoteLogin("");
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } } };
      notify.error(extractErrorMessage(e));
    } finally {
      setPromoting(false);
    }
  };

  const handleSuspend = async (status: string) => {
    if (!suspendLogin.trim()) return;
    setSuspending(true);
    try {
      const res = await api.post("/api/users/suspend", {
        login: suspendLogin,
        status,
      });
      notify.success(res.data.message);
      setSuspendLogin("");
    } catch (error: any) {
      notify.error(extractErrorMessage(error));
    } finally {
      setSuspending(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Tell the server to invalidate the session
      await api.post("/api/logout");
    } catch (error) {
      const e = error as any;
      const msg = extractErrorMessage(e) || "Server logout failed";
      try {
        notify.error(msg);
      } catch {}
    } finally {
      // 2. Token logic removed. Rely on session invalidation.

      // 3. CRITICAL: Wipe the React Query cache
      // This forces the Navbar and other components to re-check auth
      queryClient.clear();

      // 4. Redirect
      navigate("/auth");
    }
  };

  const resendVerification = async () => {
    try {
      await api.post("/api/email/verification-notification");
      notify.success("Verification email sent. Check your inbox.");
    } catch (error: any) {
      if (error?.response?.status === 429) {
        const retryHeader = error?.response?.headers?.["retry-after"];
        const retry = parseInt(retryHeader, 10) || 60;
        notify.error(
          `Too many requests — please wait ${retry} second${retry !== 1 ? "s" : ""} and try again.`,
        );
        startCooldown(retry);
        return;
      }
      notify.error(
        extractErrorMessage(error) || "Failed to send verification email.",
      );
    }
  };

  // Cooldown timer for resend
  const [cooldown, setCooldown] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  // Track when Verify was last clicked (to show Resend button for 30 minutes)
  const LAST_VERIFY_KEY = "last_verify_clicked_at";
  const [lastVerifyAt, setLastVerifyAt] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem(LAST_VERIFY_KEY);
      return v ? parseInt(v, 10) : null;
    } catch (e) {
      return null;
    }
  });

  // Tick setter to force re-render so the 30-minute window UI updates
  const [, setTick] = useState<number>(0);
  const verifyIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (verifyIntervalRef.current) {
        window.clearInterval(verifyIntervalRef.current);
        verifyIntervalRef.current = null;
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

  // Keep a ticking timer while lastVerifyAt is set so the UI updates as the 30-minute window expires
  useEffect(() => {
    if (lastVerifyAt) {
      if (verifyIntervalRef.current) {
        window.clearInterval(verifyIntervalRef.current);
      }
      verifyIntervalRef.current = window.setInterval(() => {
        setTick(Date.now());
      }, 1000) as unknown as number;
    } else {
      if (verifyIntervalRef.current) {
        window.clearInterval(verifyIntervalRef.current);
        verifyIntervalRef.current = null;
      }
    }

    return () => {
      if (verifyIntervalRef.current) {
        window.clearInterval(verifyIntervalRef.current);
        verifyIntervalRef.current = null;
      }
    };
  }, [lastVerifyAt]);

  const isWithinVerifyWindow = () => {
    if (!lastVerifyAt) return false;
    return Date.now() - lastVerifyAt < 30 * 60 * 1000; // 30 minutes
  };

  const recordVerifyClick = () => {
    const now = Date.now();
    try {
      localStorage.setItem(LAST_VERIFY_KEY, String(now));
    } catch (e) {}
    setLastVerifyAt(now);
  };

  return (
    <div className="min-h-screen bg-background pb-20 transition-colors duration-300">
      {/* Navbar */}
      <AppNavbar />

      {/* Profile Card */}
      <div className="px-4 py-6 bg-card">
        <div className="flex items-start gap-4">
          <AnonAvatar size="xl" />
          <div className="flex-1 pt-2">
            {!isEditing ? (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  {isLoading ? "Loading..." : user?.name || "Anonymous User"}
                </h1>
                <p className="text-muted-foreground">{user?.email}</p>
                {/* Email verification status */}
                {user && !user.email_verified_at && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                      Email not verified
                    </div>
                    {/* If user clicked Verify within the last 30 minutes show Resend button + cooldown; otherwise show Verify button */}
                    {isWithinVerifyWindow() ? (
                      <button
                        onClick={async () => {
                          // Resend verification email
                          await resendVerification();
                        }}
                        className="text-sm underline text-primary"
                        disabled={cooldown > 0}
                      >
                        {cooldown > 0
                          ? `Try again in ${cooldown}s`
                          : "Resend verification"}
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          // Record that user clicked verify and send initial verification
                          recordVerifyClick();
                          await resendVerification();
                        }}
                        className="text-sm font-medium text-primary underline"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit Profile
                  </Button>
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setProfileFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.name;
                      return copy;
                    });
                    setProfileError("");
                  }}
                  className="w-full bg-muted border border-border p-2 rounded text-foreground text-sm font-medium"
                  placeholder="Anonymous Name"
                />
                {profileFieldErrors.name && (
                  <div className="mt-1 space-y-1">
                    {profileFieldErrors.name.map((m, i) => (
                      <p key={i} className="text-xs text-red-500">
                        {m}
                      </p>
                    ))}
                  </div>
                )}
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    setProfileFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.email;
                      return copy;
                    });
                    setProfileError("");
                  }}
                  className="w-full bg-muted border border-border p-2 rounded text-muted-foreground text-sm"
                  placeholder="Email alias"
                />
                {profileFieldErrors.email && (
                  <div className="mt-1 space-y-1">
                    {profileFieldErrors.email.map((m, i) => (
                      <p key={i} className="text-xs text-red-500">
                        {m}
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="gap-1 bg-primary text-primary-foreground"
                  >
                    <Check className="h-4 w-4" /> Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </div>
                {profileError && (
                  <div className="mt-3 p-2 text-sm text-red-500 bg-red-100 rounded-lg">
                    {profileError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Moderator Gateway */}
      {(user?.role === "admin" || user?.role === "moderator") && (
        <div className="mt-4 bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-orange-500 uppercase tracking-wide flex items-center gap-2">
              Moderation Tools
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Suspend/Restore User
              </label>
              <input
                type="text"
                value={suspendLogin}
                onChange={(e) => setSuspendLogin(e.target.value)}
                className="w-full bg-muted border border-border p-2 rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="User Alias or Email"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => handleSuspend("suspended")}
                  disabled={suspending || !suspendLogin.trim()}
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {suspending ? "Processing..." : "Suspend"}
                </Button>
                <Button
                  onClick={() => handleSuspend("active")}
                  disabled={suspending || !suspendLogin.trim()}
                  className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  Restore
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Settings (Only visible to admins) */}
      {user?.role === "admin" && (
        <div className="mt-4 bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-destructive uppercase tracking-wide flex items-center gap-2">
              Admin Gateway
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Launch New Space
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full bg-muted border border-border p-2 rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Category Name (e.g. Health)"
              />
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="w-full bg-muted border border-border p-2 rounded text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Short Description"
              />
              <Button
                onClick={handleCreateCategory}
                disabled={creatingCat || !catName.trim()}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 mt-2"
              >
                {creatingCat ? "Deploying space..." : "Create Category"}
              </Button>
            </div>

            {/* Horizontal line separator */}
            <div className="border-t border-border my-4"></div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Promote User
              </label>
              <input
                type="text"
                value={promoteLogin}
                onChange={(e) => setPromoteLogin(e.target.value)}
                className="w-full bg-muted border border-border p-2 rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="User Alias or Email"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => handlePromote("moderator")}
                  disabled={promoting || !promoteLogin.trim()}
                  className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  Make Moderator
                </Button>
                <Button
                  onClick={() => handlePromote("admin")}
                  disabled={promoting || !promoteLogin.trim()}
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Make Admin
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      <div className="mt-4 bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Settings
          </h2>
        </div>

        {/* Change Password Modal (controlled) */}
        {/** Use controlled AlertDialog so we can close it programmatically after success */}
        <AlertDialog
          open={dialogOpen}
          onOpenChange={(v: boolean) => setDialogOpen(v)}
        >
          <AlertDialogTrigger asChild>
            <div>
              <SettingsItem
                label="Change Password"
                onClick={() => setDialogOpen(true)}
              />
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <div className="relative">
              <AlertDialogHeader>
                <AlertDialogTitle>Change Password</AlertDialogTitle>
                {/* <AlertDialogDescription>
                  Update your account password. For security, you'll need to
                  enter your current password.
                </AlertDialogDescription> */}
              </AlertDialogHeader>

              {/* Top-right X close button */}
              <button
                onClick={() => setDialogOpen(false)}
                className="absolute right-3 top-3 text-muted-foreground p-1 rounded hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <ChangePasswordForm
                onSuccess={() => {
                  setDialogOpen(false);
                }}
              />
            </div>
          </AlertDialogContent>
        </AlertDialog>
        <SettingsItem
          label="Saved Posts"
          onClick={() => navigate("/saved-posts")}
        />
      </div>

      {/* Help Section */}
      <div className="mt-4 bg-card">
        <SettingsItem
          label="Help & Support"
          onClick={() => navigate("/#crisis")}
        />
        <SettingsItem label="Contact Us" onClick={() => navigate("/contact")} />
        <SettingsItem label="About Us" onClick={() => setAboutModalOpen(true)} />
      </div>

      {/* Danger Zone */}
      <div className="mt-4 bg-card">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-4 text-destructive hover:bg-muted/50 transition-colors">
              <span className="font-medium">Delete Account</span>
              <Trash2 className="h-5 w-5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                anonymous account and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Logout */}
      <div className="p-4">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      <AboutUsModal isOpen={aboutModalOpen} onOpenChange={setAboutModalOpen} />

      <BottomNav />
    </div>
  );
};

export default Profile;
