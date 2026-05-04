// for this to work the [ BROADCAST_CONNECTION=log ] in the .env must be set to log
import { useState, useRef, useEffect } from "react"; // Added useEffect
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
  
  // 1. Create a ref for the entire input container
  const containerRef = useRef<HTMLDivElement>(null);

  // 2. Add the "Click Outside" logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the picker is open and we click something NOT inside our containerRef
      if (showEmojiPicker && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const quickEmojis = [
    "😊", "😂", "🤣", "❤️", "😍", "🥰", "😎", "🤔", "🤨", "😐", 
    "🙄", "😏", "😴", "😮", "😱", "😢", "😭", "😤", "😡", "🥳", 
    "😇", "🤠", "🤡", "🤢", "🤯", "🫠", "✨", "🔥", "💯", "💢",
    "👍", "👎", "🙌", "🙏", "👏", "🤝", "👋", "✌️", "🤘", "🤟", 
    "🤞", "👊", "💪", "🧠", "🫂", "👀",
    "💬", "💭", "📢", "🌈", "☀️", "🌙", "⭐", "🍀", "🎉", "🎈", 
    "🎁", "🏆", "🎮", "🎵", "📷", "📍", "🛡️", "🔑", "🚀"
  ];

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
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large", { description: "Attachments are limited to 25MB." });
      e.target.value = "";
      return;
    }
    toast.info(`Selected: ${file.name}`, { description: "File upload logic is being integrated." });
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    document.getElementById("chat-input-field")?.focus();
  };

  return (
    // 3. Attach the containerRef here
    <div ref={containerRef} className="relative p-3 bg-card border-t border-border transition-colors duration-300">
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-card border border-border p-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50">
          <div className="grid grid-cols-6 gap-1 max-h-56 overflow-y-auto w-64 pr-2 custom-scrollbar">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-xl hover:scale-125 hover:bg-muted transition-all p-2 rounded-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
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
            autoComplete="off"
            value={message}
            disabled={disabled}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm disabled:opacity-50 text-foreground"
          />
          <button type="button" className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
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