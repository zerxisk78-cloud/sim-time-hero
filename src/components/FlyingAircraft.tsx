import { useState, useEffect } from "react";
import ah1zImg from "@/assets/ah1z-cartoon.png";
import uh1yImg from "@/assets/uh1y-cartoon.png";
import mv22Img from "@/assets/mv22-cartoon.png";

const AIRCRAFT = [
  { src: ah1zImg, alt: "AH-1Z Super Cobra", size: "h-14" },
  { src: uh1yImg, alt: "UH-1Y Huey", size: "h-14" },
  { src: mv22Img, alt: "MV-22 Osprey", size: "h-16" },
];

export function FlyingAircraft() {
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    // Fly on mount after a short delay, then every 60s
    const initialTimeout = setTimeout(() => setFlying(true), 2000);
    const interval = setInterval(() => setFlying(true), 60000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (flying) {
      const timeout = setTimeout(() => setFlying(false), 6000);
      return () => clearTimeout(timeout);
    }
  }, [flying]);

  if (!flying) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-20 pointer-events-none z-50 overflow-hidden">
      {AIRCRAFT.map((craft, i) => (
        <img
          key={craft.alt}
          src={craft.src}
          alt={craft.alt}
          className={`absolute ${craft.size} object-contain`}
          style={{
            top: `${8 + i * 4}px`,
            animation: `flyAcross 5s linear forwards`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes flyAcross {
          0% { left: -120px; }
          100% { left: calc(100% + 120px); }
        }
      `}</style>
    </div>
  );
}
