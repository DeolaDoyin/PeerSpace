// src/components/landing/Navbar.tsx
import { useState, useEffect } from "react";
import {Heart, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Import your LogoHeart component

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Community", href: "#community" },
  { label: "Resources", href: "#resources" },
];



const Navbar = () => {
  // --- Theme Logic ---
    const [theme, setTheme] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem("theme") || "light";
      }
      return "light";
    });
  
    const toggleTheme = () => {
      const newTheme = theme === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      localStorage.setItem("theme", newTheme);
      setTheme(newTheme);
    };
  
    useEffect(() => {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary/20" />
          <span className="text-xl font-bold text-foreground">PeerSpace</span>
        </a>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side: Dark mode + Sign In + Mobile menu */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>

          {/* Sign In button */}
          <a href="/auth">
            <Button size="sm" variant="default" className="hidden sm:inline-flex">
              Sign In
            </Button>
          </a>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="rounded-md p-2 text-muted-foreground md:hidden">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="rounded-md px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {link.label}
                  </a>
                ))}
                <a href="/auth">
                  <Button size="default" variant="default" className="mt-4 w-full">
                    Sign In
                  </Button>
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;