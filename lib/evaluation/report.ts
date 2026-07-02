import type { EvaluationResult, EvaluationStatus } from "@/types/game";

import {
  EVALUATION_AXES,
  type EvaluationAxis,
  type GoldEntry,
  mae,
} from "./gold";

export type AccuracyReport = {
  total: number;
  statusMatches: number;
  statusAccuracy: number;
  axisMae: Record<EvaluationAxis, number>;
  byPattern: Map<string, { total: number; match: number }>;
  mismatches: Array<{
    id: string;
    pattern: string;
    goldStatus: EvaluationStatus;
    predStatus: EvaluationStatus;
    gold: GoldEntry["gold"];
    pred: EvaluationResult;
  }>;
};

export function buildAccuracyReport(
  entries: GoldEntry[],
  predictions: Map<string, EvaluationResult>
): AccuracyReport {
  let statusMatches = 0;
  const axisErrors: Record<EvaluationAxis, number[]> = {
    harassmentScore: [],
    problemClarityScore: [],
    dialogueScore: [],
    supportScore: [],
  };
  const mismatches: AccuracyReport["mismatches"] = [];
  const byPattern = new Map<string, { total: number; match: number }>();

  for (const entry of entries) {
    const pred = predictions.get(entry.id);
    if (!pred) continue;

    const stat = byPattern.get(entry.pattern) ?? { total: 0, match: 0 };
    stat.total += 1;

    if (pred.status === entry.gold.status) {
      statusMatches += 1;
      stat.match += 1;
    } else {
      mismatches.push({
        id: entry.id,
        pattern: entry.pattern,
        goldStatus: entry.gold.status,
        predStatus: pred.status,
        gold: entry.gold,
        pred,
      });
    }

    byPattern.set(entry.pattern, stat);

    for (const axis of EVALUATION_AXES) {
      axisErrors[axis].push(Math.abs(pred[axis] - entry.gold[axis]));
    }
  }

  const axisMae = Object.fromEntries(
    EVALUATION_AXES.map((axis) => [axis, mae(axisErrors[axis])])
  ) as Record<EvaluationAxis, number>;

  return {
    total: entries.length,
    statusMatches,
    statusAccuracy: entries.length > 0 ? (statusMatches / entries.length) * 100 : 0,
    axisMae,
    byPattern,
    mismatches,
  };
}

export function printAccuracyReport(
  report: AccuracyReport,
  label: string,
  targetAccuracy = 85
): void {
  console.log(`\n=== ${label} ===`);
  console.log(
    `status一致率: ${report.statusAccuracy.toFixed(1)}% (${report.statusMatches}/${report.total})`
  );
  console.log(`目標: ${targetAccuracy}%以上`);

  console.log(`\n--- 各軸 MAE ---`);
  for (const axis of EVALUATION_AXES) {
    console.log(`${axis}: ${report.axisMae[axis].toFixed(1)}`);
  }

  console.log(`\n--- パターン別 status一致率 ---`);
  for (const [pattern, stat] of [...report.byPattern.entries()].sort()) {
    console.log(
      `${pattern}: ${((stat.match / stat.total) * 100).toFixed(1)}% (${stat.match}/${stat.total})`
    );
  }

  if (report.mismatches.length > 0) {
    console.log(`\n=== 誤判定一覧（${report.mismatches.length}件）===`);
    for (const m of report.mismatches.slice(0, 30)) {
      console.log(
        `[${m.id}] gold=${m.goldStatus} pred=${m.predStatus} pattern=${m.pattern}`
      );
      console.log(
        `  gold: H=${m.gold.harassmentScore} PC=${m.gold.problemClarityScore}`
      );
      console.log(
        `  pred: H=${m.pred.harassmentScore} PC=${m.pred.problemClarityScore}`
      );
    }
    if (report.mismatches.length > 30) {
      console.log(`... 他 ${report.mismatches.length - 30} 件`);
    }
  }
}
