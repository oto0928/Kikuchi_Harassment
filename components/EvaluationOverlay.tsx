"use client";

import { useOptionalGameAudio } from "@/components/GameAudioProvider";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const ANALYSIS_STEPS = [
  "指導文をスキャン中…",
  "ハラスメントリスクを解析…",
  "指導の具体性を計測…",
  "改善提案を評価…",
  "田中の心理状態をシミュレーション…",
  "判定結果を生成中…",
];

type EvaluationOverlayProps = {
  inputPreview: string;
  isLlm: boolean;
};

export default function EvaluationOverlay({
  inputPreview,
  isLlm,
}: EvaluationOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const audio = useOptionalGameAudio();

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % ANALYSIS_STEPS.length);
    }, 450);

    const start = Date.now();
    const duration = 2800;
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / duration) * 100));
    }, 30);

    const tickTimer = setInterval(() => {
      audio?.playSe("judge_tick");
    }, 450);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
      clearInterval(tickTimer);
    };
  }, [audio]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-4 border-4 border-yellow-400 bg-indigo-950 p-4 sm:mt-6 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="border-2 border-yellow-400 bg-yellow-400 px-2 py-0.5 text-xs font-black text-indigo-900">
          ANALYZING
        </span>
        <span className="text-xs font-bold text-yellow-300">
          {isLlm ? "AI ENGINE" : "LOCAL ENGINE"}
        </span>
      </div>

      {/* スキャン対象テキスト */}
      <div className="relative mb-5 overflow-hidden border-2 border-indigo-600 bg-indigo-900 p-4">
        <p className="text-xs font-bold text-indigo-400">TARGET TEXT</p>
        <p className="mt-1 line-clamp-3 text-sm text-indigo-100">
          「{inputPreview}」
        </p>
        {/* スキャンライン */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        {/* グリッドオーバーレイ */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, #6366f1 3px, #6366f1 4px)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* ステップ表示 */}
      <div className="mb-4 h-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="font-mono text-sm font-bold text-emerald-400 sm:text-base"
          >
            {">"} {ANALYSIS_STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* プログレスバー */}
      <div className="h-5 overflow-hidden border-2 border-indigo-600 bg-indigo-900">
        <motion.div
          className="relative h-full bg-gradient-to-r from-indigo-500 via-yellow-400 to-emerald-400"
          style={{ width: `${progress}%` }}
        >
          <motion.div
            className="absolute inset-0 bg-white/30"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>

      <p className="mt-3 text-center text-xs font-bold tabular-nums text-indigo-300">
        {Math.round(progress)}%
      </p>

      {/* ドットアニメーション */}
      <div className="mt-4 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 bg-yellow-400"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/** 評価処理と最低表示時間を両方待つ */
export function waitForEvaluation<T>(
  evaluationPromise: Promise<T>,
  minMs = 2800
): Promise<T> {
  return Promise.all([
    evaluationPromise,
    new Promise<void>((resolve) => setTimeout(resolve, minMs)),
  ]).then(([result]) => result);
}
