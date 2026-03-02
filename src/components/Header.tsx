import { useState, useEffect } from "react";
import { Menu, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from "@/assets/realtv-logo.png";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#channels", label: "Channels" },
  { href: "#pricing", label: "Pricing" },
  { href: "#download", label: "Download" },
  { href: "#setup", label: "Setup" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show header at the top of the page
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show header
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button Only - Floating */}
      <div
        className={`fixed top-4 right-4 z-50 md:hidden transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-20"
        }`}
      >
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              className="bg-background/80 backdrop-blur-sm rounded-full shadow-lg"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <img src={logo} alt="RealTV" className="h-8 w-auto" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={handleNavClick}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 pt-4 border-t border-border">
                <Button asChild className="w-full" size="lg">
                  <a href="#pricing" onClick={handleNavClick}>
                    <Tv className="mr-2 h-5 w-5" />
                    Get Started
                  </a>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 hidden md:block transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        } ${lastScrollY > 50 ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg" : "bg-transparent"}`}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <img
                src={logo}
                alt="RealTV"
                className="h-16 w-auto"
              />
            </a>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Button asChild size="sm" className="ml-2">
                <a href="#pricing">
                  <Tv className="mr-2 h-4 w-4" />
                  Get Started
                </a>
              </Button>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
