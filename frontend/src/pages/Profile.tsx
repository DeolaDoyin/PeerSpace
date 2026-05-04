import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Menu,
  Pencil,
  Share2,
  Trash2,
  Check,
  X,
  LibraryBig,
  MessageCircle,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggleButton from "@/components/ThemeToggle";
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

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState(false);
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
      // 2. Clear the token from storage
      localStorage.removeItem("token");

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

  return (
    <div className="min-h-screen bg-background pb-20 transition-colors duration-300">
     {/* Header */}
    <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Hamburger removed as requested since BottomNav handles navigation */}
          <Link to="/">
            <h1 className="text-xl font-bold text-primary">PeerSpace</h1>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {/* 
              These navigation links stay hidden on mobile 
              because they are redundant with your BottomNav.
          */}
          <div className="hidden md:flex items-center gap-2 mr-2">
            <Link
              to="/chats"
              title="Chats"
              className="text-primary p-2 hover:bg-muted rounded-full transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
            <Link
              to="/forum"
              title="Forum"
              className="text-primary p-2 hover:bg-muted rounded-full transition-colors"
            >
              <LibraryBig className="h-5 w-5" />
            </Link>
          </div>

          {/* 
              Moved these OUTSIDE the hidden div.
              Now Theme and Notifications are always available on mobile profile view. 
          */}
          <ThemeToggleButton />
          <NotificationBell />
        </div>
      </div>
    </header>

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
                    <button
                      onClick={resendVerification}
                      className="text-sm underline text-primary"
                      disabled={cooldown > 0}
                    >
                      {cooldown > 0
                        ? `Try again in ${cooldown}s`
                        : "Resend verification"}
                    </button>
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

        <SettingsItem label="Change Password" onClick={() => {}} />
        <SettingsItem
          label="Notifications"
          hasArrow={false}
          hasCheckbox
          checked={notifications}
          onCheckedChange={setNotifications}
        />
      </div>

      {/* Help Section */}
      <div className="mt-4 bg-card">
        <SettingsItem
          label="Help & Support"
          onClick={() => navigate("/#crisis")}
        />
        <SettingsItem label="Contact Us" onClick={() => navigate("/contact")} />
        <SettingsItem label="About Us" onClick={() => {}} />
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

      <BottomNav />
    </div>
  );
};

export default Profile;
