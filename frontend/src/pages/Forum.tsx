import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { MessageCircle, Users } from "lucide-react";

const forumTopics = [
  {
    id: "1",
    title: "Dealing with exam anxiety",
    replies: 23,
    participants: 15,
    lastActive: "5 min ago",
  },
  {
    id: "2",
    title: "Finding study groups on campus",
    replies: 18,
    participants: 12,
    lastActive: "15 min ago",
  },
  {
    id: "3",
    title: "Self-care tips during finals week",
    replies: 45,
    participants: 28,
    lastActive: "30 min ago",
  },
  {
    id: "4",
    title: "Managing homesickness",
    replies: 31,
    participants: 19,
    lastActive: "1 hr ago",
  },
  {
    id: "5",
    title: "Sleep schedule struggles",
    replies: 27,
    participants: 16,
    lastActive: "2 hr ago",
  },
];

const Forum = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card border-b border-border px-4 py-4 z-10">
        <h1 className="text-xl font-semibold text-foreground">Forum</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect with peers on shared topics
        </p>
      </header>

      {/* Forum Topics */}
      <div className="p-4 space-y-3">
        {forumTopics.map((topic) => (
          <Card
            key={topic.id}
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-foreground mb-2">{topic.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {topic.replies} replies
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {topic.participants}
              </span>
              <span className="ml-auto">{topic.lastActive}</span>
            </div>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Forum;
