"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type ScoreBarProps = {
  label: string;
  score: number;
  dangerMode?: boolean;
  lowIsBad?: boolean;
  hideLabel?: boolean;
  /** 段階表示用の遅延（秒） */
  delay?: number;
  /** カウントアップアニメーションを有効化 */
  animateScore?: boolean;
};

function getBarColor(
  score: number,
  dangerMode: boolean,
  lowIsBad: boolean
): string {
  if (dangerMode) {
    if (score >= 80) return "bg-red-600";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-emerald-500";
  }
  if (lowIsBad) {
    if (score < 30) return "bg-red-500";
    if (score < 60) return "bg-yellow-500";
    return "bg-emerald-500";
  }
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-orange-500";
}

function getScoreTextColor(
  score: number,
  dangerMode: boolean,
  lowIsBad: boolean
): string {
  if (dangerMode && score >= 80) return "text-red-600";
  if (lowIsBad && score < 30) return "text-red-600";
  if (dangerMode && score >= 60) return "text-orange-600";
  return "text-gray-800";
}

function useAnimatedScore(
  target: number,
  delay: number,
  enabled: boolean,
  reducedMotion: boolean
) {
  const [displayScore, setDisplayScore] = useState(enabled && !reducedMotion ? 0 : target);
  const [barWidth, setBarWidth] = useState(enabled && !reducedMotion ? 0 : target);

  useEffect(() => {
    if (!enabled || reducedMotion) {
      setDisplayScore(target);
      setBarWidth(target);
      return;
    }

    setDisplayScore(0);
    setBarWidth(0);

    const scoreControls = animate(0, target, {
      delay,
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });

    const barControls = animate(0, target, {
      delay,
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setBarWidth(v),
    });

    return () => {
      scoreControls.stop();
      barControls.stop();
    };
  }, [target, delay, enabled, reducedMotion]);

  return { displayScore, barWidth };
}

export default function ScoreBar({
  label,
  score,
  dangerMode = false,
  lowIsBad = false,
  hideLabel = false,
  delay = 0,
  animateScore = false,
}: ScoreBarProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const { displayScore, barWidth } = useAnimatedScore(
    score,
    delay,
    animateScore,
    reducedMotion
  );
  const barColor = getBarColor(score, dangerMode, lowIsBad);
  const textColor = getScoreTextColor(score, dangerMode, lowIsBad);
  const isDangerHit = dangerMode && score >= 80;

  const content = (
    <>
      {!hideLabel && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <motion.span
            className={`text-sm font-bold tabular-nums ${textColor}`}
            animate={
              isDangerHit && animateScore && !reducedMotion
                ? { scale: [1, 1.15, 1] }
                : {}
            }
            transition={{ delay: delay + 0.8, duration: 0.3 }}
          >
            {displayScore}
            <span className="text-xs font-normal text-gray-500"> / 100</span>
          </motion.span>
        </div>
      )}
      {hideLabel && (
        <div className="mb-1 flex justify-end">
          <span className={`text-xs font-bold tabular-nums ${textColor}`}>
            {displayScore} / 100
          </span>
        </div>
      )}
      <div className="h-3 w-full overflow-hidden rounded-sm border border-gray-200 bg-gray-100">
        <motion.div
          className={`h-full ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, barWidth))}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${score}点`}
        />
      </div>
      {isDangerHit && (
        <motion.p
          className="mt-1 text-xs font-medium text-red-600"
          initial={animateScore ? { opacity: 0 } : false}
          animate={animateScore ? { opacity: 1 } : {}}
          transition={{ delay: delay + 0.9 }}
        >
          80点以上：ゲームオーバー
        </motion.p>
      )}
    </>
  );

  if (animateScore) {
    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.4 }}
      >
        {content}
      </motion.div>
    );
  }

  return <div className="w-full">{content}</div>;
}
