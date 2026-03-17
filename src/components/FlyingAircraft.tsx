import { useState, useEffect } from "react";
import ah1zImg from "@/assets/ah1z-clean.png";
import uh1yImg from "@/assets/uh1y-clean.png";
import mv22Img from "@/assets/mv22-cartoon.png";

const AIRCRAFT = [
  { src: ah1zImg, alt: "AH-1Z Super Cobra", size: "h-28", fires: true },
  { src: uh1yImg, alt: "UH-1Y Huey", size: "h-28", fires: false },
  { src: mv22Img, alt: "MV-22 Osprey", size: "h-28", fires: false },
];

// AH-1Z is h-28 = 112px tall, flying left-to-right
// Nose gun (M197) is at bottom-front of aircraft: ~right edge, ~90% down
// Rocket pods on stub wings: ~60% right, ~65% down
const GUN_ORIGIN = { x: 150, y: 95 };       // chin turret - nose of aircraft
const ROCKET_ORIGIN_TOP = { x: 120, y: 58 }; // upper stub wing pod
const ROCKET_ORIGIN_BOT = { x: 120, y: 72 }; // lower stub wing pod

function Projectiles({ delay }: { delay: number }) {
  const rockets = [
    { origin: ROCKET_ORIGIN_TOP, fireAt: 1.4, angle: 2 },
    { origin: ROCKET_ORIGIN_BOT, fireAt: 1.5, angle: -1 },
    { origin: ROCKET_ORIGIN_TOP, fireAt: 2.6, angle: 1 },
    { origin: ROCKET_ORIGIN_BOT, fireAt: 2.7, angle: -2 },
    { origin: ROCKET_ORIGIN_TOP, fireAt: 3.8, angle: 0 },
    { origin: ROCKET_ORIGIN_BOT, fireAt: 3.9, angle: -1 },
  ];

  // Tracer bursts from chin gun - rapid 3-round bursts
  const tracerBursts = [1.0, 2.2, 3.1, 3.9];
  const tracers = tracerBursts.flatMap((t) => [
    { fireAt: t, spreadY: 0 },
    { fireAt: t + 0.05, spreadY: -1 },
    { fireAt: t + 0.1, spreadY: 1 },
    { fireAt: t + 0.15, spreadY: -2 },
    { fireAt: t + 0.2, spreadY: 0 },
  ]);

  return (
    <>
      {/* Rockets from stub wing pods */}
      {rockets.map((r, i) => (
        <div
          key={`rocket-${i}`}
          className="absolute"
          style={{
            top: `${8 + r.origin.y}px`,
            animation: `flyAcross 5s linear forwards`,
            animationDelay: `${delay}s`,
            opacity: 0,
          }}
        >
          <div
            className="absolute"
            style={{
              left: `${r.origin.x}px`,
              animation: `fireRocket 1.0s linear forwards`,
              animationDelay: `${delay + r.fireAt}s`,
              opacity: 0,
              transform: `rotate(${r.angle}deg)`,
            }}
          >
            {/* Rocket flame tip */}
            <div style={{
              width: "20px",
              height: "3px",
              background: "linear-gradient(90deg, rgba(255,80,0,0.4), #ff4400, #ffcc00, #fff)",
              borderRadius: "1px 3px 3px 1px",
              boxShadow: "0 0 6px 2px rgba(255,100,0,0.7), 0 0 12px 3px rgba(255,60,0,0.3)",
            }} />
            {/* Exhaust smoke */}
            <div style={{
              position: "absolute",
              left: "-40px",
              top: "-3px",
              width: "42px",
              height: "9px",
              background: "linear-gradient(90deg, transparent 0%, rgba(160,160,160,0.15) 40%, rgba(200,200,200,0.4) 100%)",
              borderRadius: "5px",
              filter: "blur(3px)",
            }} />
          </div>
        </div>
      ))}

      {/* Tracer rounds from chin turret M197 */}
      {tracers.map((t, i) => (
        <div
          key={`tracer-${i}`}
          className="absolute"
          style={{
            top: `${8 + GUN_ORIGIN.y + t.spreadY}px`,
            animation: `flyAcross 5s linear forwards`,
            animationDelay: `${delay}s`,
            opacity: 0,
          }}
        >
          {/* Muzzle flash on first round of each burst */}
          {t.spreadY === 0 && (
            <div
              className="absolute"
              style={{
                left: `${GUN_ORIGIN.x}px`,
                top: "-3px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "radial-gradient(circle, #fff 20%, #ffcc00 60%, rgba(255,100,0,0) 100%)",
                animation: `muzzleFlash 0.1s linear forwards`,
                animationDelay: `${delay + t.fireAt}s`,
                opacity: 0,
              }}
            />
          )}
          <div
            className="absolute"
            style={{
              left: `${GUN_ORIGIN.x + 8}px`,
              animation: `fireTracer 0.25s linear forwards`,
              animationDelay: `${delay + t.fireAt}s`,
              opacity: 0,
            }}
          >
            {/* Tracer round */}
            <div style={{
              width: "12px",
              height: "1.5px",
              background: "linear-gradient(90deg, rgba(255,50,0,0.3), #ff2200, #ffcc00, #ffffcc)",
              borderRadius: "1px",
              boxShadow: "0 0 3px 1px rgba(255,200,0,0.6)",
            }} />
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
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateX(600px); }
        }
        @keyframes fireTracer {
          0% { opacity: 1; transform: translateX(0); }
          60% { opacity: 0.8; }
          100% { opacity: 0; transform: translateX(400px); }
        }
        @keyframes muzzleFlash {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(0.5); }
        }
      `}</style>
    </div>
  );
}
