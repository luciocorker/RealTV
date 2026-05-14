import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Tv, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from "@/assets/realtv-logo.png";

import { SHOW_CONTENT_PAGES } from "@/lib/featureFlags";

// Set to true to re-enable the Account button in the navbar
const SHOW_ACCOUNT = false;

const navLinks = [
  ...(SHOW_CONTENT_PAGES ? [{ href: "/channels", label: "Channels" }] : []),
  { href: "/shop", label: "Shop" },
  ...(SHOW_CONTENT_PAGES ? [{ href: "/download", label: "Download" }] : []),
  ...(SHOW_CONTENT_PAGES ? [{ href: "/setup", label: "Setup" }] : []),
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button Only - Floating */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="icon"
              aria-label="Open menu"
              className="bg-primary text-primary-foreground rounded-full shadow-xl h-12 w-12"
            >
              <Menu className="h-7 w-7" />
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
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium transition-colors ${
                    location.pathname === link.href
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-border">
                {!user && (
                  <Button asChild className="w-full mb-2" size="lg">
                    <Link to="/shop" onClick={handleNavClick}>
                      <Tv className="mr-2 h-5 w-5" />
                      Get Started
                    </Link>
                  </Button>
                )}
                {SHOW_ACCOUNT && (
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link to="/account" onClick={handleNavClick}>
                      <User className="mr-2 h-5 w-5" />
                      {user ? user.name : "Account"}
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Header */}
      <header className="sticky top-0 z-50 hidden md:block bg-background/95 backdrop-blur-md border-b border-border shadow-lg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logo}
                alt="RealTV"
                className="h-16 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <Button asChild size="sm" className="ml-2">
                  <Link to="/shop">
                    <Tv className="mr-2 h-4 w-4" />
                    Get Started
                  </Link>
                </Button>
              )}
              {SHOW_ACCOUNT && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/account">
                    <User className="mr-2 h-4 w-4" />
                    {user ? user.name : "Account"}
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
