import { useState, useEffect } from "react";
import phone1 from "@/assets/phone1.png";
import phone2 from "@/assets/phone2.png";
import phone3 from "@/assets/phone3.png";

const screenshots = [phone1, phone2, phone3];

export default function PhoneMockup() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % screenshots.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Phone shell */}
      <div
        className="relative"
        style={{
          width: 220,
          height: 450,
          borderRadius: 36,
          background: "linear-gradient(145deg, #1a1a1a, #2d2d2d)",
          boxShadow:
            "0 0 0 2px #3a3a3a, 0 0 0 4px #111, 0 20px 60px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.08)",
          padding: 10,
        }}
      >
        {/* Side buttons */}
        <div
          className="absolute"
          style={{
            left: -3,
            top: 100,
            width: 3,
            height: 32,
            background: "#333",
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          className="absolute"
          style={{
            left: -3,
            top: 145,
            width: 3,
            height: 32,
            background: "#333",
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          className="absolute"
          style={{
            right: -3,
            top: 120,
            width: 3,
            height: 50,
            background: "#333",
            borderRadius: "0 2px 2px 0",
          }}
        />

        {/* Screen bezel */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 32,
            overflow: "hidden",
            background: "#000",
            position: "relative",
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 60,
              height: 14,
              background: "#111",
              borderRadius: "0 0 10px 10px",
              zIndex: 10,
            }}
          />

          {/* Screenshots */}
          {screenshots.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`App screenshot ${i + 1}`}
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

      {/* Dots */}
      <div className="flex gap-2 mt-4">
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
