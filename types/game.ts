export type Stage = {
  id: number;
  templateId: string;
  title: string;
  mistake: string;
  npcLine: string;
  /** 生成時の田中ステータス（AI評価用コンテキスト） */
  contextNote?: string;
};

export type TanakaStatus = {
  /** 精神衛生度 0〜100（0でメンタル崩壊ゲームオーバー） */
  mentalHealth: number;
  /** 意識レベル 0〜100（業務改善への自覚） */
  awarenessLevel: number;
};

export type TanakaStatusDelta = {
  mentalHealth: number;
  awarenessLevel: number;
};

export type StageTemplate = {
  id: string;
  title: string;
  category: "basic" | "communication" | "repeat" | "severe" | "attitude";
  severity: 1 | 2 | 3;
  mistake: {
    default: string;
    lowAwareness?: string;
    highAwareness?: string;
  };
  npcLine: {
    normal: string;
    anxious: string;
    defensive: string;
    motivated?: string;
  };
  /** このテンプレートが選ばれやすい条件 */
  preferWhen: {
    mentalHealthMax?: number;
    mentalHealthMin?: number;
    awarenessMax?: number;
    awarenessMin?: number;
  };
};

export type EvaluationStatus = "clear" | "insufficient" | "labor_consultation";

export type GameOverReason =
  | "harassment"
  | "mental_breakdown"
  | null;

export type EvaluationResult = {
  harassmentScore: number;
  specificityScore: number;
  improvementScore: number;
  satisfactionScore: number;
  status: EvaluationStatus;
  feedback: string;
  npcReaction: string;
  matchedRiskWords: string[];
  matchedGoodWords: string[];
};

export type StageHistory = {
  stageId: number;
  stageTitle: string;
  inputText: string;
  result: EvaluationResult;
  tanakaBefore: TanakaStatus;
  tanakaAfter: TanakaStatus;
  tanakaDelta: TanakaStatusDelta;
};

export type BossRank = "S" | "A" | "B" | "C" | "D";

export type FinalResult = {
  averageHarassment: number;
  clearedCount: number;
  totalStages: number;
  rank: BossRank;
  rankLabel: string;
  finalTanakaStatus: TanakaStatus;
};

/** 評価エンジンの種類 */
export type EvaluatorMode = "keyword" | "llm";

/** 1プレイあたりのステージ数 */
export const MAX_STAGES = 7;
