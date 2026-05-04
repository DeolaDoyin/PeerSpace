import { Menu, User, LibraryBig, MessageCircle } from "lucide-react"; // Updated icons
import { Link } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggleButton from "@/components/ThemeToggle";

interface AppNavbarProps {
  /** Optional slot rendered between the logo and right-side controls */
  centerSlot?: React.ReactNode;
  /** Added: slot for back buttons or extra tools on the left */
  extraControls?: React.ReactNode;
}

const AppNavbar = ({ centerSlot, extraControls }: AppNavbarProps) => {
  return (
    <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10 transition-colors duration-300">
      <div className="flex items-center justify-between">
        {/* Left: menu + logo + extraControls */}
        <div className="flex items-center gap-2">
          {/* If extraControls exists (like your back button), show it; 
              otherwise show the default menu icon */}
          {extraControls ? (
            extraControls
          ) : (
            <button className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to="/">
            <h1 className="text-xl font-bold text-primary">PeerSpace</h1>
          </Link>
        </div>

        {/* Optional center content (e.g. Search or Page Title) */}
        {centerSlot && (
          <div className="flex-1 mx-4 hidden sm:block">{centerSlot}</div>
        )}

        {/* Right-side controls */}
        <div className="flex items-center gap-1">
          {/* Mobile View: Show only toggles/notifications */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggleButton />
            <NotificationBell />
          </div>

          {/* Desktop View: Show Quick Links + Toggles */}
          <div className="hidden md:flex items-center gap-2 ml-2">
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

            <Link
              to="/profile"
              title="Profile"
              className="text-primary p-2 hover:bg-muted rounded-full transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>

            <ThemeToggleButton />
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
