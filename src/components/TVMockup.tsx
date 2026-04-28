import { useState, useEffect } from "react";
import tv1 from "@/assets/tv1.png";
import tv2 from "@/assets/tv2.png";
import tv3 from "@/assets/tv3.png";
import tv4 from "@/assets/tv4.png";
import tv5 from "@/assets/tv5.png";

const screenshots = [tv1, tv2, tv3, tv4, tv5];

export default function TVMockup() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % screenshots.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      {/* TV shell */}
      <div
        className="relative w-full"
        style={{
          maxWidth: 560,
          minWidth: 0,
        }}
      >
        {/* Screen bezel */}
        <div
          style={{
            background: "linear-gradient(145deg, #1a1a1a, #2d2d2d)",
            borderRadius: 12,
            padding: 12,
            boxShadow:
              "0 0 0 2px #3a3a3a, 0 0 0 4px #111, 0 24px 64px rgba(0,0,0,0.75), inset 0 1px 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Screen */}
          <div
            style={{
              borderRadius: 6,
              overflow: "hidden",
              background: "#000",
              position: "relative",
              aspectRatio: "16 / 9",
            }}
          >
            {screenshots.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`TV screenshot ${i + 1}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: i === current ? 1 : 0,
                  transition: "opacity 0.6s ease-in-out",
                }}
              />
            ))}
          </div>
        </div>

        {/* Stand neck */}
        <div
          style={{
            width: 40,
            height: 24,
            background: "linear-gradient(to bottom, #2a2a2a, #1a1a1a)",
            margin: "0 auto",
            borderRadius: "0 0 4px 4px",
          }}
        />

        {/* Stand base */}
        <div
          style={{
            width: 140,
            height: 10,
            background: "linear-gradient(145deg, #222, #333)",
            margin: "0 auto",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* Dots */}
      <div className="flex gap-2 mt-5">
        {screenshots.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 border-none cursor-pointer h-2 ${
              i === current
                ? "bg-primary w-5"
                : "bg-muted-foreground/40 w-2 hover:bg-muted-foreground/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
