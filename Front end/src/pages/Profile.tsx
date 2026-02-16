import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, Pencil, Share2, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
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
  const [notifications, setNotifications] = useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <button className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      {/* Profile Card */}
      <div className="px-4 py-6 bg-card">
        <div className="flex items-start gap-4">
          <AnonAvatar size="xl" />
          <div className="flex-1 pt-2">
            <h1 className="text-2xl font-bold text-foreground">Username</h1>
            <p className="text-muted-foreground">Anonymous User</p>
            
            <div className="flex gap-2 mt-3">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

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