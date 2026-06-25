"use client";

import ScoreBar from "@/components/ScoreBar";
import {
  getScoreHint,
  needsImprovement,
  type ScoreHintKey,
} from "@/lib/score-hints";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type ScoreHintRowProps = {
  hintKey: ScoreHintKey;
  label: string;
  score: number;
  dangerMode?: boolean;
  lowIsBad?: boolean;
  delay?: number;
  animateScore?: boolean;
};

export default function ScoreHintRow({
  hintKey,
  label,
  score,
  dangerMode = false,
  lowIsBad = false,
  delay = 0,
  animateScore = false,
}: ScoreHintRowProps) {
  const [open, setOpen] = useState(false);
  const hint = getScoreHint(hintKey);
  const showBadge = needsImprovement(hintKey, score);

  return (
    <div className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
      <ScoreBar
        label={label}
        score={score}
        dangerMode={dangerMode}
        lowIsBad={lowIsBad}
        delay={delay}
        animateScore={animateScore}
      />

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={`score-hint-${hintKey}`}
        className="mt-1.5 inline-flex min-h-[36px] items-center justify-center gap-1 rounded-[4px] border border-indigo-300 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3 w-3 shrink-0"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
        {open ? "閉じる" : "改善ヒント"}
        {showBadge && !open && (
          <span className="border border-amber-400 bg-amber-100 px-1 py-px text-[10px] font-black leading-none text-amber-800">
            要改善
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`score-hint-${hintKey}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 border-2 border-indigo-200 bg-indigo-50 p-4">
              <p className="mb-3 text-sm font-bold leading-relaxed text-indigo-900">
                {hint.summary}
              </p>
              <ul className="space-y-2 text-left">
                {hint.tips.map((tip) => (
                  <li
                    key={tip}
                    className="flex gap-2 text-sm leading-relaxed text-gray-700"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500"
                      aria-hidden="true"
                    />
                    {tip}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-2 border-emerald-300 bg-emerald-50 p-3">
                <p className="mb-1 text-xs font-black text-emerald-700">
                  例文
                </p>
                <p className="text-left text-sm leading-relaxed text-emerald-900">
                  {hint.example}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
