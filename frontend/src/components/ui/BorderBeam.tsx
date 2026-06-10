"use client";

import { motion } from "framer-motion";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
  isHovered?: boolean;
}

export default function BorderBeam({
  className = "",
  size = 150,
  duration = 8,
  borderWidth = 2,
  colorFrom = "#D4AF37",
  colorTo = "#F0D060",
  delay = 0,
  isHovered = false,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": delay,
        } as React.CSSProperties
      }
      className={`pointer-events-none absolute inset-0 rounded-[inherit] ${className}`}
    >
      {/* 1. Fasciculul Interior (Mascat pentru a fi doar pe bordură) */}
      <div className="absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] ![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(white,white)]">
        <motion.div
            initial={{ offsetDistance: "0%" }}
            animate={{ offsetDistance: "100%" }}
            transition={{
                duration: duration,
                repeat: Infinity,
                ease: "linear",
                delay: -delay,
            }}
            style={{
                offsetPath: `rect(0 auto auto 0 round calc(var(--border-width) * 1px))`,
                position: "absolute",
                aspectRatio: "1",
                width: "calc(var(--size) * 1px)",
                background: `linear-gradient(to left, var(--color-from), var(--color-to), transparent)`,
                opacity: isHovered ? 1 : 0,
                filter: isHovered ? "brightness(1.5)" : "brightness(1)",
                transition: "opacity 0.6s ease, filter 0.6s ease",
            }}
        />
      </div>

      {/* 2. Glow-ul Exterior (Fără mască, pentru a ieși în afară) */}
      <motion.div
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
          delay: -delay,
        }}
        style={{
          offsetPath: `rect(0 auto auto 0 round 8px)`,
          position: "absolute",
          aspectRatio: "1",
          width: "calc(var(--size) * 1px)",
          background: `radial-gradient(circle, var(--color-from) 0%, transparent 70%)`,
          opacity: isHovered ? 0.6 : 0, // Devine vizibil doar la hover
          filter: "blur(20px)",
          transition: "opacity 0.6s ease",
          zIndex: -1,
        }}
      />
    </div>
  );
}
