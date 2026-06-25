"use client";

import EndingCinematic from "@/components/EndingCinematic";
import MentalBreakdownGameOverImage from "@/components/MentalBreakdownGameOverImage";
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

const rankColors: Record<string, string> = {
  S: "text-yellow-600 bg-yellow-50 border-yellow-300",
  A: "text-indigo-600 bg-indigo-50 border-indigo-300",
  B: "text-emerald-600 bg-emerald-50 border-emerald-300",
  C: "text-orange-600 bg-orange-50 border-orange-300",
  D: "text-red-600 bg-red-50 border-red-300",
};

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
  const [showDetails, setShowDetails] = useState(reducedMotion);
  const rankStyle = rankColors[finalResult.rank] ?? rankColors.D;
  const audio = useOptionalGameAudio();

  useEffect(() => {
    if (isGameOver && gameOverReason === "harassment") {
      setShowDetails(true);
    }
  }, [isGameOver, gameOverReason]);

  const detailsDelay = reducedMotion ? 0 : 2.8;
  const showStats =
    showDetails || (isGameOver && gameOverReason === "harassment");

  return (
    <div className="space-y-6">
      {isGameOver && gameOverReason === "harassment" && (
        <RoukiGameOverImage variant="full" />
      )}

      {isGameOver && gameOverReason === "mental_breakdown" && (
        <MentalBreakdownGameOverImage
          variant="full"
          onSequenceComplete={() => setShowDetails(true)}
        />
      )}

      {!isGameOver ? (
        <EndingCinematic
          ending={finalResult.ending}
          title={finalResult.endingTitle}
          description={finalResult.endingDescription}
          isGameOver={false}
          allCleared={allCleared}
          onSequenceComplete={() => setShowDetails(true)}
        />
      ) : null}

      <motion.div
        initial={false}
        animate={
          showStats ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }
        }
        transition={{ duration: 0.5, delay: showStats && isGameOver ? 0.2 : 0 }}
      >
        {showStats && (
          <>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: detailsDelay }}
            >
              <TanakaStatusPanel status={finalResult.finalTanakaStatus} compact />
            </motion.div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatBox
                label="平均ハラスメント度"
                value={`${finalResult.averageHarassment}点`}
                highlight={finalResult.averageHarassment >= 40}
                delay={detailsDelay + 0.1}
              />
              <StatBox
                label="クリアステージ"
                value={`${finalResult.clearedCount} / ${finalResult.totalStages}`}
                delay={detailsDelay + 0.2}
              />
              <motion.div
                className={`col-span-2 border p-4 text-center sm:col-span-1 ${rankStyle}`}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.5, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  delay: detailsDelay + 0.35,
                  type: "spring",
                  stiffness: 320,
                  damping: 16,
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  上司ランク
                </p>
                <motion.p
                  className="text-4xl font-black"
                  initial={reducedMotion ? false : { scale: 2, opacity: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: detailsDelay + 0.5,
                    type: "spring",
                    stiffness: 400,
                    damping: 14,
                  }}
                >
                  {finalResult.rank}
                </motion.p>
                <p className="text-sm font-medium">{finalResult.rankLabel}</p>
              </motion.div>
            </div>

            <motion.div
              className="mt-6 border-2 border-indigo-500 bg-indigo-800 p-4 sm:p-5"
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: detailsDelay + 0.5 }}
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
                    className="border-2 border-indigo-600 bg-indigo-900 p-3 sm:p-4"
                    initial={reducedMotion ? false : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: detailsDelay + 0.6 + index * 0.08 }}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-indigo-200">
                        ステージ{entry.stageId}：{entry.stageTitle}
                        {entry.tier !== "t1" && (
                          <span className="ml-1 text-xs text-amber-400">
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
                        精神衛生 {entry.tanakaAfter.mentalHealth}
                        ({entry.tanakaDelta.mentalHealth >= 0 ? "+" : ""}
                        {entry.tanakaDelta.mentalHealth})
                      </span>
                      <span>
                        意識 {entry.tanakaAfter.awarenessLevel}
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
              transition={{ delay: detailsDelay + 0.9 }}
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
