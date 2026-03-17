import { useState, useEffect } from "react";
import ah1zImg from "@/assets/ah1z-clean.png";
import uh1yImg from "@/assets/uh1y-clean.png";
import mv22Img from "@/assets/mv22-cartoon.png";

const AIRCRAFT = [
  { src: ah1zImg, alt: "AH-1Z Super Cobra", size: "h-28", fires: true },
  { src: uh1yImg, alt: "UH-1Y Huey", size: "h-28", fires: false },
  { src: mv22Img, alt: "MV-22 Osprey", size: "h-28", fires: false },
];

function Projectiles({ delay }: { delay: number }) {
  // Generate rockets and tracer bursts at various timings
  const rockets = [
    { type: "rocket", offsetY: 18, fireAt: 1.5 },
    { type: "rocket", offsetY: 24, fireAt: 2.8 },
    { type: "rocket", offsetY: 14, fireAt: 3.6 },
  ];
  const tracers = [
    { offsetY: 10, fireAt: 1.0, spread: 0 },
    { offsetY: 12, fireAt: 1.15, spread: 2 },
    { offsetY: 14, fireAt: 1.3, spread: -1 },
    { offsetY: 10, fireAt: 2.2, spread: 1 },
    { offsetY: 12, fireAt: 2.3, spread: -2 },
    { offsetY: 14, fireAt: 2.4, spread: 0 },
    { offsetY: 10, fireAt: 3.1, spread: 1 },
    { offsetY: 12, fireAt: 3.15, spread: -1 },
    { offsetY: 14, fireAt: 3.2, spread: 2 },
    { offsetY: 10, fireAt: 3.9, spread: 0 },
    { offsetY: 12, fireAt: 3.95, spread: -2 },
    { offsetY: 14, fireAt: 4.0, spread: 1 },
  ];

  return (
    <>
      {/* Rockets - thicker, with a smoke trail feel */}
      {rockets.map((r, i) => (
        <div
          key={`rocket-${i}`}
          className="absolute"
          style={{
            top: `${r.offsetY}px`,
            animation: `flyAcross 5s linear forwards`,
            animationDelay: `${delay}s`,
            opacity: 0,
          }}
        >
          {/* Rocket fires ahead of the aircraft */}
          <div
            className="absolute"
            style={{
              left: "140px",
              top: "0px",
              animation: `fireRocket 1.2s linear forwards`,
              animationDelay: `${delay + r.fireAt}s`,
              opacity: 0,
            }}
          >
            {/* Rocket body */}
            <div
              style={{
                width: "16px",
                height: "3px",
                background: "linear-gradient(90deg, #ff4400, #ffaa00, #fff)",
                borderRadius: "2px",
                boxShadow: "0 0 8px 2px rgba(255,100,0,0.6), 0 0 16px 4px rgba(255,60,0,0.3)",
              }}
            />
            {/* Smoke trail */}
            <div
              style={{
                position: "absolute",
                left: "-30px",
                top: "-2px",
                width: "30px",
                height: "7px",
                background: "linear-gradient(90deg, transparent, rgba(180,180,180,0.3), rgba(200,200,200,0.5))",
                borderRadius: "4px",
                filter: "blur(2px)",
              }}
            />
          </div>
        </div>
      ))}

      {/* Tracer rounds - small bright dots that streak forward */}
      {tracers.map((t, i) => (
        <div
          key={`tracer-${i}`}
          className="absolute"
          style={{
            top: `${t.offsetY + t.spread}px`,
            animation: `flyAcross 5s linear forwards`,
            animationDelay: `${delay}s`,
            opacity: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "130px",
              animation: `fireTracer 0.4s linear forwards`,
              animationDelay: `${delay + t.fireAt}s`,
              opacity: 0,
            }}
          >
            <div
              style={{
                width: "8px",
                height: "2px",
                background: "linear-gradient(90deg, #ff2200, #ffcc00, #fff)",
                borderRadius: "1px",
                boxShadow: "0 0 4px 1px rgba(255,200,0,0.8)",
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

export function FlyingAircraft() {
  const [flying, setFlying] = useState(false);

  useEffect(() => {
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
    <div className="fixed top-0 left-0 w-full h-60 pointer-events-none z-50 overflow-hidden">
      {AIRCRAFT.map((craft, i) => (
        <div key={craft.alt}>
          <img
            src={craft.src}
            alt={craft.alt}
            className={`absolute ${craft.size} object-contain`}
            style={{
              top: `${8 + i * 4}px`,
              animation: `flyAcross 5s linear forwards`,
              animationDelay: `${i * 0.8}s`,
              mixBlendMode: "multiply",
            }}
          />
          {craft.fires && <Projectiles delay={i * 0.8} />}
        </div>
      ))}
      <style>{`
        @keyframes flyAcross {
          0% { left: -120px; opacity: 1; }
          100% { left: calc(100% + 120px); opacity: 1; }
        }
        @keyframes fireRocket {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(500px); }
        }
        @keyframes fireTracer {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(350px); }
        }
      `}</style>
    </div>
  );
}
