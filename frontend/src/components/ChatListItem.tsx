import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import AnonAvatar from "./AnonAvatar";
// 💡 Importing your custom crypto core handlers
import { decryptMessage, importKeyFromString } from "@/lib/crypto"; 

interface ChatListItemProps {
  id: number; // 💡 Accepts the specific row's room ID
  name: string;
  lastMessage: string;
  time: string;
  onClick?: () => void;
  isActive?: boolean;
  encryptedPayload?: string | null;
  iv?: string | null;
}

const ChatListItem = ({
  id,
  name,
  lastMessage,
  time,
  onClick,
  isActive,
  encryptedPayload,
  iv,
}: ChatListItemProps) => {
  const [displayMessage, setDisplayMessage] = useState(lastMessage);

  useEffect(() => {
    const performDecryption = async () => {
      if (encryptedPayload && iv) {
        try {
          // 💡 FIXED: Matches the exact dynamic naming convention used in ChatRoom.tsx!
          const rawKeyStr = localStorage.getItem(`room_key_${id}`); 
          
          if (!rawKeyStr) {
            // If the user hasn't opened this chat room on this browser session yet, show a clean fallback
            setDisplayMessage("[Encrypted Message]");
            return;
          }

          // Use your built-in custom string loader function to instantiate the CryptoKey mapping object
          const cryptoKey = await importKeyFromString(rawKeyStr);
          
          // Execute your core Web Crypto API decrypt utility method
          const decrypted = await decryptMessage(encryptedPayload, iv, cryptoKey);
          
          // Apply a clean 80-character maximum line clipping layout to keep the sidebar uniform
          setDisplayMessage(decrypted.length > 80 ? `${decrypted.slice(0, 80)}…` : decrypted);
        } catch (err) {
          console.error(`Decryption failed for room ${id}:`, err);
          setDisplayMessage("[Encrypted Message]");
        }
      } else {
        // Safe standard plain text fallback layout path (e.g. "No messages yet")
        setDisplayMessage(lastMessage);
      }
    };

    void performDecryption();
  }, [id, encryptedPayload, iv, lastMessage]);

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
        <p className="text-sm text-muted-foreground truncate">{displayMessage}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {time}
      </span>
    </button>
  );
};

export default ChatListItem;