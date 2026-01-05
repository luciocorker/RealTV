import { Play, Tv, Sparkles, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/realtv-logo.png";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";

interface HeroProps {
  onStartTrial: () => void;
}

export function Hero({ onStartTrial }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout, isLoggedIn } = useUser();
  const navigate = useNavigate();

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

  // Cycle through videos every 15 seconds (only on desktop)
  useEffect(() => {
    if (isMobile) return;
    
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    }, 20000);

    return () => clearInterval(interval);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    
    // Unmute after a short delay once video starts playing
    const unmuteTimer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
          '*'
        );
      }
    }, 1500);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (iframeRef.current) {
            // Calculate volume based on visibility (0-100)
            const volume = Math.round(entry.intersectionRatio * 100);
            
            // Set volume using YouTube IFrame API
            iframeRef.current.contentWindow?.postMessage(
              JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }),
              '*'
            );
          }
        });
      },
      { 
        threshold: Array.from({ length: 101 }, (_, i) => i / 100) // Track every 1% change
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      clearTimeout(unmuteTimer);
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [currentVideoIndex, isMobile]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* User Profile - Top Right Corner */}
      {isLoggedIn && user && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="text-white font-medium">{user.name || user.username}</span>
          </button>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* YouTube Video Background - Desktop Only */}
      {!isMobile && (
        <div className="absolute inset-0">
          <iframe
            ref={iframeRef}
            key={currentVideoIndex}
            className="absolute top-1/2 left-1/2 w-[100vw] h-[100vh] min-w-[177.77vh] min-h-[56.25vw] -translate-x-1/2 -translate-y-1/2"
            src={`https://www.youtube.com/embed/${videos[currentVideoIndex]}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&start=0`}
            title="Background Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none', pointerEvents: 'none' }}
          />
        </div>
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
            alt="RealTV"
            className="mx-auto h-32 w-auto md:h-44 lg:h-52"
          />
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
