import logo from "@/assets/realtv-logo.png";

export function ComingSoonModal() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden">
      {/* Radial glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[hsl(173_80%_50%/0.07)] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[hsl(145_65%_45%/0.05)] blur-3xl" />
        <div className="absolute top-0 left-0 w-[350px] h-[350px] rounded-full bg-[hsl(210_80%_55%/0.05)] blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-8 px-6 text-center max-w-lg">
        {/* Logo */}
        <img
          src={logo}
          alt="RealTV"
          className="h-28 w-auto md:h-36"
        />

        {/* Badge */}
        <span className="gradient-border rounded-full px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          Coming Soon
        </span>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight font-display">
            Something exciting{" "}
            <span className="gradient-text">is on its way</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            We're putting the finishing touches on our website. Stay tuned.
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Footer note */}
        <p className="text-muted-foreground/50 text-xs">
          &copy; {new Date().getFullYear()} RealTV. All rights reserved.
        </p>
      </div>
    </div>
  );
}
