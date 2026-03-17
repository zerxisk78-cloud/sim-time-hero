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

function HellfireMissile({ delay }: { delay: number }) {
  const fireAt = 1.8;

  return (
    <div
      className="absolute"
      style={{
        top: "70px",
        animation: `flyAcross 5s linear forwards`,
        animationDelay: `${delay}s`,
        opacity: 0,
      }}
    >
      <div
        className="absolute"
        style={{
          left: "110px",
          animation: `hellfireFlight 2s ease-in forwards`,
          animationDelay: `${delay + fireAt}s`,
          opacity: 0,
          transformOrigin: "top left",
        }}
      >
        {/* Missile body */}
        <div style={{
          width: "24px",
          height: "4px",
          background: "linear-gradient(90deg, #666, #999, #888)",
          borderRadius: "2px 4px 4px 2px",
          position: "relative",
        }}>
          {/* Fins */}
          <div style={{
            position: "absolute",
            left: "0",
            top: "-3px",
            width: "6px",
            height: "10px",
            background: "linear-gradient(180deg, transparent 20%, #555 50%, transparent 80%)",
          }} />
        </div>
        {/* Exhaust flame */}
        <div style={{
          position: "absolute",
          left: "-18px",
          top: "-2px",
          width: "20px",
          height: "8px",
          background: "linear-gradient(90deg, transparent, rgba(255,200,0,0.3), #ff8800, #ffcc00, #fff)",
          borderRadius: "4px",
          boxShadow: "0 0 8px 3px rgba(255,150,0,0.5)",
          filter: "blur(1px)",
        }} />
        {/* Smoke trail */}
        <div style={{
          position: "absolute",
          left: "-80px",
          top: "-4px",
          width: "65px",
          height: "12px",
          background: "linear-gradient(90deg, transparent 0%, rgba(200,200,200,0.1) 30%, rgba(180,180,180,0.35) 100%)",
          borderRadius: "6px",
          filter: "blur(4px)",
        }} />
      </div>
    </div>
  );
}

function Explosion({ delay }: { delay: number }) {
  return (
    <div
      className="absolute"
      style={{
        bottom: "10px",
        right: "15%",
        width: "160px",
        height: "120px",
        animation: `explode 2s ease-out forwards`,
        animationDelay: `${delay}s`,
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      {/* Main fireball */}
      <div style={{
        position: "absolute",
        bottom: "10px",
        left: "40px",
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "radial-gradient(circle, #fff 5%, #ffcc00 20%, #ff6600 45%, rgba(255,0,0,0.6) 70%, transparent 100%)",
        boxShadow: "0 0 60px 30px rgba(255,100,0,0.7), 0 0 120px 60px rgba(255,60,0,0.3)",
        animation: `fireballGrow 2s ease-out forwards`,
        animationDelay: `${delay}s`,
        opacity: 0,
      }} />
      {/* Secondary fireball */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "60px",
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        background: "radial-gradient(circle, #fff 10%, #ffaa00 40%, rgba(255,60,0,0.5) 80%, transparent 100%)",
        boxShadow: "0 0 30px 15px rgba(255,120,0,0.5)",
        animation: `fireballGrow 1.8s ease-out forwards`,
        animationDelay: `${delay + 0.15}s`,
        opacity: 0,
      }} />
      {/* Smoke column */}
      <div style={{
        position: "absolute",
        bottom: "50px",
        left: "50px",
        width: "60px",
        height: "80px",
        borderRadius: "50% 50% 0 0",
        background: "radial-gradient(ellipse, rgba(60,60,60,0.8) 0%, rgba(40,40,40,0.3) 60%, transparent 100%)",
        filter: "blur(10px)",
        animation: `smokeRise 3s ease-out forwards`,
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

  const tankHitTime = 3.8;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Tank rolling in from the right, facing left */}
      <img
        src={t90Img}
        alt="T-90 Tank"
        className="absolute h-20 object-contain"
        style={{
          bottom: "20px",
          animation: `tankRollIn 4s ease-out forwards, tankDestroyed 0.6s ease-out forwards ${tankHitTime}s`,
        }}
      />

      <Explosion delay={tankHitTime} />

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
          {craft.fires && <HellfireMissile delay={i * 0.8} />}
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
          0% { opacity: 1; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-15px) rotate(-5deg); }
          100% { opacity: 0; transform: translateY(10px) rotate(-8deg); filter: brightness(4); }
        }
        @keyframes hellfireFlight {
          0% { opacity: 1; transform: rotate(25deg) translate(0, 0); }
          30% { opacity: 1; transform: rotate(35deg) translate(200px, 0); }
          60% { opacity: 1; transform: rotate(40deg) translate(500px, 0); }
          100% { opacity: 0; transform: rotate(45deg) translate(800px, 0); }
        }
        @keyframes muzzleFlash {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(0.5); }
        }
        @keyframes explode {
          0% { opacity: 0; }
          10% { opacity: 1; }
          60% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fireballGrow {
          0% { opacity: 0; transform: scale(0.1); }
          15% { opacity: 1; transform: scale(1.3); }
          40% { opacity: 0.9; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.8); }
        }
        @keyframes smokeRise {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          25% { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-100px) scale(2.5); }
        }
      `}</style>
    </div>
  );
}
