import { useState, useEffect, useRef } from "react";

interface YouTubeFacadeProps {
  videoId: string;
  onVideoChange?: (videoId: string) => void;
  autoplay?: boolean;
  mute?: boolean;
  enablejsapi?: boolean;
}

/**
 * YouTube Facade Component
 * Shows thumbnail until user interaction, then loads actual iframe
 * Prevents loading 140KB+ of YouTube CSS/JS until needed
 */
export function YouTubeFacade({
  videoId,
  onVideoChange,
  autoplay = true,
  mute = true,
  enablejsapi = true,
}: YouTubeFacadeProps) {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isIframeLoaded) return;

    // Notify parent when iframe is loaded with new video
    if (onVideoChange) {
      onVideoChange(videoId);
    }
  }, [videoId, isIframeLoaded, onVideoChange]);

  // Auto-load iframe after a delay (for background video)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIframeLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  if (!isIframeLoaded) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-pointer"
        onClick={() => setIsIframeLoaded(true)}
        style={{
          backgroundImage: `url(${thumbnailUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Optional: Add play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <iframe
        ref={iframeRef}
        key={videoId}
        className="absolute top-1/2 left-1/2 w-[100vw] h-[100vh] min-w-[177.77vh] min-h-[56.25vw] -translate-x-1/2 -translate-y-1/2"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${mute ? 1 : 0}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=${enablejsapi ? 1 : 0}&start=0`}
        title="Background Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        style={{ border: "none", pointerEvents: "none" }}
      />
    </div>
  );
}
