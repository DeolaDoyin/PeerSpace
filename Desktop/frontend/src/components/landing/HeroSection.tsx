import { Heart, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-24 text-center sm:px-6 sm:pt-32 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Shield className="h-4 w-4" />
            100% Anonymous & Safe
          </span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mt-8 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          You're Not Alone.
          <span className="mt-2 block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">We're Here to Listen.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          A safe, anonymous space where you can share your thoughts, find support from peers who understand, and know that someone cares.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="gap-2 px-8 text-base"><Heart className="h-5 w-5" />Share Your Story</Button>
          <Button size="lg" variant="outline" className="gap-2 px-8 text-base"><Users className="h-5 w-5" />Browse Support</Button>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Anonymous</span>
          <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" />No Judgment</span>
          <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Peer Support</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
