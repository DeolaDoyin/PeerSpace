import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const dos = [
  "Be kind and compassionate in your responses",
  "Share your own experiences when helpful",
  "Offer encouragement without judgment",
  "Respect everyone's privacy and anonymity",
  "Listen more than you speak",
];

const donts = [
  "Share personal identifying information",
  "Give medical or professional advice",
  "Judge or criticize others' experiences",
  "Make assumptions about others' situations",
  "Share content that could harm others",
];

const Guidelines = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Community Guidelines</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">To keep this a safe and supportive space for everyone, we ask that you follow these simple guidelines.</p>
        </motion.div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">What to Do</h3>
            <ul className="mt-4 space-y-3">
              {dos.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">What to Avoid</h3>
            <ul className="mt-4 space-y-3">
              {donts.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground"><X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />{item}</li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Guidelines;
