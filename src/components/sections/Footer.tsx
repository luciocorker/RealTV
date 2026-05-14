import { Link } from "react-router-dom";
import logo from "@/assets/realtv-logo.png";
import { SHOW_CONTENT_PAGES } from "@/lib/featureFlags";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12 px-4" role="contentinfo">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src={logo} alt="RealTV - Live TV Streaming Service" className="h-16 w-auto" width="160" height="64" />
            </Link>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm" aria-label="Footer navigation">
            {SHOW_CONTENT_PAGES && (
              <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
            )}
            {SHOW_CONTENT_PAGES && (
              <Link to="/channels" className="text-muted-foreground hover:text-foreground transition-colors">
                Channels
              </Link>
            )}
            <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
              Shop
            </Link>
            {SHOW_CONTENT_PAGES && (
              <Link to="/download" className="text-muted-foreground hover:text-foreground transition-colors">
                Download
              </Link>
            )}
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RealTV. All rights reserved.
          </p>
        </div>

        {/* Refund Policy Disclaimer */}
        {SHOW_CONTENT_PAGES && (
          <p className="mt-8 text-center text-[10px] text-muted-foreground/60">
            No refunds on subscriptions once signed in and content has been viewed.
          </p>
        )}
      </div>
    </footer>
  );
}
