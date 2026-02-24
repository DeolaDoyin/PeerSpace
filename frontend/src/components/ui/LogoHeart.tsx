import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const LogoHeart = () => {
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.3, 1] }} // pulse animation
      transition={{ repeat: Infinity, duration: 1.2 }}
      className="inline-block"
    >
      <Heart className="h-6 w-6 text-primary fill-primary/20" />
    </motion.div>
  );
};

export default LogoHeart;