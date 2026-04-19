import ThemeToggleButton from "./ThemeToggle";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/forum": "Forum",
  "/chats": "Chats",
  "/profile": "Profile",
  "/auth": "Sign In"
};

const AppHeader = ({ customTitle }: { customTitle?: string }) => {
  const location = useLocation();
  const title = customTitle || pageTitles[location.pathname as keyof typeof pageTitles] || "PeerSpace";

  return (
    <header className="sticky top-0 bg-card border-b border-border px-4 py-4 z-50">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <ThemeToggleButton />
      </div>
    </header>
  );
};

export default AppHeader;

