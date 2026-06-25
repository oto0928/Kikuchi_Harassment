"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type MentalBreakdownGameOverImageProps = {
  variant?: "compact" | "full";
  className?: string;
  onSequenceComplete?: () => void;
};

const TEAR_DROPS = [
  { left: "48%", top: "38%", delay: 1.4 },
  { left: "52%", top: "40%", delay: 1.8 },
  { left: "46%", top: "42%", delay: 2.2 },
];

export default function MentalBreakdownGameOverImage({
  variant = "full",
  className = "",
  onSequenceComplete,
}: MentalBreakdownGameOverImageProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState(reducedMotion ? 3 : 0);

  useEffect(() => {
    if (reducedMotion) {
      onSequenceComplete?.();
      return;
    }

    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => onSequenceComplete?.(), 3200),
    ];

    return () => timers.forEach(clearTimeout);
  }, [reducedMotion, onSequenceComplete]);

  return (
    <motion.div
      className={`relative w-full overflow-hidden border-4 border-slate-600 bg-slate-950 ${className}`}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* 上部ラベル */}
      <div className="relative z-20 px-4 pt-4 text-center sm:px-6 sm:pt-5">
        <motion.p
          className="text-xs font-black tracking-[0.35em] text-slate-400"
          initial={reducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          GAME OVER
        </motion.p>

        <AnimatePresence>
          {phase >= 1 && (
            <motion.span
              className="mt-2 inline-block border-2 border-slate-500 bg-slate-700 px-3 py-0.5 text-xs font-black tracking-widest text-slate-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              MENTAL BREAKDOWN
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* メインビジュアル */}
      <div className="relative z-10 px-4 py-4 sm:px-6">
        <motion.div
          className="relative mx-auto w-full max-w-md overflow-hidden border-4 border-slate-700 bg-black"
          initial={reducedMotion ? false : { opacity: 0, scale: 1.05 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        >
          <motion.div
            className="relative aspect-[4/3] w-full sm:aspect-[16/10]"
            animate={
              reducedMotion
                ? {}
                : {
                    scale: [1, 1.06, 1.04],
                  }
            }
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/images/ending-mental-breakdown.png"
              alt="メンタル崩壊エンド - 部屋で膝を抱えて泣く田中"
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 768px) 100vw, 448px"
            />

            {/* ビネット */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40"
              aria-hidden="true"
            />

            {/* ランプの明滅 */}
            {!reducedMotion && (
              <motion.div
                className="pointer-events-none absolute inset-0 bg-amber-200/10 mix-blend-soft-light"
                animate={{ opacity: [0.15, 0.35, 0.2, 0.3, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
            )}

            {/* 涙 */}
            {!reducedMotion &&
              TEAR_DROPS.map((tear, i) => (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute h-2 w-1.5 rounded-full bg-sky-300/70"
                  style={{ left: tear.left, top: tear.top }}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{
                    opacity: [0, 0.8, 0.8, 0],
                    y: [0, 12, 28, 40],
                  }}
                  transition={{
                    delay: tear.delay,
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1.5,
                    ease: "easeIn",
                  }}
                  aria-hidden="true"
                />
              ))}

            {/* 肩の震えを示すオーバーレイ */}
            {!reducedMotion && phase >= 2 && (
              <motion.div
                className="pointer-events-none absolute inset-0 bg-slate-900/5"
                animate={{ x: [0, -1, 1, -1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
            )}
          </motion.div>

          <motion.div
            className="border-t-4 border-slate-700 bg-slate-900 px-3 py-2 text-center"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-bold text-slate-300 sm:text-sm">
              田中：「……もう、限界です」
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* タイトル・説明 */}
      <div className="relative z-20 border-t-4 border-slate-700 px-4 pb-5 pt-4 text-center sm:px-6">
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
            >
              <h2
                className={`font-black text-slate-200 ${
                  variant === "full" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
                }`}
              >
                メンタル崩壊エンド
              </h2>
              <p className="mx-auto mt-3 max-w-prose text-left text-sm leading-relaxed text-slate-400 sm:text-center sm:text-base">
                田中の精神衛生度が0になりました。メンタル崩壊で退職届が提出されました……
              </p>

              {phase >= 3 && (
                <motion.p
                  className="mt-4 text-xs font-bold text-slate-500"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  支援的な指導とメンタルケアの大切さを学びましょう
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/** 画面全体フラッシュ（メンタル崩壊時） */
export function MentalBreakdownFullScreenFlash({ show }: { show: boolean }) {
  const reducedMotion = useReducedMotion() ?? false;

  if (!show || reducedMotion) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 bg-slate-950/85"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.9, 0.7, 0] }}
      transition={{ duration: 2.5, times: [0, 0.2, 0.75, 1] }}
      aria-hidden="true"
    />
  );
}
