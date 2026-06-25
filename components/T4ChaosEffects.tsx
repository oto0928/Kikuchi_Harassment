"use client";

import { motion, useReducedMotion } from "framer-motion";

/** 上昇する火の粉（画面下から立ち上る） */
const EMBERS = [
  { x: "8%", delay: 0, size: 4, color: "bg-yellow-300" },
  { x: "22%", delay: 0.6, size: 3, color: "bg-orange-400" },
  { x: "35%", delay: 1.2, size: 5, color: "bg-red-400" },
  { x: "48%", delay: 0.3, size: 3, color: "bg-yellow-400" },
  { x: "58%", delay: 0.9, size: 4, color: "bg-orange-300" },
  { x: "70%", delay: 1.5, size: 3, color: "bg-red-500" },
  { x: "82%", delay: 0.4, size: 5, color: "bg-yellow-300" },
  { x: "92%", delay: 1.0, size: 3, color: "bg-orange-500" },
  { x: "15%", delay: 1.8, size: 3, color: "bg-red-400" },
  { x: "44%", delay: 2.1, size: 4, color: "bg-yellow-400" },
  { x: "63%", delay: 0.7, size: 3, color: "bg-orange-400" },
  { x: "88%", delay: 1.4, size: 4, color: "bg-red-400" },
];

/** 飛び散る火花 */
const SPARKS = [
  { x: "20%", y: "75%", delay: 0.2 },
  { x: "45%", y: "80%", delay: 0.5 },
  { x: "68%", y: "72%", delay: 0.8 },
  { x: "35%", y: "65%", delay: 1.1 },
  { x: "55%", y: "78%", delay: 0.35 },
  { x: "78%", y: "68%", delay: 0.65 },
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
      {/* 底部の炎フラッシュ */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[45%]"
        style={{
          background:
            "linear-gradient(to top, rgba(220,38,38,0.35) 0%, rgba(249,115,22,0.2) 40%, transparent 100%)",
        }}
        animate={{ opacity: [0.4, 0.75, 0.5, 0.8, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 揺らめく炎の舌 */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`flame-${i}`}
          className="absolute bottom-0 rounded-t-full"
          style={{
            left: `${20 + i * 28}%`,
            width: `${18 + i * 6}%`,
            height: `${12 + i * 4}%`,
            background:
              "linear-gradient(to top, rgba(239,68,68,0.6) 0%, rgba(251,146,60,0.4) 50%, transparent 100%)",
            transformOrigin: "bottom center",
          }}
          animate={{
            scaleX: [1, 1.15, 0.9, 1.1, 1],
            scaleY: [1, 1.2, 0.85, 1.15, 1],
            opacity: [0.5, 0.85, 0.6, 0.9, 0.5],
          }}
          transition={{
            duration: 0.8 + i * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}

      {/* 上昇する火の粉 */}
      {EMBERS.map((ember, i) => (
        <motion.span
          key={`ember-${i}`}
          className={`absolute rounded-full ${ember.color}`}
          style={{
            left: ember.x,
            bottom: "0%",
            width: ember.size,
            height: ember.size,
          }}
          animate={{
            bottom: ["0%", "95%"],
            opacity: [0, 1, 0.8, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * 12, (i % 2 === 0 ? 1 : -1) * 24],
            scale: [0.5, 1.2, 0.8, 0.2],
          }}
          transition={{
            duration: 2.2 + (i % 4) * 0.4,
            repeat: Infinity,
            delay: ember.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* 火花バースト */}
      {SPARKS.map((spark, i) => (
        <motion.span
          key={`spark-${i}`}
          className="absolute h-1.5 w-1.5 rounded-full bg-yellow-200"
          style={{ left: spark.x, top: spark.y }}
          animate={{
            opacity: [0, 1, 0.6, 0],
            scale: [0, 2, 1.2, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * 18, (i % 2 === 0 ? 1 : -1) * 30],
            y: [0, -20, -40],
          }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: spark.delay,
            repeatDelay: 1.2,
            ease: "easeOut",
          }}
        />
      ))}

      {/* 熱気のゆらぎ */}
      <motion.div
        className="absolute inset-0 bg-red-600/5 mix-blend-screen"
        animate={{ opacity: [0.05, 0.18, 0.08, 0.15, 0.05] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* CHAOS バッジ */}
      <motion.div
        className="absolute right-2 top-2 border-2 border-red-500 bg-red-700 px-2 py-0.5 sm:right-3 sm:top-3"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <span className="whitespace-nowrap text-[10px] font-black tracking-wider text-yellow-100 sm:text-xs">
          CHAOS
        </span>
      </motion.div>
    </div>
  );
}
