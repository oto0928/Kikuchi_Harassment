"use client";

import { useOptionalGameAudio } from "@/components/GameAudioProvider";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

type T4StageIntroProps = {
  show: boolean;
  stageNumber: number;
  onComplete: () => void;
};

export default function T4StageIntro({
  show,
  stageNumber,
  onComplete,
}: T4StageIntroProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const audio = useOptionalGameAudio();

  useEffect(() => {
    if (!show) return;

    audio?.playSe("chaos_alert");

    if (reducedMotion) {
      onComplete();
      return;
    }

    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [show, reducedMotion, onComplete, audio]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-orange-950/90 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="alert"
          aria-live="assertive"
        >
          <motion.div
            className="w-full max-w-md border-4 border-orange-500 bg-orange-900 p-6 text-center sm:p-8"
            initial={reducedMotion ? false : { scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.p
              className="mb-2 text-xs font-black tracking-[0.4em] text-orange-300"
              animate={reducedMotion ? {} : { opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.6, repeat: 3 }}
            >
              WARNING
            </motion.p>

            <motion.h2
              className="text-2xl font-black text-white sm:text-3xl"
              initial={reducedMotion ? false : { scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              CHAOS MODE
            </motion.h2>

            <p className="mt-3 text-base font-bold text-orange-200 sm:text-lg">
              ステージ {stageNumber} — カオスティア
            </p>

            <p className="mt-4 text-left text-sm leading-relaxed text-orange-100">
              田中のメンタルが限界に近づいています。
              ミスがエスカレートし、予測不能な事態が発生する可能性があります……
            </p>

            <motion.div
              className="mt-5 flex justify-center gap-1"
              aria-hidden="true"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 bg-orange-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
