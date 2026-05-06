import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutUsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AboutUsModal({ isOpen, onOpenChange }: AboutUsModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 z-50 animate-in zoom-in-95 duration-200 focus:outline-none">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-foreground">
              About PeerSpace
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors p-2 -mr-2 rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong>PeerSpace</strong> is a safe, anonymous peer support platform designed specifically for students. 
              Our mission is to foster a supportive community where individuals can share their struggles, 
              seek advice, and connect with others who understand what they're going through.
            </p>
            <p>
              We believe that no student should have to navigate their challenges alone. By providing a secure, 
              moderated space, we aim to break down the stigma around mental health and academic stress.
            </p>
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-semibold text-foreground mb-2">Key Features</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>100% Anonymous discussions</li>
                <li>Topic-based categories</li>
                <li>Direct messaging with peers</li>
                <li>Community-driven moderation</li>
              </ul>
            </div>
            
            <p className="text-center text-xs mt-6 pt-4 text-muted-foreground/60">
              Version 1.0.0 &copy; {new Date().getFullYear()} PeerSpace.
            </p>
          </div>

          <div className="mt-6 pt-2 flex justify-end">
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
