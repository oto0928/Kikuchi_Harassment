import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { EvaluationStatus, Stage, StageTier } from "@/types/game";

export type GoldScores = {
  harassmentScore: number;
  problemClarityScore: number;
  actionSpecificityScore: number;
  dialogueScore: number;
  supportScore: number;
  status: EvaluationStatus;
};

export type GoldEntry = {
  id: string;
  stageNumber: number;
  stageTemplateId: string;
  tier: StageTier;
  stageTitle: string;
  mistake: string;
  npcLine: string;
  inputText: string;
  pattern: string;
  gold: GoldScores;
  notes?: string;
};

export const EVALUATION_AXES = [
  "harassmentScore",
  "problemClarityScore",
  "actionSpecificityScore",
  "dialogueScore",
  "supportScore",
] as const;

export type EvaluationAxis = (typeof EVALUATION_AXES)[number];

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_GOLD_PATH = join(__dirname, "../../data/evaluation/gold.jsonl");

export function loadGoldEntries(path = DEFAULT_GOLD_PATH): GoldEntry[] {
  const lines = readFileSync(path, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => JSON.parse(line) as GoldEntry);
}

export function goldEntryToStage(entry: GoldEntry): Stage {
  return {
    id: entry.stageNumber,
    templateId: entry.stageTemplateId,
    tier: entry.tier,
    title: entry.stageTitle,
    mistake: entry.mistake,
    npcLine: entry.npcLine,
  };
}

export function mae(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
