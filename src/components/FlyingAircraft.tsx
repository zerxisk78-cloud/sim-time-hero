import { useState, useEffect } from "react";
import ah1zImg from "@/assets/ah1z-clean.png";
import uh1yImg from "@/assets/uh1y-clean.png";
import mv22Img from "@/assets/mv22-cartoon.png";
import t90Img from "@/assets/t90-tank.png";

const AIRCRAFT = [
  { src: ah1zImg, alt: "AH-1Z Super Cobra", size: "h-28", fires: true },
  { src: uh1yImg, alt: "UH-1Y Huey", size: "h-28", fires: false },
  { src: mv22Img, alt: "MV-22 Osprey", size: "h-28", fires: false },
];

function Projectiles({ delay }: { delay: number }) {
  // Fire downward toward the tank at bottom-right
  const rockets = [
    { fireAt: 1.2, angle: 35 },
    { fireAt: 1.4, angle: 38 },
    { fireAt: 2.4, angle: 32 },
    { fireAt: 2.6, angle: 36 },
    { fireAt: 3.2, angle: 30 },
    { fireAt: 3.4, angle: 34 },
  ];

  const tracerBursts = [0.8, 1.8, 2.8, 3.6];
  const tracers = tracerBursts.flatMap((t) => [
    { fireAt: t, spread: 0 },
    { fireAt: t + 0.04, spread: -1 },
    { fireAt: t + 0.08, spread: 1 },
    { fireAt: t + 0.12, spread: -2 },
    { fireAt: t + 0.16, spread: 0 },
  ]);

  return (
    <>
      {rockets.map((r, i) => (
        <div
          key={`rocket-${i}`}
          className="absolute"
          style={{
            top: "72px",
            animation: `flyAcross 5s linear forwards`,
            animationDelay: `${delay}s`,
            opacity: 0,
          }}
        >
          <div
            className="absolute"
            style={{
              left: "120px",
              animation: `fireDown${i % 2 === 0 ? 'A' : 'B'} 1.2s linear forwards`,
              animationDelay: `${delay + r.fireAt}s`,
              opacity: 0,
              transformOrigin: "top left",
              transform: `rotate(${r.angle}deg)`,
            }}
          >
            <div style={{
              width: "20px",
              height: "3px",
              background: "linear-gradient(90deg, rgba(255,80,0,0.4), #ff4400, #ffcc00, #fff)",
              borderRadius: "1px 3px 3px 1px",
              boxShadow: "0 0 6px 2px rgba(255,100,0,0.7), 0 0 12px 3px rgba(255,60,0,0.3)",
            }} />
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

      {tracers.map((t, i) => (
        <div
          key={`tracer-${i}`}
          className="absolute"
          style={{
            top: `${95 + t.spread}px`,
            animation: `flyAcross 5s linear forwards`,
            animationDelay: `${delay}s`,
            opacity: 0,
          }}
        >
          {t.spread === 0 && (
            <div
              className="absolute"
              style={{
                left: "150px",
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
              left: "158px",
              animation: `fireTracerDown 0.3s linear forwards`,
              animationDelay: `${delay + t.fireAt}s`,
              opacity: 0,
              transform: `rotate(${30 + t.spread * 2}deg)`,
              transformOrigin: "top left",
            }}
          >
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

function Explosion({ delay }: { delay: number }) {
  return (
    <div
      className="absolute"
      style={{
        bottom: "10px",
        right: "15%",
        width: "120px",
        height: "80px",
        animation: `explode 1.5s ease-out forwards`,
        animationDelay: `${delay}s`,
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      {/* Main fireball */}
      <div style={{
        position: "absolute",
        bottom: "10px",
        left: "30px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "radial-gradient(circle, #fff 5%, #ffcc00 25%, #ff6600 50%, rgba(255,0,0,0.6) 75%, transparent 100%)",
        boxShadow: "0 0 40px 20px rgba(255,100,0,0.6), 0 0 80px 40px rgba(255,60,0,0.3)",
        animation: `fireballGrow 1.5s ease-out forwards`,
        animationDelay: `${delay}s`,
        opacity: 0,
      }} />
      {/* Smoke column */}
      <div style={{
        position: "absolute",
        bottom: "40px",
        left: "40px",
        width: "40px",
        height: "60px",
        borderRadius: "50% 50% 0 0",
        background: "radial-gradient(ellipse, rgba(80,80,80,0.7) 0%, rgba(40,40,40,0.3) 60%, transparent 100%)",
        filter: "blur(8px)",
        animation: `smokeRise 2s ease-out forwards`,
        animationDelay: `${delay + 0.3}s`,
        opacity: 0,
      }} />
    </div>
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
      const timeout = setTimeout(() => setFlying(false), 8000);
      return () => clearTimeout(timeout);
    }
  }, [flying]);

  if (!flying) return null;

  const tankHitTime = 3.5; // seconds after animation start when tank gets hit

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Tank rolling in from the right */}
      <img
        src={t90Img}
        alt="T-90 Tank"
        className="absolute h-20 object-contain"
        style={{
          bottom: "20px",
          animation: `tankRollIn 4s ease-out forwards, tankDestroyed 0.5s ease-out forwards ${tankHitTime}s`,
          transform: "scaleX(-1)",
        }}
      />

      {/* Explosion on tank */}
      <Explosion delay={tankHitTime} />

      {/* Aircraft formation */}
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
        @keyframes tankRollIn {
          0% { right: -200px; opacity: 1; }
          60% { right: 12%; opacity: 1; }
          100% { right: 15%; opacity: 1; }
        }
        @keyframes tankDestroyed {
          0% { opacity: 1; transform: scaleX(-1) translateY(0); }
          30% { opacity: 1; transform: scaleX(-1) translateY(-10px) rotate(5deg); }
          100% { opacity: 0; transform: scaleX(-1) translateY(20px) rotate(8deg); filter: brightness(3); }
        }
        @keyframes fireDownA {
          0% { opacity: 1; transform: rotate(35deg) translateX(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: rotate(35deg) translateX(700px); }
        }
        @keyframes fireDownB {
          0% { opacity: 1; transform: rotate(38deg) translateX(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: rotate(38deg) translateX(700px); }
        }
        @keyframes fireTracerDown {
          0% { opacity: 1; transform: rotate(30deg) translateX(0); }
          60% { opacity: 0.8; }
          100% { opacity: 0; transform: rotate(30deg) translateX(500px); }
        }
        @keyframes muzzleFlash {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(0.5); }
        }
        @keyframes explode {
          0% { opacity: 0; }
          10% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fireballGrow {
          0% { opacity: 0; transform: scale(0.2); }
          15% { opacity: 1; transform: scale(1.2); }
          50% { opacity: 0.9; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes smokeRise {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          30% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-80px) scale(2); }
        }
      `}</style>
    </div>
  );
}
