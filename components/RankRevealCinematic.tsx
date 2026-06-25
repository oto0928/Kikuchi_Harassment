"use client";

import { useOptionalGameAudio } from "@/components/GameAudioProvider";
import type { BossRank } from "@/types/game";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type RankRevealCinematicProps = {
  rank: BossRank;
  rankLabel: string;
  onComplete?: () => void;
};

const RANK_ORDER: BossRank[] = ["D", "C", "B", "A", "S"];

const RANK_STYLES: Record<
  BossRank,
  { border: string; bg: string; text: string; glow: string; particle: string }
> = {
  S: {
    border: "border-yellow-400",
    bg: "bg-yellow-500",
    text: "text-yellow-950",
    glow: "bg-yellow-400/30",
    particle: "bg-yellow-300",
  },
  A: {
    border: "border-indigo-400",
    bg: "bg-indigo-500",
    text: "text-white",
    glow: "bg-indigo-400/30",
    particle: "bg-indigo-300",
  },
  B: {
    border: "border-emerald-400",
    bg: "bg-emerald-500",
    text: "text-white",
    glow: "bg-emerald-400/30",
    particle: "bg-emerald-300",
  },
  C: {
    border: "border-orange-400",
    bg: "bg-orange-500",
    text: "text-white",
    glow: "bg-orange-400/30",
    particle: "bg-orange-300",
  },
  D: {
    border: "border-red-500",
    bg: "bg-red-600",
    text: "text-white",
    glow: "bg-red-400/30",
    particle: "bg-red-300",
  },
};

const SPARK_POSITIONS = [
  { x: "15%", y: "20%", delay: 0 },
  { x: "80%", y: "25%", delay: 0.1 },
  { x: "70%", y: "70%", delay: 0.2 },
  { x: "20%", y: "75%", delay: 0.15 },
  { x: "50%", y: "10%", delay: 0.05 },
  { x: "40%", y: "85%", delay: 0.25 },
];

function RankParticles({
  rank,
  active,
}: {
  rank: BossRank;
  active: boolean;
}) {
  const style = RANK_STYLES[rank];
  if (!active || rank === "D" || rank === "C") return null;

  return (
    <>
      {SPARK_POSITIONS.map((p, i) => (
        <motion.span
          key={`spark-${i}`}
          className={`pointer-events-none absolute h-2 w-2 rounded-full ${style.particle}`}
          style={{ left: p.x, top: p.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -20, -40],
          }}
          transition={{
            delay: 0.3 + p.delay,
            duration: 0.8,
            ease: "easeOut",
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export default function RankRevealCinematic({
  rank,
  rankLabel,
  onComplete,
}: RankRevealCinematicProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const audio = useOptionalGameAudio();
  const [phase, setPhase] = useState(reducedMotion ? 2 : 0);
  const [displayRank, setDisplayRank] = useState<BossRank>(
    reducedMotion ? rank : "D"
  );
  const [revealed, setRevealed] = useState(reducedMotion);

  const styles = RANK_STYLES[rank];
  const targetIndex = RANK_ORDER.indexOf(rank);

  useEffect(() => {
    if (reducedMotion) {
      onComplete?.();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 400));

    const spinSteps = targetIndex + 3;
    for (let i = 0; i < spinSteps; i += 1) {
      timers.push(
        setTimeout(() => {
          const idx = i % RANK_ORDER.length;
          setDisplayRank(RANK_ORDER[idx]!);
          audio?.playSe("rank_tick");
        }, 600 + i * 120)
      );
    }

    const revealAt = 600 + spinSteps * 120 + 200;
    timers.push(
      setTimeout(() => {
        setDisplayRank(rank);
        setRevealed(true);
        setPhase(2);
        audio?.playSe(rank === "S" || rank === "A" ? "rank_s" : "rank_reveal");
      }, revealAt)
    );

    timers.push(setTimeout(() => onComplete?.(), revealAt + 2200));

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 演出は1回のみ
  }, [rank, targetIndex, reducedMotion]);

  if (reducedMotion) {
    return (
      <div
        className={`border-4 ${styles.border} ${styles.bg} p-6 text-center`}
      >
        <p className="text-xs font-black tracking-widest text-white/70">
          BOSS RANK
        </p>
        <p className={`text-5xl font-black ${styles.text}`}>{rank}</p>
        <p className="mt-2 text-sm font-bold text-white/90">{rankLabel}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="relative overflow-hidden border-4 border-indigo-400 bg-indigo-950 p-6 sm:p-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* 背景グロー */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            className={`pointer-events-none absolute inset-0 ${styles.glow}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 0.3, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <RankParticles rank={rank} active={revealed} />

      {/* 判定フラッシュ */}
      <AnimatePresence>
        {phase === 1 && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 bg-white/20"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="relative z-20 text-center">
        <motion.p
          className="mb-2 text-xs font-black tracking-[0.35em] text-yellow-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {phase < 2 ? "RANKING..." : "BOSS RANK"}
        </motion.p>

        <motion.div
          className="relative mx-auto flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40"
          animate={
            revealed && rank === "D"
              ? { x: [0, -4, 4, -3, 3, 0] }
              : revealed
                ? { scale: [1, 1.08, 1] }
                : {}
          }
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className={`flex h-full w-full items-center justify-center border-4 ${
              revealed ? styles.border : "border-indigo-500"
            } ${revealed ? styles.bg : "bg-indigo-800"}`}
            animate={
              phase === 1
                ? { rotate: [0, -2, 2, -1, 1, 0] }
                : revealed
                  ? { scale: [0.5, 1.15, 1] }
                  : {}
            }
            transition={
              phase === 1
                ? { duration: 0.12, repeat: Infinity }
                : { type: "spring", stiffness: 400, damping: 14 }
            }
          >
            <motion.span
              className={`text-6xl font-black sm:text-7xl ${
                revealed ? styles.text : "text-indigo-300"
              }`}
              key={displayRank}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.08 }}
            >
              {displayRank}
            </motion.span>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 280 }}
            >
              <motion.p
                className={`mt-4 text-2xl font-black sm:text-3xl ${
                  rank === "S"
                    ? "text-yellow-400"
                    : rank === "D"
                      ? "text-red-400"
                      : "text-white"
                }`}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 16 }}
              >
                {rank} RANK
              </motion.p>
              <p className="mt-2 text-base font-bold text-indigo-200 sm:text-lg">
                {rankLabel}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!revealed && (
          <motion.p
            className="mt-4 font-mono text-sm text-indigo-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            上司力を集計中...
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
