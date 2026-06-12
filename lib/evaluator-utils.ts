import type { BossRank, EvaluationResult, FinalResult, TanakaStatus } from "@/types/game";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}

export function determineStatus(
  harassmentScore: number,
  specificityScore: number,
  improvementScore: number
): EvaluationResult["status"] {
  if (harassmentScore >= 80) {
    return "labor_consultation";
  }
  if (specificityScore < 30 || improvementScore < 30) {
    return "insufficient";
  }
  return "clear";
}

export function getFeedback(status: EvaluationResult["status"]): string {
  switch (status) {
    case "labor_consultation":
      return "人格否定や強い叱責が含まれているため、部下が強い心理的負担を感じる可能性があります。業務上の問題点と改善策に絞って伝えるとよいでしょう。";
    case "insufficient":
      return "ハラスメント度は低いですが、何を直せばよいかが具体的ではありません。問題点と次回の行動を明確にすると、よりよい指導になります。";
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
      return "分かりました。次回からその点に気をつけます。必要なら早めに相談します。";
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

/** スコアから EvaluationResult の共通フィールドを組み立てる */
export function buildEvaluationResult(
  scores: {
    harassmentScore: number;
    specificityScore: number;
    improvementScore: number;
    satisfactionScore: number;
    matchedRiskWords: string[];
    matchedGoodWords: string[];
    feedback?: string;
    npcReaction?: string;
  }
): EvaluationResult {
  const status = determineStatus(
    scores.harassmentScore,
    scores.specificityScore,
    scores.improvementScore
  );

  return {
    harassmentScore: clamp(scores.harassmentScore),
    specificityScore: clamp(scores.specificityScore),
    improvementScore: clamp(scores.improvementScore),
    satisfactionScore: clamp(scores.satisfactionScore),
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
  finalTanakaStatus: TanakaStatus
): FinalResult {
  let rank: BossRank;
  let rankLabel: string;

  if (clearedCount === totalStages && averageHarassment < 25) {
    rank = "S";
    rankLabel = "模範的な上司";
  } else if (clearedCount === totalStages && averageHarassment < 40) {
    rank = "A";
    rankLabel = "信頼される上司";
  } else if (clearedCount >= 5) {
    rank = "B";
    rankLabel = "成長中の上司";
  } else if (clearedCount >= 3) {
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
  };
}
