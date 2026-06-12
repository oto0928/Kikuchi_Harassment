"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

type RoukiGameOverImageProps = {
  /** compact: 結果カード内 / full: ゲームオーバー画面 */
  variant?: "compact" | "full";
  className?: string;
};

export default function RoukiGameOverImage({
  variant = "compact",
  className = "",
}: RoukiGameOverImageProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      className={`relative w-full overflow-hidden border-4 border-red-600 bg-red-950 ${className}`}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 18,
        delay: reducedMotion ? 0 : 0.1,
      }}
    >
      {/* 背景フラッシュ */}
      {!reducedMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-yellow-400"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          aria-hidden="true"
        />
      )}

      <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
        <Image
          src="/images/rouki-gameover.png"
          alt="労基相談エンド - ハラスメント度80点以上"
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 768px) 100vw, 672px"
        />
      </div>

      <div className="border-t-4 border-red-600 bg-red-900 px-4 py-3 text-center">
        <motion.p
          className={`font-black text-red-100 ${variant === "full" ? "text-lg sm:text-xl" : "text-base sm:text-lg"}`}
          animate={
            reducedMotion
              ? {}
              : { scale: [1, 1.05, 1] }
          }
          transition={{ duration: 0.5, repeat: 2, delay: 0.5 }}
        >
          ハラスメント度 80点超過 — 労基相談エンド
        </motion.p>
        <p className="mt-1 text-xs text-red-300 sm:text-sm">
          部下が労働基準監督署への相談を検討しています…
        </p>
      </div>
    </motion.div>
  );
}

/** 画面全体を覆う労基フラッシュ（ゲームオーバー時） */
export function RoukiFullScreenFlash({ show }: { show: boolean }) {
  const reducedMotion = useReducedMotion() ?? false;

  if (!show || reducedMotion) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-red-950/90 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.2, times: [0, 0.15, 0.7, 1] }}
    >
      <motion.div
        className="w-full max-w-lg"
        initial={{ scale: 0.2, rotate: -10 }}
        animate={{ scale: [0.2, 1.1, 1], rotate: [-10, 3, 0] }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <RoukiGameOverImage variant="full" />
      </motion.div>
    </motion.div>
  );
}
