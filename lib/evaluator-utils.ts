import { EVALUATOR_PARAMS } from "@/lib/evaluator-params";
import type { BossRank, EvaluationResult, FinalResult, TanakaStatus } from "@/types/game";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}

/**
 * AI判定のハラスメント度をキーワード基準と整合させる。
 * 指導文にリスク表現が無いのに LLM が高得点を出す誤判定を防ぐ。
 */
export function reconcileHarassmentScore(
  llmScore: number,
  baseline: { score: number; matchedRiskWords: string[] }
): number {
  const llm = clamp(llmScore);

  if (baseline.matchedRiskWords.length === 0) {
    return Math.min(llm, baseline.score);
  }

  return Math.max(llm, baseline.score);
}

/**
 * AI判定の「問題点の明確さ」をキーワード基準と整合させる。
 * 無関係・意味不明・極端に短い入力（キーワード基準で明確さがほぼ無い）に対し、
 * LLM が高得点を出して不当にクリアになるのを防ぐ。
 * キーワード基準が閾値未満のときは、その値＋わずかな上乗せまでしか認めない。
 */
export function reconcileProblemClarityScore(
  llmScore: number,
  keywordScore: number
): number {
  const llm = clamp(llmScore);
  if (keywordScore < EVALUATOR_PARAMS.insufficientThreshold) {
    return Math.min(llm, keywordScore + EVALUATOR_PARAMS.llmClarityMargin);
  }
  return llm;
}

export function determineStatus(
  harassmentScore: number,
  problemClarityScore: number
): EvaluationResult["status"] {
  if (harassmentScore >= EVALUATOR_PARAMS.harassment.laborThreshold) {
    return "labor_consultation";
  }
  if (problemClarityScore < EVALUATOR_PARAMS.insufficientThreshold) {
    return "insufficient";
  }
  return "clear";
}

export function getFeedback(status: EvaluationResult["status"]): string {
  switch (status) {
    case "labor_consultation":
      return "人格否定や強い叱責が含まれているため、部下が強い心理的負担を感じる可能性があります。業務上の問題点と改善策に絞って伝えるとよいでしょう。";
    case "insufficient":
      return "ハラスメント度は低いですが、問題点の特定や改善行動が十分ではありません。何が問題で、次に何をするかを明確にすると、よりよい指導になります。";
    case "clear":
      return "問題点を指摘しつつ、次にどう改善すればよいかが伝わっています。感情的な表現を避け、業務上の改善に焦点を当てられています。";
  }
}

export function getNpcReaction(status: EvaluationResult["status"]): string {
  switch (status) {
    case "labor_consultation":
      return "すみません……ただ、その言い方はかなりつらいです。労基に相談しようと思います。";
    case "insufficient":
      return "怒られてはいないのですが、具体的に何を直せばいいのか少し分かりませんでした。";
    case "clear":
      return "分かりました。次回からその点に気をつめます。必要なら早めに相談します。";
  }
}

export function getStatusLabel(status: EvaluationResult["status"]): string {
  switch (status) {
    case "clear":
      return "クリア";
    case "insufficient":
      return "指導不足";
    case "labor_consultation":
      return "労基相談エンド";
  }
}

export function buildEvaluationResult(
  scores: {
    harassmentScore: number;
    problemClarityScore: number;
    dialogueScore: number;
    supportScore: number;
    matchedRiskWords: string[];
    matchedGoodWords: string[];
    feedback?: string;
    npcReaction?: string;
  }
): EvaluationResult {
  const status = determineStatus(
    scores.harassmentScore,
    scores.problemClarityScore
  );

  return {
    harassmentScore: clamp(scores.harassmentScore),
    problemClarityScore: clamp(scores.problemClarityScore),
    dialogueScore: clamp(scores.dialogueScore),
    supportScore: clamp(scores.supportScore),
    status,
    feedback: scores.feedback ?? getFeedback(status),
    npcReaction: scores.npcReaction ?? getNpcReaction(status),
    matchedRiskWords: scores.matchedRiskWords,
    matchedGoodWords: scores.matchedGoodWords,
  };
}

export function calculateBossRank(
  clearedCount: number,
  totalStages: number,
  averageHarassment: number,
  finalTanakaStatus: TanakaStatus,
  ending: FinalResult["ending"],
  endingTitle: string,
  endingDescription: string
): FinalResult {
  let rank: BossRank;
  let rankLabel: string;

  if (clearedCount === totalStages && averageHarassment < 25) {
    rank = "S";
    rankLabel = "模範的な上司";
  } else if (clearedCount === totalStages && averageHarassment < 40) {
    rank = "A";
    rankLabel = "信頼される上司";
  } else if (clearedCount >= 4) {
    rank = "B";
    rankLabel = "成長中の上司";
  } else if (clearedCount >= 2) {
    rank = "C";
    rankLabel = "指導力に課題あり";
  } else {
    rank = "D";
    rankLabel = "見直しが必要";
  }

  return {
    averageHarassment: Math.round(averageHarassment * 10) / 10,
    clearedCount,
    totalStages,
    rank,
    rankLabel,
    finalTanakaStatus,
    ending,
    endingTitle,
    endingDescription,
  };
}
