import { getStageSlot, TIER_LABELS } from "@/lib/stage-templates";
import type { Stage, StageSlotTiered, StageTier, TanakaStatus } from "@/types/game";

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}

/**
 * 精神衛生度・意識レベルの低い方からティアを決定
 * T1: 両方50以上 / T2: 30-49 / T3: 15-29 / T4: 14以下
 */
export function pickTier(tanaka: TanakaStatus): StageTier {
  const minStat = Math.min(tanaka.mentalHealth, tanaka.awarenessLevel);
  if (minStat >= 50) return "t1";
  if (minStat >= 30) return "t2";
  if (minStat >= 15) return "t3";
  return "t4";
}

function buildContextNote(
  stageNumber: number,
  tier: StageTier,
  tanaka: TanakaStatus
): string {
  const mentalLabel =
    tanaka.mentalHealth >= 70
      ? "良好"
      : tanaka.mentalHealth >= 40
        ? "やや不安定"
        : "危険域";
  const awarenessLabel =
    tanaka.awarenessLevel >= 70
      ? "高い"
      : tanaka.awarenessLevel >= 40
        ? "普通"
        : "低い";

  return `ステージ${stageNumber}・ティア${TIER_LABELS[tier]}。メンタル: ${tanaka.mentalHealth}（${mentalLabel}）、意識改善レベル: ${tanaka.awarenessLevel}（${awarenessLabel}）。`;
}

/**
 * ステージ番号と田中ステータスからステージを生成
 */
export function generateStage(stageNumber: number, tanaka: TanakaStatus): Stage {
  const slot = getStageSlot(stageNumber);

  if ("fixed" in slot && slot.fixed) {
    const content = slot.tiers.t1;
    return {
      id: stageNumber,
      templateId: `stage${stageNumber}`,
      tier: "t1",
      title: content.title,
      mistake: content.mistake,
      npcLine: content.npcLine,
      contextNote: buildContextNote(stageNumber, "t1", tanaka),
    };
  }

  const tieredSlot = slot as StageSlotTiered;
  const tier = pickTier(tanaka);
  const content = tieredSlot.tiers[tier];

  return {
    id: stageNumber,
    templateId: `stage${stageNumber}`,
    tier,
    title: content.title,
    mistake: content.mistake,
    npcLine: content.npcLine,
    contextNote: buildContextNote(stageNumber, tier, tanaka),
  };
}

/** 精神衛生度から表示用ラベル */
export function getMentalHealthLabel(value: number): string {
  if (value >= 80) return "安定";
  if (value >= 60) return "普通";
  if (value >= 40) return "不安";
  if (value >= 20) return "危険";
  return "崩壊寸前";
}

/** 意識レベルから表示用ラベル */
export function getAwarenessLabel(value: number): string {
  if (value >= 80) return "高い";
  if (value >= 60) return "良好";
  if (value >= 40) return "普通";
  if (value >= 20) return "低い";
  return "要支援";
}

/** 精神衛生度から NPC ムードを決定 */
export function getMoodFromTanaka(
  tanaka: TanakaStatus
): "normal" | "worried" | "happy" | "shocked" {
  if (tanaka.mentalHealth < 25) return "shocked";
  if (tanaka.mentalHealth < 50) return "worried";
  if (tanaka.mentalHealth >= 75 && tanaka.awarenessLevel >= 60) return "happy";
  return "normal";
}

export { clamp as clampStat };
