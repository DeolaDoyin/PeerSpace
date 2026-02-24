import { cn } from "@/lib/utils";
import AnonAvatar from "./AnonAvatar";

interface ChatListItemProps {
  name: string;
  lastMessage: string;
  time: string;
  onClick?: () => void;
  isActive?: boolean;
}

const ChatListItem = ({
  name,
  lastMessage,
  time,
  onClick,
  isActive,
}: ChatListItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 transition-colors duration-150",
        "hover:bg-muted/50 border-b border-border last:border-b-0",
        isActive && "bg-muted"
      )}
    >
      <AnonAvatar size="md" />
      <div className="flex-1 min-w-0 text-left">
        <h3 className="font-semibold text-foreground truncate">{name}</h3>
        <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {time}
      </span>
    </button>
  );
};

export default ChatListItem;
