import { MessageCircle, Users, User } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/chats", icon: MessageCircle, label: "Chats" },
  { to: "/forum", icon: Users, label: "Forum" },
  { to: "/profile", icon: User, label: "User" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-2xl transition-all duration-200",
              "text-muted-foreground hover:text-foreground"
            )}
            activeClassName="bg-nav-active text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;