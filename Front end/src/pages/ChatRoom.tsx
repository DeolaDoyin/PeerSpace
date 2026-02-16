import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Paperclip, MoreVertical } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import AnonAvatar from "@/components/AnonAvatar";

// Mock messages
const initialMessages = [
  {
    id: "1",
    message: "Hey, I saw you were online. How are you doing today?",
    isSent: false,
    timestamp: "2:30 PM",
  },
  {
    id: "2",
    message: "Hi! I'm okay, just feeling a bit overwhelmed with finals coming up.",
    isSent: true,
    timestamp: "2:32 PM",
  },
  {
    id: "3",
    message: "I totally understand. Finals can be really stressful. Want to talk about it?",
    isSent: false,
    timestamp: "2:33 PM",
  },
  {
    id: "4",
    message: "That would be nice. Sometimes it helps just to vent to someone who understands.",
    isSent: true,
    timestamp: "2:35 PM",
  },
];

const mockChatNames: Record<string, string> = {
  "1": "John Doe",
  "2": "Anonymous Helper",
  "3": "Study Buddy",
  "4": "Peer Support",
  "5": "Night Owl",
  "6": "Mindful Friend",
  "7": "Campus Listener",
  "8": "Wellness Warrior",
};

const ChatRoom = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [messages, setMessages] = useState(initialMessages);

  const chatName = mockChatNames[chatId || "1"] || "Anonymous Peer";

  const handleSend = (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      message,
      isSent: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chats")}
            className="p-1 -ml-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <AnonAvatar size="sm" />
            <h1 className="text-lg font-semibold text-foreground">{chatName}</h1>
          </div>
          
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            message={msg.message}
            isSent={msg.isSent}
            timestamp={msg.timestamp}
            showAvatar={
              !msg.isSent &&
              (index === 0 || messages[index - 1]?.isSent)
            }
          />
        ))}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default ChatRoom;