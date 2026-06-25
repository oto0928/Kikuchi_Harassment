/**
 * ゴールドデータセットに対する LLM 評価器精度計測
 * 実行: npm run evaluate:llm
 * オプション: --limit 20  --pattern clear,insufficient  --delay 300
 */
import { loadEnvLocal } from "../lib/load-env-local";

loadEnvLocal();

import { evaluateGuidanceWithLLM } from "../lib/evaluator-llm";
import {
  buildAccuracyReport,
  printAccuracyReport,
} from "../lib/evaluation/report";
import {
  goldEntryToStage,
  loadGoldEntries,
  type GoldEntry,
} from "../lib/evaluation/gold";
import { listAllScenarios } from "../lib/stage-templates";
import type { EvaluationResult } from "../types/game";

function parseArgs() {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let delayMs = 250;
  let patterns: string[] | null = null;

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = Number(args[i + 1]);
      i += 1;
    } else if (args[i] === "--delay" && args[i + 1]) {
      delayMs = Number(args[i + 1]);
      i += 1;
    } else if (args[i] === "--pattern" && args[i + 1]) {
      patterns = args[i + 1].split(",").map((p) => p.trim());
      i += 1;
    }
  }

  return { limit, delayMs, patterns };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY が未設定です。.env.local を確認してください。");
    process.exit(1);
  }

  const { limit, delayMs, patterns } = parseArgs();
  const scenarios = listAllScenarios();
  let entries: GoldEntry[] = loadGoldEntries();

  if (patterns) {
    entries = entries.filter((e) => patterns!.includes(e.pattern));
  }
  if (limit !== null && limit > 0) {
    entries = entries.slice(0, limit);
  }

  console.log(`=== ステージ構成 ===`);
  console.log(`シナリオ数: ${scenarios.length}（期待: 17）`);

  console.log(`\n=== LLM評価（${process.env.OPENAI_MODEL ?? "gpt-4o-mini"}）===`);
  console.log(`対象件数: ${entries.length}`);
  console.log(`リクエスト間隔: ${delayMs}ms`);

  const predictions = new Map<string, EvaluationResult>();
  let errors = 0;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const stage = goldEntryToStage(entry);

    process.stdout.write(`\r評価中 ${i + 1}/${entries.length} ${entry.id}...`);

    try {
      const result = await evaluateGuidanceWithLLM(entry.inputText, stage, {
        fallbackToKeyword: false,
        maxRetries: 2,
      });
      predictions.set(entry.id, result);
    } catch (error) {
      errors += 1;
      console.error(
        `\n[ERROR] ${entry.id}:`,
        error instanceof Error ? error.message : error
      );
    }

    if (i < entries.length - 1) {
      await sleep(delayMs);
    }
  }

  console.log("\n");

  if (errors > 0) {
    console.warn(`⚠ ${errors} 件の評価に失敗しました`);
  }

  const evaluated = entries.filter((e) => predictions.has(e.id));
  const report = buildAccuracyReport(evaluated, predictions);

  printAccuracyReport(report, "LLM 精度サマリー");

  process.exit(report.statusAccuracy >= 85 && errors === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
