import { useState } from "react";
import { Plus, Smile, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput = ({ onSend }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-card border-t border-border">
      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
        <Plus className="h-5 w-5" />
      </button>
      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
        <Smile className="h-5 w-5" />
      </button>
      
      <div className="flex-1 flex items-center bg-muted rounded-full px-4 py-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-transparent outline-none text-sm"
        />
        <button className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <Search className="h-4 w-4" />
        </button>
      </div>
      
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className={cn(
          "p-2 rounded-full transition-colors",
          message.trim()
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground"
        )}
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ChatInput;