import { Phone, ExternalLink, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const hotlines = [
  { name: "National Mental Health Helpline", region: "Nigeria", description: "24/7 free and confidential support", number: "112", tel: "tel:112" },
  { name: "Nile University Guidance and Counseling Office", region: "Nigeria", description: "Helping Nile One Student at A Time", number: "", tel: "tel:" },
  
];

const resources = [
  { name: "Mentally Aware Nigeria Initiative (MANI)", desc: "The largest youth-run mental health organization in Nigeria", url: "https://mentallyaware.org/" },
  { name: "She Writes Woman", desc: "24/7 toll-free crisis helpline and free, unlimited teletherapy.", url: "https://www.shewriteswoman.org//" },
  { name: "MyTherapist.ng", desc: "Platform connecting Nigerians with licensed therapists, psychiatrists, and counselors", url: "https://mytherapist.ng/" },
];

const CrisisSupport = () => {
  return (
    <section id="resources" className="bg-card py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 text-sm font-medium text-destructive"><AlertTriangle className="h-4 w-4" />Crisis Support</span>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">You Deserve Support Right Now</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">If you're in crisis or having thoughts of self-harm, please reach out. Help is available 24/7, and you don't have to face this alone.</p>
        </motion.div>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Crisis Hotlines</h3>
            <div className="mt-6 space-y-4">
              {hotlines.map((h) => (
                <div key={h.name} className="flex items-center justify-between rounded-xl border border-border bg-background p-5">
                  <div>
                    <h4 className="font-semibold text-foreground">{h.name}</h4>
                    <span className="mr-2 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{h.region}</span>
                    <span className="text-sm text-muted-foreground">{h.description}</span>
                  </div>
                  <a href={h.tel} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                    <Phone className="h-4 w-4" />{h.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Additional Resources</h3>
            <div className="mt-6 space-y-4">
              {resources.map((r) => (
                <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-xl border border-border bg-background p-5 transition-shadow hover:shadow-md">
                  <div>
                    <h4 className="font-semibold text-foreground group-hover:text-primary">{r.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                  </div>
                  <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">If you're in immediate danger, please call emergency services</p>
          <p className="mt-2 text-sm text-muted-foreground">Nigeria:112|Contact Nile UNiversity Counselors at Student Center.</p>
        </div>
      </div>
    </section>
  );
};

export default CrisisSupport;
