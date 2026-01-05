import { Play, Tv, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/realtv-logo.png";

interface HeroProps {
  onStartTrial: () => void;
}

export function Hero({ onStartTrial }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(220_20%_12%)_0%,_hsl(220_20%_6%)_100%)]" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>
      
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img
            src={logo}
            alt="RealTV"
            className="mx-auto h-24 w-auto md:h-32"
          />
        </div>

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">1000+ Live Channels</span>
        </div>

        {/* Heading */}
        <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Unlimited Live TV,{" "}
          <span className="gradient-text">Movies & Series</span>
        </h1>

        {/* Subheading */}
        <p className="mb-8 text-lg text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: "0.3s" }}>
          Stream your favorite content on any device. Sports, movies, series, and more — all in HD quality.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Button
            size="lg"
            onClick={onStartTrial}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 glow-sm"
          >
            <Play className="mr-2 h-5 w-5" />
            24-Hour FREE Trial
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full sm:w-auto border-border hover:bg-secondary"
          >
            <a href="#pricing">
              <Tv className="mr-2 h-5 w-5" />
              View Plans
            </a>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span>No Contract</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan" />
            <span>Instant Access</span>
          </div>
        </div>
      </div>
    </section>
  );
}
