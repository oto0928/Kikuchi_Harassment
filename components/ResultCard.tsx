"use client";

import NpcDialogue, { getNpcMoodFromStatus } from "@/components/NpcDialogue";
import RoukiGameOverImage from "@/components/RoukiGameOverImage";
import ScoreBar from "@/components/ScoreBar";
import { getStatusLabel } from "@/lib/evaluator";
import type { EvaluationResult } from "@/types/game";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type ResultCardProps = {
  result: EvaluationResult;
  evaluatorSource?: "keyword" | "llm";
  usedLlmFallback?: boolean;
};

function getStatusStyles(status: EvaluationResult["status"]) {
  switch (status) {
    case "clear":
      return {
        border: "border-emerald-500",
        bg: "bg-emerald-50",
        header: "bg-emerald-700 text-white",
        flash: "bg-emerald-400",
      };
    case "insufficient":
      return {
        border: "border-yellow-500",
        bg: "bg-yellow-50",
        header: "bg-yellow-600 text-white",
        flash: "bg-yellow-400",
      };
    case "labor_consultation":
      return {
        border: "border-red-500",
        bg: "bg-red-50",
        header: "bg-red-700 text-white",
        flash: "bg-red-500",
      };
  }
}

const SCORE_ITEMS = [
  { key: "harassment", label: "ハラスメント度", dangerMode: true },
  { key: "problemClarity", label: "問題点の明確さ", lowIsBad: true },
  { key: "actionSpecificity", label: "改善行動の具体性", lowIsBad: true },
  { key: "dialogue", label: "対話・確認", lowIsBad: true },
  { key: "support", label: "支援・再発防止", lowIsBad: true },
] as const;

function getScoreValue(result: EvaluationResult, key: string): number {
  switch (key) {
    case "harassment":
      return result.harassmentScore;
    case "problemClarity":
      return result.problemClarityScore;
    case "actionSpecificity":
      return result.actionSpecificityScore;
    case "dialogue":
      return result.dialogueScore;
    case "support":
      return result.supportScore;
    default:
      return 0;
  }
}

