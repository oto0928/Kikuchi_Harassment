import { STAGE_TEMPLATES } from "@/lib/stage-templates";
import type { Stage, StageTemplate, TanakaStatus } from "@/types/game";

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}

/** テンプレートと現在ステータスの適合度を算出 */
function calcFitScore(template: StageTemplate, tanaka: TanakaStatus): number {
  let score = 50;

  const { mentalHealth, awarenessLevel } = tanaka;
  const pref = template.preferWhen;

  // 条件に合致するほど加点
  if (pref.mentalHealthMax !== undefined && mentalHealth <= pref.mentalHealthMax) {
    score += 25;
  }
  if (pref.mentalHealthMin !== undefined && mentalHealth >= pref.mentalHealthMin) {
    score += 25;
  }
  if (pref.awarenessMax !== undefined && awarenessLevel <= pref.awarenessMax) {
    score += 25;
  }
  if (pref.awarenessMin !== undefined && awarenessLevel >= pref.awarenessMin) {
    score += 25;
  }

  // 精神衛生度が低いほど severity 高いシナリオを優先
  if (mentalHealth < 40) {
    score += template.severity * 8;
  } else if (mentalHealth > 70) {
    score -= template.severity * 5;
    if (template.severity === 1) score += 15;
  }

  // 意識レベルが高いほど軽微なミスを優先
  if (awarenessLevel > 60 && template.severity === 1) score += 20;
  if (awarenessLevel < 30 && template.category === "repeat") score += 20;

  // カテゴリ別の動的ブースト
  if (mentalHealth < 35 && template.category === "attitude") score += 15;
  if (awarenessLevel < 35 && template.category === "repeat") score += 15;
  if (awarenessLevel > 55 && template.id === "minor_slip") score += 20;

  return score;
}

/** 精神衛生度に応じたセリフを選択 */
function selectNpcLine(template: StageTemplate, tanaka: TanakaStatus): string {
  const { mentalHealth, awarenessLevel } = tanaka;
  const lines = template.npcLine;

  if (awarenessLevel >= 60 && lines.motivated) {
    return lines.motivated;
  }
  if (mentalHealth < 35) {
    return lines.defensive;
  }
  if (mentalHealth < 60) {
    return lines.anxious;
  }
  return lines.normal;
}

/** 意識レベルに応じたミス内容を選択 */
function selectMistake(template: StageTemplate, tanaka: TanakaStatus): string {
  const { awarenessLevel } = tanaka;
  const m = template.mistake;

  if (awarenessLevel >= 55 && m.highAwareness) {
    return m.highAwareness;
  }
  if (awarenessLevel < 40 && m.lowAwareness) {
    return m.lowAwareness;
  }
  return m.default;
}

/** 生成コンテキストの説明文 */
function buildContextNote(
  template: StageTemplate,
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

  return `田中の精神衛生度: ${tanaka.mentalHealth}（${mentalLabel}）、意識レベル: ${tanaka.awarenessLevel}（${awarenessLabel}）。${template.category}系の出来事が発生。`;
}

/**
 * 田中のステータスに基づいて次のステージを動的生成
 */
export function generateStage(
  stageNumber: number,
  tanaka: TanakaStatus,
  usedTemplateIds: string[]
): Stage {
  const available = STAGE_TEMPLATES.filter(
    (t) => !usedTemplateIds.includes(t.id)
  );

  // 使い切った場合はリセット（同カテゴリ被りを避けるため severity でソート）
  const pool = available.length > 0 ? available : [...STAGE_TEMPLATES];

  const scored = pool
    .map((template) => ({
      template,
      score: calcFitScore(template, tanaka) + Math.random() * 15,
    }))
    .sort((a, b) => b.score - a.score);

  const picked = scored[0]?.template ?? STAGE_TEMPLATES[0];

  return {
    id: stageNumber,
    templateId: picked.id,
    title: picked.title,
    mistake: selectMistake(picked, tanaka),
    npcLine: selectNpcLine(picked, tanaka),
    contextNote: buildContextNote(picked, tanaka),
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
export function getMoodFromTanaka(tanaka: TanakaStatus): "normal" | "worried" | "happy" | "shocked" {
  if (tanaka.mentalHealth < 25) return "shocked";
  if (tanaka.mentalHealth < 50) return "worried";
  if (tanaka.mentalHealth >= 75 && tanaka.awarenessLevel >= 60) return "happy";
  return "normal";
}

export { clamp as clampStat };
