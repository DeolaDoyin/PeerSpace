import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <motion.div
        animate={{
          x: [-40, 40, -40],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          ease: "easeInOut",
        }}
      >
        <Heart className="h-16 w-16 text-primary fill-primary/20 drop-shadow-md" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-sm font-medium text-muted-foreground tracking-widest uppercase"
      >
        Loading...
      </motion.p>
    </div>
  );
}
