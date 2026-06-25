"use client";

import { useOptionalGameAudio } from "@/components/GameAudioProvider";
import {
  getAwarenessLabel,
  getMentalHealthLabel,
} from "@/lib/stage-generator";
import { getStatusLabel } from "@/lib/evaluator";
import type {
  EvaluationResult,
  TanakaStatus,
  TanakaStatusDelta,
} from "@/types/game";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type StageTransitionCutsceneProps = {
  show: boolean;
  completedStage: number;
  nextStage: number;
  tanakaStatus: TanakaStatus;
  delta: TanakaStatusDelta | null;
  resultStatus: EvaluationResult["status"];
  onComplete: () => void;
};

function getDaysElapsed(completedStage: number): number {
  const days = [2, 3, 3, 4, 5];
  return days[completedStage - 1] ?? completedStage + 1;
}

function getNarration(
  delta: TanakaStatusDelta | null,
  mentalHealth: number
): string {
  if (!delta) {
    return "日常業務が続いている……";
  }
  if (delta.mentalHealth <= -30) {
    return "田中の様子が明らかにおかしい……";
  }
  if (delta.mentalHealth <= -10) {
    return "田中は次のミスを心配しているようだ……";
  }
  if (delta.mentalHealth >= 10) {
    return "田中が少し元気を取り戻したようだ。";
  }
  if (mentalHealth < 30) {
    return "オフィスの空気が重い……";
  }
  return "日常業務が続いている……";
}

function getBackgroundClass(mentalHealth: number): string {
  if (mentalHealth < 30) return "bg-red-950/95";
  if (mentalHealth < 50) return "bg-amber-950/95";
  return "bg-indigo-950/95";
}

function DeltaText({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-indigo-300">±0</span>;
  }
  const color = value > 0 ? "text-emerald-400" : "text-red-400";
  return (
    <span className={color}>
      {value > 0 ? "+" : ""}
      {value}
    </span>
  );
}

export default function StageTransitionCutscene({
  show,
  completedStage,
  nextStage,
  tanakaStatus,
  delta,
  resultStatus,
  onComplete,
}: StageTransitionCutsceneProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const audio = useOptionalGameAudio();
  const [step, setStep] = useState(0);

  const days = getDaysElapsed(completedStage);
  const narration = getNarration(delta, tanakaStatus.mentalHealth);
  const bgClass = getBackgroundClass(tanakaStatus.mentalHealth);
  const isClear = resultStatus === "clear";

  useEffect(() => {
    if (!show) {
      setStep(0);
      return;
    }

    if (reducedMotion) {
      onComplete();
      return;
    }

    audio?.playSe("stage_advance");

    const timers = [
      setTimeout(() => setStep(1), 700),
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 2300),
      setTimeout(() => onComplete(), 3200),
    ];

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 演出は1回のみ
  }, [show, reducedMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${bgClass}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="status"
          aria-live="polite"
          aria-label={`ステージ${completedStage}から${nextStage}への移行`}
        >
          <div className="w-full max-w-md border-4 border-indigo-400 bg-indigo-900 p-6 text-center sm:p-8">
            {/* Step 0: ステージ終了 */}
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-xs font-black tracking-[0.35em] text-yellow-400">
                    STAGE {completedStage}
                  </p>
                  <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
                    {isClear ? "クリア" : "終了"}
                  </p>
                  <p
                    className={`mt-2 inline-block border-2 px-3 py-1 text-sm font-bold ${
                      isClear
                        ? "border-emerald-400 bg-emerald-600 text-white"
                        : resultStatus === "insufficient"
                          ? "border-yellow-400 bg-yellow-600 text-white"
                          : "border-red-400 bg-red-600 text-white"
                    }`}
                  >
                    {getStatusLabel(resultStatus)}
                  </p>
                </motion.div>
              )}

              {/* Step 1: 時間経過 */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="text-xs font-black tracking-[0.4em] text-indigo-300">
                    TIME ELAPSED
                  </p>
                  <motion.p
                    className="mt-3 text-3xl font-black text-white sm:text-4xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {days}日後
                  </motion.p>
                  <p className="mt-4 text-sm leading-relaxed text-indigo-200">
                    {narration}
                  </p>
                </motion.div>
              )}

              {/* Step 2: 田中ステータス */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="text-xs font-black tracking-[0.35em] text-sky-400">
                    TANAKA STATUS
                  </p>
                  <p className="mt-3 text-lg font-black text-white">
                    田中の現在の状態
                  </p>

                  <div className="mt-5 space-y-3 border-2 border-indigo-600 bg-indigo-950 p-4 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-indigo-200">
                        メンタル
                      </span>
                      <span className="text-sm font-black text-white">
                        {tanakaStatus.mentalHealth}
                        {delta && (
                          <span className="ml-2 text-xs">
                            (<DeltaText value={delta.mentalHealth} />)
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-400">
                      {getMentalHealthLabel(tanakaStatus.mentalHealth)}
                    </p>

                    <div className="flex items-center justify-between gap-2 border-t border-indigo-700 pt-3">
                      <span className="text-sm font-bold text-indigo-200">
                        意識改善レベル
                      </span>
                      <span className="text-sm font-black text-white">
                        {tanakaStatus.awarenessLevel}
                        {delta && (
                          <span className="ml-2 text-xs">
                            (<DeltaText value={delta.awarenessLevel} />)
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-400">
                      {getAwarenessLabel(tanakaStatus.awarenessLevel)}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: 次ステージ予告 */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-xs font-black tracking-[0.35em] text-yellow-400">
                    NEXT STAGE
                  </p>
                  <motion.p
                    className="mt-2 text-3xl font-black text-white sm:text-4xl"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.6 }}
                  >
                    STAGE {nextStage}
                  </motion.p>
                  <p className="mt-3 text-sm text-indigo-200">
                    また新たなミスが報告された……
                  </p>
                  <div className="mt-4 flex justify-center gap-1" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 bg-yellow-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
