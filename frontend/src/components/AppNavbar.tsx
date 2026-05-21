import {
  // Menu,
  Heart,
  RefreshCcw,
  User,
  LibraryBig,
  MessageCircle,
  ShieldAlert,
} from "lucide-react"; // Updated icons
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggleButton from "@/components/ThemeToggle";

interface AppNavbarProps {
  /** Optional slot rendered between the logo and right-side controls */
  centerSlot?: React.ReactNode;
  /** Optional extra controls to render on the right (e.g., back button) */
  extraControls?: React.ReactNode;
}

const AppNavbar = ({ centerSlot, extraControls }: AppNavbarProps) => {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get("/api/user");
      return data as { id: number; role?: string };
    },
  });

  const isModOrAdmin = user?.role === "admin" || user?.role === "moderator";

  // Helper to check if a link should be hidden
  const isPage = (path: string) => location.pathname === path;

  // Safe refresh handler: dispatch a custom event so the Forum page (or any
  // interested consumer) can listen and trigger a re-fetch. This avoids
  // referencing query hooks or other page-specific state from the navbar.
  const handleRefresh = () => {
    try {
      window.dispatchEvent(new CustomEvent("peerspace:forum-refresh"));
    } catch (e) {
      // Fallback: force a full reload if CustomEvent isn't supported
      try {
        window.location.reload();
      } catch {}
    }
  };

  return (
    <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10 transition-colors duration-300">
      <div className="flex items-center justify-between">
        {/* Left: menu + logo + extraControls */}
        <div className="flex items-center gap-2">
          {/* If extraControls exists (like your back button), show it; 
              otherwise show the default menu icon */}
          {/* {extraControls ? (
            extraControls
          ) : (
            <button className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          )} */}

          <Link to="/"  className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary/20" />
            <h1 className="text-xl font-bold text-foreground">PeerSpace</h1>          
          </Link>
        </div>

        {/* Optional center content (e.g. Search or Page Title) */}
        {centerSlot && (
          <div className="flex-1 mx-4 hidden sm:block">{centerSlot}</div>
        )}

        {/* Right-side controls */}
        <div className="flex items-center gap-1">
          {/* Mobile View: Show only toggles/notifications (and any extraControls if provided) */}
          <div className="flex md:hidden items-center gap-1">
            {extraControls}
            {isModOrAdmin && !isPage("/reports") && (
              <Link
                to="/reports"
                title="Reports"
                className="text-destructive p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ShieldAlert className="h-5 w-5" />
              </Link>
            )}
            <ThemeToggleButton />
            <NotificationBell />
          </div>

          {/* Desktop View: Show Quick Links + Toggles */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            {extraControls}

            {/* Conditionally render links based on current path */}
            {isPage("/forum") && (
              <button
                onClick={handleRefresh}
                title="Refresh"
                className="text-primary p-2 hover:bg-muted rounded-full"
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
            )}

            {!isPage("/chats") && (
              <Link
                to="/chats"
                title="Chats"
                className="text-primary p-2 hover:bg-muted rounded-full transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            )}

            {!isPage("/forum") && (
              <Link
                to="/forum"
                title="Forum"
                className="text-primary p-2 hover:bg-muted rounded-full transition-colors"
              >
                <LibraryBig className="h-5 w-5" />
              </Link>
            )}

            {!isPage("/profile") && (
              <Link
                to="/profile"
                title="Profile"
                className="text-primary p-2 hover:bg-muted rounded-full transition-colors"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            {isModOrAdmin && !isPage("/reports") && (
              <Link
                to="/reports"
                title="Reports"
                className="text-destructive p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ShieldAlert className="h-5 w-5" />
              </Link>
            )}

            <ThemeToggleButton />
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
