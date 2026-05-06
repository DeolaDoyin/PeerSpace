import { Heart, LibraryBig, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/api/axios";
import ThemeToggleButton from "@/components/ThemeToggle";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Community", href: "#community" },
  { label: "Resources", href: "#resources" },
];

const Navbar = () => {
  // --- Auth Check ---
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/api/user');
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary/20" />
          <span className="text-xl font-bold text-foreground">PeerSpace</span>
        </Link>

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

        {/* Right side controls */}
        <div className="flex items-center gap-2">

          {/* Dynamic Desktop Button */}
          {user && (
            <>
              <Link
                to="/forum"
                title="Forum"
                className="hidden sm:inline-flex text-primary p-2 hover:bg-muted rounded-full transition-colors"
              >
                <LibraryBig className="h-5 w-5" />
              </Link>
            </>
          )}

          {user ? (
            <Link
              to="/profile"
              title="Profile"
              className="hidden sm:inline-flex text-primary p-2 hover:bg-muted rounded-full transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link to="/auth" className="hidden sm:inline-flex">
              <Button size="sm" variant="default">
                Sign In
              </Button>
            </Link>
          )}

            
          <ThemeToggleButton />

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="rounded-md p-2 text-muted-foreground md:hidden">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader className="text-left">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Browse PeerSpace resources and community links.
                </SheetDescription>
              </SheetHeader>
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

                {user && (
                  <>                    
                    <Link
                      to="/forum"
                      title="Forum"
                      className="rounded-md px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      Forum
                    </Link>
                  </>
                )}

                {user ? (
                  <Link to="/profile" className="mt-4">
                    <Button
                      size="default"
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <User className="h-4 w-4" /> Go to Profile
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth" className="mt-4">
                    <Button
                      size="default"
                      variant="default"
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;