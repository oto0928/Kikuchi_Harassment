"use client";

import { motion, useReducedMotion } from "framer-motion";

const PAPER_PARTICLES = [
  { x: "5%", delay: 0, rotate: 12, w: 14, h: 18 },
  { x: "18%", delay: 0.4, rotate: -8, w: 12, h: 16 },
  { x: "32%", delay: 0.8, rotate: 25, w: 16, h: 12 },
  { x: "48%", delay: 0.2, rotate: -15, w: 13, h: 17 },
  { x: "62%", delay: 1.0, rotate: 30, w: 15, h: 14 },
  { x: "78%", delay: 0.6, rotate: -22, w: 11, h: 15 },
  { x: "90%", delay: 1.2, rotate: 18, w: 14, h: 13 },
  { x: "25%", delay: 1.4, rotate: -30, w: 12, h: 18 },
  { x: "55%", delay: 0.5, rotate: 8, w: 17, h: 11 },
  { x: "70%", delay: 1.6, rotate: -12, w: 13, h: 16 },
];

const GLITCH_LINES = [
  { top: "12%", width: "60%", delay: 0 },
  { top: "38%", width: "45%", delay: 0.3 },
  { top: "62%", width: "70%", delay: 0.6 },
  { top: "82%", width: "50%", delay: 0.9 },
];

type T4ChaosEffectsProps = {
  active: boolean;
  variant?: "stage" | "full";
};

export default function T4ChaosEffects({
  active,
  variant = "stage",
}: T4ChaosEffectsProps) {
  const reducedMotion = useReducedMotion() ?? false;

  if (!active || reducedMotion) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        variant === "full" ? "fixed z-30" : "z-10"
      }`}
      aria-hidden="true"
    >
      {/* オレンジ警告フラッシュ */}
      <motion.div
        className="absolute inset-0 bg-orange-500/10"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* グリッチスキャンライン */}
      {GLITCH_LINES.map((line, i) => (
        <motion.div
          key={`glitch-${i}`}
          className="absolute left-0 h-px bg-orange-400/40"
          style={{ top: line.top, width: line.width }}
          animate={{ opacity: [0, 0.8, 0], x: [0, 20, 0] }}
          transition={{
            duration: 0.4,
            repeat: Infinity,
            delay: line.delay,
            repeatDelay: 1.5,
          }}
        />
      ))}

      {/* コピー用紙パーティクル */}
      {PAPER_PARTICLES.map((p, i) => (
        <motion.span
          key={`paper-${i}`}
          className="absolute border border-orange-300/50 bg-orange-100/20"
          style={{
            left: p.x,
            width: p.w,
            height: p.h,
            rotate: p.rotate,
          }}
          initial={{ top: "-10%", opacity: 0 }}
          animate={{
            top: ["-10%", "110%"],
            opacity: [0, 0.7, 0.5, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * 30, (i % 2 === 0 ? 1 : -1) * 15],
            rotate: [p.rotate, p.rotate + 180, p.rotate + 360],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}

      {/* CHAOS バッジ */}
      <motion.div
        className="absolute right-2 top-2 border-2 border-orange-500 bg-orange-600 px-2 py-0.5 sm:right-3 sm:top-3"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <span className="whitespace-nowrap text-[10px] font-black tracking-wider text-white sm:text-xs">
          CHAOS
        </span>
      </motion.div>
    </div>
  );
}
