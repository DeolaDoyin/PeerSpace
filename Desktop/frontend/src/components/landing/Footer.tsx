import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <a href="#" className="inline-flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary fill-primary/20" />
          <span className="text-lg font-bold text-foreground">PeerSpace</span>
        </a>
        <p className="mt-4 text-sm text-muted-foreground">A safe, anonymous space for peer support. You're never alone.</p>
        <p className="mt-6 text-xs text-muted-foreground/60">© {new Date().getFullYear()} PeerSpace. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
