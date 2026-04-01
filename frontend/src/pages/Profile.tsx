import api from "@/api/axios";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Menu, Pencil, Share2, Trash2, Check, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
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

  // Admin Category State
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  // Admin Promotion State
  const [promoteLogin, setPromoteLogin] = useState("");
  const [promoting, setPromoting] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await api.get('/api/user');
      return data;
    }
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
      await api.put('/api/user', { name: editName, email: editEmail });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!catName.trim()) return;
    setCreatingCat(true);
    try {
      await api.post('/api/categories', { name: catName, description: catDesc });
      setCatName("");
      setCatDesc("");
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      alert("Category created successfully!");
    } catch (error) {
       console.error("Failed to create category", error);
       alert("Failed to create category. Make sure the name is unique!");
    } finally {
      setCreatingCat(false);
    }
  };

  const handlePromote = async (role: string) => {
    if (!promoteLogin.trim()) return;
    setPromoting(true);
    try {
      const res = await api.post('/api/users/promote', { login: promoteLogin, role });
      alert(res.data.message);
      setPromoteLogin("");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to promote user. Check the alias.");
    } finally {
      setPromoting(false);
    }
  };

  const handleLogout = async () => {
    try {
        // Tell Laravel to kill the session/token
        await api.post('/api/logout');
    } catch (error) {
        console.error("Server logout failed", error);
    } finally {
        //Clear token from local storage
        localStorage.removeItem('token');
        navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          
          <Link to="/">
            <h1 className="text-xl font-bold text-primary">PeerSpace</h1>
          </Link>

          <NotificationBell />
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
                <div className="flex gap-2 mt-3">
                  <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setIsEditing(true)}>
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
                  onChange={e => setEditName(e.target.value)} 
                  className="w-full bg-muted border border-border p-2 rounded text-foreground text-sm font-medium" 
                  placeholder="Anonymous Name"
                />
                <input 
                  type="email" 
                  value={editEmail} 
                  onChange={e => setEditEmail(e.target.value)} 
                  className="w-full bg-muted border border-border p-2 rounded text-muted-foreground text-sm" 
                  placeholder="Email alias"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="gap-1 bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" /> Save
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)} disabled={saving} className="gap-1">
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Settings (Only visible to admins) */}
      {user?.role === 'admin' && (
        <div className="mt-4 bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-destructive uppercase tracking-wide flex items-center gap-2">
              Admin Gateway
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Launch New Space</label>
              <input 
                type="text" 
                value={catName} 
                onChange={e => setCatName(e.target.value)} 
                className="w-full bg-muted border border-border p-2 rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                placeholder="Category Name (e.g. Health)"
              />
              <input 
                type="text" 
                value={catDesc} 
                onChange={e => setCatDesc(e.target.value)} 
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
              <label className="text-xs font-semibold uppercase text-muted-foreground">Promote User</label>
              <input 
                type="text" 
                value={promoteLogin} 
                onChange={e => setPromoteLogin(e.target.value)} 
                className="w-full bg-muted border border-border p-2 rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                placeholder="User Alias or Email"
              />
              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={() => handlePromote('moderator')} 
                  disabled={promoting || !promoteLogin.trim()} 
                  className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  Make Moderator
                </Button>
                <Button 
                  onClick={() => handlePromote('admin')} 
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
        <SettingsItem label="Help & Support" onClick={() => {}} />
        <SettingsItem label="FAQ" onClick={() => {}} />
        <SettingsItem label="About Us" onClick={() => {}} />
        <SettingsItem label="More" onClick={() => {}} />
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
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          Log Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
