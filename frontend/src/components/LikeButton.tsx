import React, { useState } from 'react';
import api from '@/api/axios';
import { Heart } from 'lucide-react';
import { cn } from "@/lib/utils"; // If using Shadcn, otherwise use standard template strings

interface LikeButtonProps {
  itemId: number;
  type: 'post' | 'comment';
  initialCount: number;
  initialIsLiked: boolean;
}

const LikeButton = ({ itemId, type, initialCount, initialIsLiked }: LikeButtonProps) => {
  const [count, setCount] = useState(initialCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    // Prevent the click from triggering a "View Post" navigation if it's inside a Card
    e.stopPropagation();
    
    if (loading) return;

    // 1. Optimistic Update (UI changes instantly)
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setCount(prev => newIsLiked ? prev + 1 : prev - 1);
    setLoading(true);

    try {
      // 2. Sync with Laravel (e.g., POST /api/posts/5/like)
      await api.post(`/api/${type}s/${itemId}/like`);
    } catch (error) {
      // 3. Rollback if the API fails (e.g., user is logged out)
      setIsLiked(!newIsLiked);
      setCount(prev => !newIsLiked ? prev + 1 : prev - 1);
      console.error("Like sync failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLike}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all active:scale-95",
        isLiked 
          ? "text-rose-500 bg-rose-50/50" 
          : "text-muted-foreground hover:text-rose-400 hover:bg-rose-50/30"
      )}
    >
      <Heart 
        size={16} 
        className={cn("transition-transform", isLiked && "fill-current")} 
      />
      <span className="font-medium">{count}</span>
    </button>
  );
};

export default LikeButton;