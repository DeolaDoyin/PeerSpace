import { useState } from "react";
import {  MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const categories = ["All", "Anxiety", "Depression", "Loneliness", "Grief & Loss", "Relationships", "General", "Other"];

const CommunityStories = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  return (
    <section id="community" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">You're Not Alone in This</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Read stories from others who understand. Send support, share wisdom, or simply let them know you're here.</p>
        </motion.div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>{cat}</button>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">No stories yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Be the first to share your story</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunityStories;
