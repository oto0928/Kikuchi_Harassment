export type StageTier = "t1" | "t2" | "t3" | "t4";

export type StageTierContent = {
  title: string;
  mistake: string;
  npcLine: string;
};

/** ステージ1：固定・T1のみ（1シナリオ） */
export type StageSlotFixed = {
  stageNumber: 1;
  fixed: true;
  tiers: { t1: StageTierContent };
};

/** ステージ2〜5：T1〜T4（各4シナリオ） */
export type StageSlotTiered = {
  stageNumber: 2 | 3 | 4 | 5;
  tiers: Record<StageTier, StageTierContent>;
};

export type StageSlot = StageSlotFixed | StageSlotTiered;

export type Stage = {
  id: number;
  templateId: string;
  tier: StageTier;
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

export type EvaluationStatus = "clear" | "insufficient" | "labor_consultation";

export type GameOverReason = "harassment" | "mental_breakdown" | null;

export type EvaluationResult = {
  harassmentScore: number;
  problemClarityScore: number;
  actionSpecificityScore: number;
  dialogueScore: number;
  supportScore: number;
  status: EvaluationStatus;
  feedback: string;
  npcReaction: string;
  matchedRiskWords: string[];
  matchedGoodWords: string[];
};

export type StageHistory = {
  stageId: number;
  stageTitle: string;
  tier: StageTier;
  inputText: string;
  result: EvaluationResult;
  tanakaBefore: TanakaStatus;
  tanakaAfter: TanakaStatus;
  tanakaDelta: TanakaStatusDelta;
};

export type BossRank = "S" | "A" | "B" | "C" | "D";

export type GameEnding =
  | "model_boss"
  | "growth"
  | "survivor"
  | "neglect"
  | "tanaka_chaos";

export type FinalResult = {
  averageHarassment: number;
  clearedCount: number;
  totalStages: number;
  rank: BossRank;
  rankLabel: string;
  finalTanakaStatus: TanakaStatus;
  ending: GameEnding;
  endingTitle: string;
  endingDescription: string;
};

/** 評価エンジンの種類 */
export type EvaluatorMode = "keyword" | "llm";

/** 1プレイあたりのステージ数 */
export const MAX_STAGES = 5;

/** @deprecated 旧テンプレート型。stage-templates の StageSlot を使用 */
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
  preferWhen: {
    mentalHealthMax?: number;
    mentalHealthMin?: number;
    awarenessMax?: number;
    awarenessMin?: number;
  };
};
