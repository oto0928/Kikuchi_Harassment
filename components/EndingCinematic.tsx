"use client";

import { getEndingVisual } from "@/lib/ending-visuals";
import type { GameEnding, GameOverReason } from "@/types/game";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type EndingCinematicProps = {
  ending: GameEnding;
  title: string;
  description: string;
  isGameOver: boolean;
  allCleared?: boolean;
  gameOverReason?: GameOverReason;
  onSequenceComplete?: () => void;
};

const CHAOS_DEBRIS = [
  { x: "8%", y: "15%", rotate: 25, delay: 0.8 },
  { x: "85%", y: "20%", rotate: -40, delay: 1.0 },
  { x: "75%", y: "70%", rotate: 15, delay: 1.2 },
  { x: "15%", y: "75%", rotate: -20, delay: 1.1 },
  { x: "50%", y: "8%", rotate: 45, delay: 0.9 },
];

function ChaosEffects({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <>
      {/* 爆発フラッシュ */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-orange-400/50 mix-blend-screen"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: [0.9, 0.2, 0.5, 0.15, 0.3] }}
        transition={{ duration: 1.2, times: [0, 0.2, 0.4, 0.7, 1] }}
        aria-hidden="true"
      />

      {/* 火花パーティクル */}
      {PARTICLE_POSITIONS.map((p, i) => (
        <motion.span
          key={`spark-${i}`}
          className="pointer-events-none absolute rounded-full bg-yellow-300"
          style={{
            left: p.x,
            top: p.y,
            width: p.size + 2,
            height: p.size + 2,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0.8, 0],
            scale: [0, 1.8, 1.2, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * 20, (i % 2 === 0 ? 1 : -1) * 35],
            y: [0, -25, -45],
          }}
          transition={{
            delay: 0.6 + p.delay,
            duration: 1.4,
            ease: "easeOut",
          }}
          aria-hidden="true"
        />
      ))}

      {/* 飛散デbris（書類風） */}
      {CHAOS_DEBRIS.map((d, i) => (
        <motion.span
          key={`debris-${i}`}
          className="pointer-events-none absolute h-3 w-5 border border-orange-300/60 bg-orange-200/30"
          style={{ left: d.x, top: d.y, rotate: d.rotate }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.9, 0.6, 0],
            scale: [0.5, 1, 0.8, 0.3],
            x: [0, (i % 2 === 0 ? 30 : -30), (i % 2 === 0 ? 60 : -60)],
            y: [0, -20, 40],
            rotate: [d.rotate, d.rotate + 90, d.rotate + 180],
          }}
          transition={{
            delay: d.delay,
            duration: 2,
            ease: "easeOut",
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
const PARTICLE_POSITIONS = [
  { x: "12%", y: "18%", delay: 0.2, size: 6 },
  { x: "78%", y: "22%", delay: 0.35, size: 5 },
  { x: "88%", y: "55%", delay: 0.5, size: 4 },
  { x: "20%", y: "68%", delay: 0.45, size: 5 },
  { x: "55%", y: "12%", delay: 0.6, size: 4 },
  { x: "42%", y: "82%", delay: 0.55, size: 6 },
];

function NeglectEffects({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <>
      {/* スマホ画面の光 */}
      <motion.div
        className="pointer-events-none absolute left-[42%] top-[38%] h-8 w-5 rounded-sm bg-blue-300/40 sm:h-10 sm:w-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.7, 0.4, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />

      {/* 通知バッジ */}
      <motion.span
        className="pointer-events-none absolute left-[48%] top-[32%] flex h-4 min-w-[16px] items-center justify-center border border-red-400 bg-red-500 px-1 text-[8px] font-black text-white sm:h-5 sm:min-w-[20px] sm:text-[9px]"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 1, 0.8], scale: [0, 1.2, 1, 1] }}
        transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
        aria-hidden="true"
      >
        99+
      </motion.span>

      {/* 通知ポップアップ */}
      <motion.div
        className="pointer-events-none absolute right-[8%] top-[18%] max-w-[120px] border border-slate-400 bg-slate-700/90 px-2 py-1 text-[9px] font-bold text-slate-200 sm:text-[10px]"
        initial={{ opacity: 0, x: 20, y: -8 }}
        animate={{ opacity: [0, 1, 1, 0.7], x: [20, 0, 0, 0], y: [-8, 0, 0, 0] }}
        transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
        aria-hidden="true"
      >
        上司からの連絡 未読
      </motion.div>

      {/* 放置感のビネット */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        aria-hidden="true"
      />
    </>
  );
}

function ModelBossEffects({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <>
      {/* 黄金の後光 */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-radial from-yellow-300/30 via-yellow-500/10 to-transparent"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(250,204,21,0.35) 0%, rgba(234,179,8,0.12) 40%, transparent 70%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />

      {/* ホログラムUI */}
      {[
        { x: "10%", y: "20%", w: "28%", h: "18%", delay: 0.8 },
        { x: "62%", y: "15%", w: "26%", h: "16%", delay: 1.0 },
        { x: "72%", y: "55%", w: "22%", h: "14%", delay: 1.2 },
      ].map((ui, i) => (
        <motion.div
          key={`holo-${i}`}
          className="pointer-events-none absolute border border-cyan-400/50 bg-cyan-500/10"
          style={{ left: ui.x, top: ui.y, width: ui.w, height: ui.h }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.7, 0.5, 0.7], scale: [0.8, 1, 1, 1] }}
          transition={{
            delay: ui.delay,
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />
      ))}

      {/* 150% バッジ */}
      <motion.span
        className="pointer-events-none absolute right-[12%] top-[28%] border-2 border-yellow-400 bg-yellow-600/80 px-1.5 py-0.5 text-[9px] font-black text-yellow-100 sm:text-[10px]"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 1], scale: [0, 1.2, 1] }}
        transition={{ delay: 1.2, duration: 0.6, ease: "easeOut" }}
        aria-hidden="true"
      >
        150%
      </motion.span>
    </>
  );
}

function SparkParticles({
  colorClass,
  active,
}: {
  colorClass: string;
  active: boolean;
}) {
  if (!active) return null;

  return (
    <>
      {PARTICLE_POSITIONS.map((p, i) => (
        <motion.span
          key={i}
          className={`pointer-events-none absolute rounded-full ${colorClass}`}
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.4, 0],
            y: [0, -18, -32],
          }}
          transition={{
            delay: 1.2 + p.delay,
            duration: 1.2,
            ease: "easeOut",
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export default function EndingCinematic({
  ending,
  title,
  description,
  isGameOver,
  allCleared,
  onSequenceComplete,
}: EndingCinematicProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const visual = getEndingVisual(ending);
  const [phase, setPhase] = useState(reducedMotion ? 3 : 0);

  const isGrowth = ending === "growth";
  const isModelBoss = ending === "model_boss";
  const isChaos = ending === "tanaka_chaos";
  const isNeglect = ending === "neglect";

  useEffect(() => {
    if (reducedMotion) {
      onSequenceComplete?.();
      return;
    }

    const chaosDuration = isChaos ? 3600 : 2800;
    const timers = [
      setTimeout(() => setPhase(1), isChaos ? 300 : 400),
      setTimeout(() => setPhase(2), isChaos ? 800 : 900),
      setTimeout(() => setPhase(3), isChaos ? 2200 : 1800),
      setTimeout(() => onSequenceComplete?.(), chaosDuration),
    ];

    return () => timers.forEach(clearTimeout);
  }, [reducedMotion, onSequenceComplete, isChaos]);

  const headerLabel = isGameOver
    ? "GAME OVER"
    : allCleared
      ? "ALL CLEAR"
      : visual.headerLabel;

  return (
    <motion.div
      className={`relative overflow-hidden border-4 ${visual.borderClass} ${visual.bgClass}`}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 背景フラッシュ */}
      <AnimatePresence>
        {phase >= 1 && !reducedMotion && (
          <motion.div
            className={`pointer-events-none absolute inset-0 z-10 ${visual.sweepClass}`}
            initial={{ opacity: 0.7, x: "-100%" }}
            animate={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* 上部バッジ */}
      <div className="relative z-20 px-4 pt-4 text-center sm:px-6 sm:pt-5">
        <motion.p
          className={`text-xs font-black tracking-[0.35em] ${visual.accentText}`}
          initial={reducedMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {headerLabel}
        </motion.p>

        <AnimatePresence>
          {phase >= 1 && (
            <motion.span
              className={`mt-2 inline-block border-2 px-3 py-0.5 text-xs font-black tracking-widest ${visual.badgeClass}`}
              initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 14 }}
            >
              {visual.badgeLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* メインビジュアル */}
      <div className="relative z-20 px-4 py-4 sm:px-6 sm:py-5">
        <motion.div
          className={`relative mx-auto w-full max-w-md overflow-hidden border-4 ${visual.borderClass} bg-black/40`}
          initial={
            reducedMotion
              ? false
              : { opacity: 0, scale: 0.88, y: 24 }
          }
          animate={
            phase >= 1
              ? {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  ...(isChaos && !reducedMotion
                    ? { x: [0, -4, 4, -3, 3, 0] }
                    : {}),
                }
              : { opacity: 0, scale: 0.88, y: 24 }
          }
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 20,
            ...(isChaos ? { x: { delay: 1, duration: 0.5 } } : {}),
          }}
        >
          <motion.div
            className="relative aspect-[4/3] w-full sm:aspect-[16/10]"
            animate={
              reducedMotion || (!isGrowth && !isModelBoss)
                ? {}
                : { scale: [1, 1.04, 1] }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {visual.image ? (
              <Image
                src={visual.image}
                alt={visual.imageAlt}
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 768px) 100vw, 448px"
              />
            ) : (
              <Image
                src="/images/subordinate.png"
                alt={visual.imageAlt}
                fill
                className={`object-cover object-top ${visual.subordinateFilter ?? ""}`}
                priority
                sizes="(max-width: 768px) 100vw, 448px"
              />
            )}

            <ChaosEffects active={isChaos && phase >= 1 && !reducedMotion} />
            <NeglectEffects active={isNeglect && phase >= 1 && !reducedMotion} />
            <ModelBossEffects active={isModelBoss && phase >= 1 && !reducedMotion} />

            {isGrowth && phase >= 2 && !reducedMotion && (
              <motion.span
                className="pointer-events-none absolute right-[18%] top-[42%] h-10 w-10 rounded-full border-2 border-emerald-300 sm:h-14 sm:w-14"
                initial={{ opacity: 0.8, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.8 }}
                transition={{
                  duration: 1.2,
                  repeat: 2,
                  ease: "easeOut",
                  delay: 0.3,
                }}
                aria-hidden="true"
              />
            )}

            <SparkParticles
              colorClass={visual.particleClass}
              active={
                phase >= 2 &&
                !reducedMotion &&
                !isChaos &&
                !isNeglect
              }
            />
          </motion.div>

          {/* 画像キャプション */}
          <motion.div
            className={`border-t-4 px-3 py-2 text-center ${visual.captionClass}`}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="text-xs font-bold sm:text-sm">
              {isGrowth
                ? "田中：「これからもよろしくお願いします！」"
                : ending === "model_boss"
                  ? "田中：「150%、達成しました！」"
                  : ending === "tanaka_chaos"
                    ? "田中：「……伝説、になりました」"
                    : ending === "survivor"
                      ? "田中：「なんとか……乗り切りました」"
                      : ending === "neglect"
                        ? "田中：「……また放置？」"
                        : "田中：「もう少し、教えてほしかったです……」"}
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* タイトル・説明 */}
      <div className="relative z-20 border-t-4 border-inherit px-4 pb-5 pt-4 text-center sm:px-6 sm:pb-6">
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <motion.h2
                className={`text-2xl font-black sm:text-3xl ${visual.titleClass}`}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.1 }}
              >
                {title.split("").map((char, i) => (
                  <motion.span
                    key={`${char}-${i}`}
                    className="inline-block"
                    initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.h2>

              <motion.p
                className={`mx-auto mt-3 max-w-prose text-left text-base leading-relaxed sm:text-center ${visual.descClass}`}
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                {description}
              </motion.p>

              {isGrowth && (
                <motion.div
                  className="mt-4 flex flex-wrap justify-center gap-2"
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                >
                  {["メンタル UP", "意識改善レベル UP", "信頼関係 UP"].map(
                    (label, i) => (
                      <span
                        key={label}
                        className="border-2 border-emerald-400 bg-emerald-800 px-3 py-1 text-xs font-black text-emerald-200"
                      >
                        <motion.span
                          initial={reducedMotion ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + i * 0.15 }}
                        >
                          {label}
                        </motion.span>
                      </span>
                    )
                  )}
                </motion.div>
              )}

              {isModelBoss && (
                <motion.div
                  className="mt-4 flex flex-wrap justify-center gap-2"
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                >
                  {["ALL CLEAR", "信頼関係 MAX", "模範上司"].map((label, i) => (
                    <span
                      key={label}
                      className="border-2 border-yellow-400 bg-yellow-800 px-3 py-1 text-xs font-black text-yellow-200"
                    >
                      <motion.span
                        initial={reducedMotion ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.15 }}
                      >
                        {label}
                      </motion.span>
                    </span>
                  ))}
                </motion.div>
              )}

              {isChaos && (
                <motion.div
                  className="mt-4 flex flex-wrap justify-center gap-2"
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                >
                  {["T4×3以上", "伝説達成", "CHAOS"].map((label, i) => (
                    <span
                      key={label}
                      className="border-2 border-orange-400 bg-orange-800 px-3 py-1 text-xs font-black text-orange-200"
                    >
                      <motion.span
                        initial={reducedMotion ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.15 }}
                      >
                        {label}
                      </motion.span>
                    </span>
                  ))}
                </motion.div>
              )}

              {isNeglect && (
                <motion.div
                  className="mt-4 flex flex-wrap justify-center gap-2"
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                >
                  {["指導不足", "スマホ", "放置"].map((label, i) => (
                    <span
                      key={label}
                      className="border-2 border-slate-400 bg-slate-700 px-3 py-1 text-xs font-black text-slate-200"
                    >
                      <motion.span
                        initial={reducedMotion ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.15 }}
                      >
                        {label}
                      </motion.span>
                    </span>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
