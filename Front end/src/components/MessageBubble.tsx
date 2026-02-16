import { cn } from "@/lib/utils";
import AnonAvatar from "./AnonAvatar";

interface MessageBubbleProps {
  message: string;
  isSent: boolean;
  timestamp?: string;
  showAvatar?: boolean;
}

const MessageBubble = ({
  message,
  isSent,
  timestamp,
  showAvatar = true,
}: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        "flex gap-2 animate-fade-in",
        isSent ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isSent && showAvatar && <AnonAvatar size="sm" />}
      {!isSent && !showAvatar && <div className="w-8" />}
      
      <div
        className={cn(
          "max-w-[75%] px-4 py-3 rounded-2xl",
          isSent
            ? "bg-message-sent text-message-sent-foreground rounded-br-md"
            : "bg-message-received text-message-received-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed">{message}</p>
        {timestamp && (
          <span
            className={cn(
              "text-[10px] mt-1 block",
              isSent ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;