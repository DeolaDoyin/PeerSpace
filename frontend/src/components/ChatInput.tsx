// for this to work the [ BROADCAST_CONNECTION=log ] in the .env must be set to log in order for the chats to be posted smoothly without reloading the page, till a proper webserver is added to handle it.
import { useState, useRef } from "react";
import { Plus, Smile, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled = false }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick emoji list for the demo
  const quickEmojis = ["😊", "😂", "❤️", "👍", "🙌", "🙏", "😮", "😢"];

  const handleSend = async () => {
    if (message.trim() && !disabled) {
      await onSend(message.trim());
      setMessage("");
      setShowEmojiPicker(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  // 1. Check file size first
  if (file.size > MAX_FILE_SIZE) {
    toast.error("File is too large", {
      description: "Attachments are limited to 25MB for security.",
    });
    // Clear the input so the user can try a different file
    e.target.value = "";
    return;
  }

  // 2. If size is okay, show the "Coming Soon" status
  toast.info(`Selected: ${file.name}`, {
    description: "File upload logic is being integrated into PeerSpace.",
    action: {
      label: "Clear",
      onClick: () => { e.target.value = ""; }
    },
  });

  // Future: This is where you'll call your upload API
  // uploadFile(file);
};

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    // Keep focus on the input after adding an emoji
    document.getElementById("chat-input-field")?.focus();
  };

  return (
    <div className="relative p-3 bg-card border-t border-border transition-colors duration-300">
      {/* Emoji Quick Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-card border border-border p-2 rounded-xl shadow-2xl flex gap-2 animate-in fade-in slide-in-from-bottom-2 z-50">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-xl hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded-full"
        >
          <Plus className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            "p-2 transition-colors rounded-full",
            showEmojiPicker ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Smile className="h-5 w-5" />
        </button>

        <div className="flex-1 flex items-center bg-muted rounded-full px-4 py-2">
          <input
            id="chat-input-field"
            type="text"
            value={message}
            disabled={disabled}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm disabled:opacity-50 text-foreground"
          />
          <button className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={disabled || !message.trim()}
          className={cn(
            "p-2 rounded-full transition-all",
            message.trim()
              ? "bg-primary text-primary-foreground scale-110 shadow-md"
              : "text-muted-foreground bg-transparent"
          )}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;