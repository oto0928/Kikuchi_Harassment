"use client";

import EndingCinematic from "@/components/EndingCinematic";
import MentalBreakdownGameOverImage from "@/components/MentalBreakdownGameOverImage";
import RankRevealCinematic from "@/components/RankRevealCinematic";
import { useOptionalGameAudio } from "@/components/GameAudioProvider";
import RoukiGameOverImage from "@/components/RoukiGameOverImage";
import TanakaStatusPanel from "@/components/TanakaStatusPanel";
import { getStatusLabel } from "@/lib/evaluator";
import type {
  FinalResult,
  GameOverReason,
  StageHistory,
} from "@/types/game";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";

type FinalScreenProps = {
  finalResult: FinalResult;
  history: StageHistory[];
  isGameOver: boolean;
  allCleared?: boolean;
  gameOverReason?: GameOverReason;
  onRestart: () => void;
};

type FinalPhase = "intro" | "rank" | "details";

function StatBox({
  label,
  value,
  highlight = false,
  delay = 0,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      className={`border-2 p-4 text-center ${
        highlight
          ? "border-orange-500 bg-orange-900"
          : "border-indigo-500 bg-indigo-800"
      }`}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 22 }}
    >
      <p className="text-xs font-bold text-indigo-300">{label}</p>
      <p
        className={`mt-1 text-xl font-black ${highlight ? "text-orange-300" : "text-white"}`}
      >
        {value}
      </p>
    </motion.div>
  );
}

export default function FinalScreen({
  finalResult,
  history,
  isGameOver,
  allCleared,
  gameOverReason,
  onRestart,
}: FinalScreenProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const audio = useOptionalGameAudio();
  const [phase, setPhase] = useState<FinalPhase>(
    reducedMotion ? "details" : "intro"
  );

  useEffect(() => {
    if (reducedMotion) return;

    if (isGameOver && gameOverReason === "harassment") {
      const timer = setTimeout(() => setPhase("rank"), 2400);
      return () => clearTimeout(timer);
    }
  }, [isGameOver, gameOverReason, reducedMotion]);

  const showIntro = phase === "intro";
  const showRank = phase === "rank";
  const showDetails = phase === "details";

  return (
    <div className="space-y-6">
      {showIntro && isGameOver && gameOverReason === "harassment" && (
        <RoukiGameOverImage variant="full" />
      )}

      {showIntro && isGameOver && gameOverReason === "mental_breakdown" && (
        <MentalBreakdownGameOverImage
          variant="full"
          onSequenceComplete={() => setPhase("rank")}
        />
      )}

      {showIntro && !isGameOver && (
        <EndingCinematic
          ending={finalResult.ending}
          title={finalResult.endingTitle}
          description={finalResult.endingDescription}
          isGameOver={false}
          allCleared={allCleared}
          onSequenceComplete={() => setPhase("rank")}
        />
      )}

      {showRank && (
        <RankRevealCinematic
          rank={finalResult.rank}
          rankLabel={finalResult.rankLabel}
          onComplete={() => setPhase("details")}
        />
      )}

      <motion.div
        initial={false}
        animate={
          showDetails ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }
        }
        transition={{ duration: 0.5 }}
      >
        {showDetails && (
          <>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <TanakaStatusPanel status={finalResult.finalTanakaStatus} compact />
            </motion.div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <StatBox
                label="平均ハラスメント度"
                value={`${finalResult.averageHarassment}点`}
                highlight={finalResult.averageHarassment >= 40}
                delay={0.15}
              />
              <StatBox
                label="クリアステージ"
                value={`${finalResult.clearedCount} / ${finalResult.totalStages}`}
                delay={0.25}
              />
            </div>

            <motion.div
              className="mt-6 border-2 border-indigo-500 bg-indigo-800 p-4 sm:p-5"
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-yellow-300">
                <span className="border border-yellow-400 px-2 py-0.5 text-xs">
                  LOG
                </span>
                ステージ履歴
              </h3>
              <div className="space-y-3">
                {history.map((entry, index) => (
                  <motion.div
                    key={`${entry.stageId}-${index}`}
                    className={`border-2 p-3 sm:p-4 ${
                      entry.tier === "t4"
                        ? "border-orange-600 bg-orange-950"
                        : "border-indigo-600 bg-indigo-900"
                    }`}
                    initial={reducedMotion ? false : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.08 }}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          entry.tier === "t4"
                            ? "text-orange-200"
                            : "text-indigo-200"
                        }`}
                      >
                        ステージ{entry.stageId}：{entry.stageTitle}
                        {entry.tier !== "t1" && (
                          <span
                            className={`ml-1 text-xs ${
                              entry.tier === "t4"
                                ? "font-black text-orange-400"
                                : "text-amber-400"
                            }`}
                          >
                            [{entry.tier.toUpperCase()}]
                          </span>
                        )}
                      </span>
                      <span
                        className={`rounded-sm px-2 py-0.5 text-xs font-bold text-white ${
                          entry.result.status === "clear"
                            ? "bg-emerald-600"
                            : entry.result.status === "insufficient"
                              ? "bg-yellow-600"
                              : "bg-red-600"
                        }`}
                      >
                        {getStatusLabel(entry.result.status)}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-indigo-300">
                      入力：「{entry.inputText}」
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-indigo-400">
                      <span>ハラスメント {entry.result.harassmentScore}点</span>
                      <span>問題点 {entry.result.problemClarityScore}点</span>
                      <span>
                        改善行動 {entry.result.actionSpecificityScore}点
                      </span>
                      <span>対話 {entry.result.dialogueScore}点</span>
                      <span>支援 {entry.result.supportScore}点</span>
                      <span>
                        メンタル {entry.tanakaAfter.mentalHealth}
                        ({entry.tanakaDelta.mentalHealth >= 0 ? "+" : ""}
                        {entry.tanakaDelta.mentalHealth})
                      </span>
                      <span>
                        意識改善レベル {entry.tanakaAfter.awarenessLevel}
                        ({entry.tanakaDelta.awarenessLevel >= 0 ? "+" : ""}
                        {entry.tanakaDelta.awarenessLevel})
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link
                href="/achievements"
                onClick={() => audio?.playSe("click")}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[8px] border-2 border-indigo-400 bg-indigo-700 px-6 py-3 text-base font-black text-white hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
              >
                実績を見る
              </Link>
              <button
                type="button"
                onClick={() => {
                  audio?.playSe("click");
                  onRestart();
                }}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[8px] bg-orange-500 px-6 py-3 text-base font-black text-white hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466A5.5 5.5 0 1116 9.75M12.75 9.75V4.5"
                    clipRule="evenodd"
                  />
                </svg>
                もう一度遊ぶ
              </button>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
