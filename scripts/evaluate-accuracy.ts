/**
 * ゴールドデータセット（gold.jsonl）に対するキーワード評価器精度計測
 * 実行: npm run evaluate
 */
import { evaluateGuidance } from "../lib/evaluator";
import {
  buildAccuracyReport,
  printAccuracyReport,
} from "../lib/evaluation/report";
import { loadGoldEntries } from "../lib/evaluation/gold";
import { listAllScenarios } from "../lib/stage-templates";
import type { EvaluationResult } from "../types/game";

function main() {
  const scenarios = listAllScenarios();
  console.log(`=== ステージ構成 ===`);
  console.log(`シナリオ数: ${scenarios.length}（期待: 17）`);
  if (scenarios.length !== 17) {
    console.warn("⚠ シナリオ数が17ではありません");
  }

  const entries = loadGoldEntries();
  console.log(`\n=== ゴールドデータセット ===`);
  console.log(`件数: ${entries.length}（期待: 136 = 17×8）`);

  const predictions = new Map<string, EvaluationResult>();
  for (const entry of entries) {
    predictions.set(entry.id, evaluateGuidance(entry.inputText));
  }

  const report = buildAccuracyReport(entries, predictions);
  printAccuracyReport(report, "キーワード評価 精度サマリー");

  process.exit(report.statusAccuracy >= 85 ? 0 : 1);
}

main();
