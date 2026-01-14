import { Tv, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/realtv-logo.png";
import { useEffect, useRef, useState } from "react";
import { YouTubeFacade } from "@/components/YouTubeFacade";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);

  const videos = [
    "nGsWpaxSwEk",
    "xGTq0blCPVQ",
    "C1as_hRbBZg",
    "b12S13IlO6c",
    "NZ_OheD3ops",
    "PssKpzB0Ah0",
    "Xqqzb7FPmc0",
    "48CtX6OgU3s",
    "a6lzvWby9UE",
    "KCuSgAxPdFY",
    "-E3lMRx7HRQ",
    "Wk5OxqtpBR4",
    "GXecSGmQDEI"
  ];

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lazy load video after component mounts (defer YouTube JS)
  useEffect(() => {
    if (isMobile) return;
    
    // Delay loading video by 1 second to prioritize critical content
    const timer = setTimeout(() => {
      setLoadVideo(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isMobile]);

  // Cycle through videos every 15 seconds (only on desktop)
  // Cycle through videos every 20 seconds (only on desktop)
  useEffect(() => {
    if (isMobile || !loadVideo) return;
    
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    }, 20000);

    return () => clearInterval(interval);
  }, [isMobile, loadVideo]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20" aria-labelledby="hero-heading" role="banner">
      {/* YouTube Video Background - Desktop Only */}
      {!isMobile && loadVideo && (
        <YouTubeFacade
          videoId={videos[currentVideoIndex]}
          autoplay={true}
          mute={true}
          enablejsapi={true}
        />
      )}
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Logo */}
        <div className="mb-2 animate-fade-in">
          <img
            src={logo}
            alt="RealTV - Premium Live TV Streaming Service"
            className="mx-auto h-32 w-auto md:h-44 lg:h-52"
            width="400"
            height="160"
            loading="eager"
            fetchpriority="high"
          />
        </div>

        {/* Heading */}
        <h1 id="hero-heading" className="mb-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
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
            asChild
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 glow-sm"
          >
            <a href="#download">
              <Download className="mr-2 h-5 w-5" />
              Download App
            </a>
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