export default function ResultCard({ result, evaluatorSource, usedLlmFallback }: ResultCardProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const styles = getStatusStyles(result.status);
  const npcMood = getNpcMoodFromStatus(result.status);
  const [showVerdict, setShowVerdict] = useState(reducedMotion);
  const [showContent, setShowContent] = useState(reducedMotion);

  const isCritical =
    result.status === "labor_consultation" || result.harassmentScore >= 80;
  const isClear = result.status === "clear";

  useEffect(() => {
    if (reducedMotion) return;

    const verdictTimer = setTimeout(() => setShowVerdict(true), 600);
    const contentTimer = setTimeout(() => setShowContent(true), 1200);

    return () => {
      clearTimeout(verdictTimer);
      clearTimeout(contentTimer);
    };
  }, [reducedMotion]);

  return (
    <motion.div
      className={`relative w-full overflow-hidden border-4 ${styles.border} ${styles.bg}`}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 判定フラッシュ */}
      <AnimatePresence>
        {showVerdict && !reducedMotion && (
          <motion.div
            className={`pointer-events-none absolute inset-0 z-10 ${styles.flash}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* 判定ヘッダー */}
      <motion.div
        className={`relative px-4 py-4 text-center sm:py-5 ${styles.header}`}
        animate={
          isCritical && !reducedMotion
            ? { x: [0, -6, 6, -4, 4, 0] }
            : {}
        }
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <p className="text-xs font-bold tracking-widest opacity-80">RESULT</p>

        <AnimatePresence mode="wait">
          {!showVerdict ? (
            <motion.p
              key="pending"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="text-3xl font-black sm:text-4xl"
            >
              ???
            </motion.p>
          ) : (
            <motion.div key="verdict">
              <motion.p
                initial={{ opacity: 0, scale: 2, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                }}
                className="text-2xl font-black sm:text-3xl"
              >
                {getStatusLabel(result.status)}
              </motion.p>
              {isClear && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-1 text-sm font-bold text-emerald-200"
                >
                  NICE GUIDANCE!
                </motion.p>
              )}
              {isCritical && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-1 text-sm font-bold text-red-200"
                >
                  CRITICAL FAIL
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {evaluatorSource && showVerdict && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-1 text-xs opacity-80"
          >
            {evaluatorSource === "llm"
              ? "AI判定（OpenAI）"
              : usedLlmFallback
                ? "キーワード判定（AI失敗のため代替）"
                : "キーワード判定"}
          </motion.p>
        )}
      </motion.div>

      {/* 労基ゲームオーバー画像（80点超過） */}
      {isCritical && showVerdict && (
        <motion.div
          className="border-b-4 border-red-600"
          initial={reducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <RoukiGameOverImage variant="compact" />
        </motion.div>
      )}

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.5 }}
            className="space-y-4 overflow-hidden p-4 sm:p-6"
          >
            {/* スコア */}
            <motion.div
              className="border-2 border-gray-300 bg-white p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="mb-3 text-xs font-black tracking-wider text-gray-500">
                SCORE
              </p>
              <div className="space-y-4">
                {SCORE_ITEMS.map((item, index) => (
                  <ScoreBar
                    key={item.key}
                    label={item.label}
                    score={getScoreValue(result, item.key)}
                    dangerMode={"dangerMode" in item ? item.dangerMode : false}
                    lowIsBad={"lowIsBad" in item ? item.lowIsBad : false}
                    delay={0.2 + index * 0.35}
                    animateScore
                  />
                ))}
              </div>
            </motion.div>

            {/* AIフィードバック */}
            <motion.div
              className="border-2 border-indigo-300 bg-indigo-50 p-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8, duration: 0.4 }}
            >
              <p className="mb-2 text-xs font-black tracking-wider text-indigo-600">
                AI ANALYSIS
              </p>
              <TypewriterText text={result.feedback} delay={1900} />
            </motion.div>

            {/* 部下の反応 */}
            <motion.div
              className="border-2 border-gray-300 bg-white p-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.5 }}
            >
              <p className="mb-3 text-xs font-black tracking-wider text-gray-500">
                部下の反応
              </p>
              <NpcDialogue
                message={result.npcReaction}
                mood={npcMood}
                speakerLabel="部下・田中"
              />
            </motion.div>

            {/* 検出ワード */}
            {(result.matchedRiskWords.length > 0 ||
              result.matchedGoodWords.length > 0) && (
              <motion.div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8 }}
              >
                {result.matchedRiskWords.length > 0 && (
                  <motion.div
                    className="border-2 border-red-400 bg-red-50 p-3"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 2.9 }}
                  >
                    <p className="mb-1 text-xs font-black text-red-700">
                      RISK WORDS
                    </p>
                    <p className="text-sm text-red-800">
                      {result.matchedRiskWords.join("、")}
                    </p>
                  </motion.div>
                )}
                {result.matchedGoodWords.length > 0 && (
                  <motion.div
                    className="border-2 border-emerald-400 bg-emerald-50 p-3"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 3.0 }}
                  >
                    <p className="mb-1 text-xs font-black text-emerald-700">
                      GOOD WORDS
                    </p>
                    <p className="text-sm text-emerald-800">
                      {result.matchedGoodWords.join("、")}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** タイプライター風テキスト表示 */
function TypewriterText({ text, delay }: { text: string; delay: number }) {
  const reducedMotion = useReducedMotion() ?? false;
  const [displayed, setDisplayed] = useState(reducedMotion ? text : "");

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(text);
      return;
    }

    setDisplayed("");
    let index = 0;
    let intervalId: ReturnType<typeof setInterval>;

    const startTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          clearInterval(intervalId);
        }
      }, 25);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, delay, reducedMotion]);

  return (
    <p className="min-h-[3rem] text-base leading-relaxed text-gray-800">
      {displayed}
      {!reducedMotion && displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="ml-0.5 inline-block h-4 w-0.5 bg-indigo-600 align-middle"
        />
      )}
    </p>
  );
}
