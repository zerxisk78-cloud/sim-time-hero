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

const LASER_ORIGIN = {
  left: "clamp(140px, 17.5vw, 280px)",
  top: "88px",
};

const LASER_START_AT = 0.45;
const MISSILE_FIRE_AT = 0.95;
const TANK_HIT_TIME = 3.05;

function LaserDesignator({ delay }: { delay: number }) {
  return (
    <div
      className="absolute"
      style={{
        left: LASER_ORIGIN.left,
        top: LASER_ORIGIN.top,
        width: "76vw",
        animation: `laserDesignate 0.45s ease-in-out 2 forwards`,
        animationDelay: `${delay + LASER_START_AT}s`,
        opacity: 0,
        transform: "rotate(37deg)",
        transformOrigin: "left center",
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "2px",
          background:
            "linear-gradient(90deg, hsla(120 100% 75% / 0) 0%, hsla(120 100% 72% / 0.6) 12%, hsla(120 100% 70% / 1) 50%, hsla(120 100% 85% / 0.2) 100%)",
          boxShadow:
            "0 0 10px hsla(120 100% 70% / 0.8), 0 0 22px hsla(120 100% 65% / 0.45)",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-6px",
            top: "-5px",
            width: "12px",
            height: "12px",
            borderRadius: "9999px",
            background: "hsl(120 100% 80%)",
            boxShadow:
              "0 0 16px 4px hsla(120 100% 75% / 0.7), 0 0 28px 10px hsla(120 100% 70% / 0.2)",
          }}
        />
      </div>
    </div>
  );
}

function HellfireMissile({ delay }: { delay: number }) {
  return (
    <div
      className="absolute"
      style={{
        left: LASER_ORIGIN.left,
        top: LASER_ORIGIN.top,
        pointerEvents: "none",
      }}
    >
      <div
        className="absolute"
        style={{
          animation: `hellfireFlight ${TANK_HIT_TIME - MISSILE_FIRE_AT}s cubic-bezier(0.2, 0.7, 0.2, 1) forwards`,
          animationDelay: `${delay + MISSILE_FIRE_AT}s`,
          opacity: 0,
          transformOrigin: "top left",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "5px",
            background:
              "linear-gradient(90deg, hsl(0 0% 36%) 0%, hsl(0 0% 62%) 38%, hsl(0 0% 55%) 72%, hsl(0 0% 44%) 100%)",
            borderRadius: "3px 6px 6px 3px",
            position: "relative",
            boxShadow: "0 0 10px hsla(0 0% 100% / 0.12)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "2px",
              top: "-4px",
              width: "8px",
              height: "13px",
              background:
                "linear-gradient(180deg, transparent 15%, hsl(0 0% 34%) 50%, transparent 85%)",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: "-22px",
            top: "-3px",
            width: "24px",
            height: "10px",
            background:
              "linear-gradient(90deg, hsla(30 100% 55% / 0) 0%, hsla(35 100% 52% / 0.45) 25%, hsl(24 100% 50%) 55%, hsl(48 100% 62%) 78%, hsl(0 0% 100%) 100%)",
            borderRadius: "9999px",
            boxShadow:
              "0 0 10px 2px hsla(28 100% 50% / 0.55), 0 0 22px 6px hsla(40 100% 60% / 0.25)",
            filter: "blur(0.8px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "-90px",
            top: "-5px",
            width: "76px",
            height: "14px",
            background:
              "linear-gradient(90deg, hsla(0 0% 100% / 0) 0%, hsla(0 0% 80% / 0.1) 24%, hsla(0 0% 75% / 0.32) 100%)",
            borderRadius: "9999px",
            filter: "blur(4px)",
          }}
        />
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
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "40px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsl(0 0% 100%) 5%, hsl(48 100% 60%) 20%, hsl(24 100% 50%) 45%, hsla(0 100% 50% / 0.6) 70%, transparent 100%)",
          boxShadow:
            "0 0 60px 30px hsla(22 100% 50% / 0.7), 0 0 120px 60px hsla(12 100% 50% / 0.3)",
          animation: `fireballGrow 2s ease-out forwards`,
          animationDelay: `${delay}s`,
          opacity: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "60px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsl(0 0% 100%) 10%, hsl(38 100% 55%) 40%, hsla(16 100% 50% / 0.5) 80%, transparent 100%)",
          boxShadow: "0 0 30px 15px hsla(28 100% 52% / 0.5)",
          animation: `fireballGrow 1.8s ease-out forwards`,
          animationDelay: `${delay + 0.15}s`,
          opacity: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "50px",
          left: "50px",
          width: "60px",
          height: "80px",
          borderRadius: "50% 50% 0 0",
          background:
            "radial-gradient(ellipse, hsla(0 0% 24% / 0.8) 0%, hsla(0 0% 16% / 0.3) 60%, transparent 100%)",
          filter: "blur(10px)",
          animation: `smokeRise 3s ease-out forwards`,
          animationDelay: `${delay + 0.3}s`,
          opacity: 0,
        }}
      />
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

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <img
        src={t90Img}
        alt="T-90 Tank"
        className="absolute h-20 object-contain"
        style={{
          bottom: "20px",
          animation: `tankRollIn 3.2s ease-out forwards, tankDestroyed 0.6s ease-out forwards ${TANK_HIT_TIME}s`,
        }}
      />

      <Explosion delay={TANK_HIT_TIME} />

      <LaserDesignator delay={0} />
      <HellfireMissile delay={0} />

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
        @keyframes laserDesignate {
          0% { opacity: 0; transform: rotate(37deg) scaleX(0.35); }
          15% { opacity: 1; }
          55% { opacity: 0.55; }
          100% { opacity: 0; transform: rotate(37deg) scaleX(1); }
        }
        @keyframes hellfireFlight {
          0% { opacity: 0; transform: translate(0, 0) rotate(6deg) scale(0.88); }
          8% { opacity: 1; }
          24% { opacity: 1; transform: translate(10vw, 1vh) rotate(10deg) scale(1); }
          46% { opacity: 1; transform: translate(23vw, 7vh) rotate(18deg); }
          68% { opacity: 1; transform: translate(37vw, 23vh) rotate(31deg); }
          88% { opacity: 1; transform: translate(50vw, 48vh) rotate(43deg); }
          100% { opacity: 0; transform: translate(58vw, 68vh) rotate(52deg) scale(0.92); }
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
