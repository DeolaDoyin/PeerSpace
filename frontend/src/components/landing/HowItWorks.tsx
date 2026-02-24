import { Shield, PenLine, Heart, HandHeart } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: Shield, step: "Step 1", title: "Stay Anonymous", description: "No account needed. No personal information required. Your identity is completely protected." },
  { icon: PenLine, step: "Step 2", title: "Share Your Story", description: "Write about what you're going through. Sometimes just putting feelings into words can help." },
  { icon: Heart, step: "Step 3", title: "Receive Support", description: "Get encouragement from peers who understand. You're never alone in this community." },
  { icon: HandHeart, step: "Step 4", title: "Support Others", description: "When you're ready, offer kindness to others. Your words might be exactly what someone needs." },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-card py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">A Safe Space, Simply</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">We've made it as easy as possible to get support when you need it most.</p>
        </motion.div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div key={step.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group rounded-xl border border-border/50 bg-background p-6 text-center transition-shadow hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <step.icon className="h-6 w-6" />
              </div>
              <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-primary">{step.step}</span>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
