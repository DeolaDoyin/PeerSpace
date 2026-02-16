import { useNavigate } from "react-router-dom";
import ChatListItem from "@/components/ChatListItem";
import BottomNav from "@/components/BottomNav";

// Mock data for demonstration
const mockChats = [
  {
    id: "1",
    name: "John Doe",
    lastMessage: "Supporting line text lorem ipsum dolor si...",
    time: "10 min",
  },
  {
    id: "2",
    name: "Anonymous Helper",
    lastMessage: "I understand how you feel. Want to talk more?",
    time: "25 min",
  },
  {
    id: "3",
    name: "Study Buddy",
    lastMessage: "Thanks for listening to me today!",
    time: "1 hr",
  },
  {
    id: "4",
    name: "Peer Support",
    lastMessage: "You're not alone in this journey.",
    time: "2 hr",
  },
  {
    id: "5",
    name: "Night Owl",
    lastMessage: "Late night thoughts can be tough...",
    time: "3 hr",
  },
  {
    id: "6",
    name: "Mindful Friend",
    lastMessage: "Have you tried that breathing exercise?",
    time: "5 hr",
  },
  {
    id: "7",
    name: "Campus Listener",
    lastMessage: "The exam stress is real but manageable.",
    time: "1 day",
  },
  {
    id: "8",
    name: "Wellness Warrior",
    lastMessage: "Remember to take breaks!",
    time: "2 days",
  },
];

const Chats = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border px-4 py-4 z-10">
        <h1 className="text-xl font-semibold text-foreground">Chats</h1>
      </header>

      {/* Chat List */}
      <div className="bg-card">
        {mockChats.map((chat) => (
          <ChatListItem
            key={chat.id}
            name={chat.name}
            lastMessage={chat.lastMessage}
            time={chat.time}
            onClick={() => navigate(`/chat/${chat.id}`)}
          />
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chats;