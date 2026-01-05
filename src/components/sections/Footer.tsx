import logo from "@/assets/realtv-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12 px-4" role="contentinfo">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="RealTV - Live TV Streaming Service" className="h-10 w-auto" />
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm" aria-label="Footer navigation">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#channels" className="text-muted-foreground hover:text-foreground transition-colors">
              Channels
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#download" className="text-muted-foreground hover:text-foreground transition-colors">
              Download
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RealTV. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
