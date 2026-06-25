import { getEndingInfo } from "@/lib/endings";
import { listAllScenarios, TIER_LABELS } from "@/lib/stage-templates";
import type {
  BossRank,
  EvaluationStatus,
  FinalResult,
  GameEnding,
  GameOverReason,
  StageHistory,
  StageTier,
} from "@/types/game";
import { MAX_STAGES } from "@/types/game";

const STORAGE_KEY = "kikuchi-harassment-progress";
const PROGRESS_VERSION = 1;

export type ScenarioKey = string;

export type ScenarioRecord = {
  stageNumber: number;
  tier: StageTier;
  title: string;
  firstSeenAt: string;
  timesEncountered: number;
  clearedOnce: boolean;
  bestStatus: EvaluationStatus | null;
};

export type PlayRecord = {
  finishedAt: string;
  clearedCount: number;
  ending: GameEnding | null;
  rank: BossRank | null;
  gameOverReason: GameOverReason;
};

export type GameProgress = {
  version: typeof PROGRESS_VERSION;
  maxStageReached: number;
  stagesCleared: Partial<Record<number, boolean>>;
  scenarios: Record<ScenarioKey, ScenarioRecord>;
  endingsSeen: GameEnding[];
  stats: {
    totalPlays: number;
    totalStageClears: number;
    totalFullClears: number;
    bestRank: BossRank | null;
    lowestAvgHarassment: number | null;
  };
  playHistory: PlayRecord[];
};

const RANK_ORDER: Record<BossRank, number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
};

export function getScenarioKey(stageNumber: number, tier: StageTier): ScenarioKey {
  return `s${stageNumber}_${tier}`;
}

export function createEmptyProgress(): GameProgress {
  return {
    version: PROGRESS_VERSION,
    maxStageReached: 1,
    stagesCleared: {},
    scenarios: {},
    endingsSeen: [],
    stats: {
      totalPlays: 0,
      totalStageClears: 0,
      totalFullClears: 0,
      bestRank: null,
      lowestAvgHarassment: null,
    },
    playHistory: [],
  };
}

export function loadGameProgress(): GameProgress {
  if (typeof window === "undefined") {
    return createEmptyProgress();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw) as GameProgress;
    if (parsed.version !== PROGRESS_VERSION) return createEmptyProgress();
    return parsed;
  } catch {
    return createEmptyProgress();
  }
}

export function saveGameProgress(progress: GameProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function isBetterRank(current: BossRank | null, next: BossRank): boolean {
  if (!current) return true;
  return RANK_ORDER[next] > RANK_ORDER[current];
}

export function isStageUnlocked(progress: GameProgress, stageNumber: number): boolean {
  if (stageNumber === 1) return true;
  return progress.maxStageReached >= stageNumber;
}

export function isScenarioUnlocked(
  progress: GameProgress,
  stageNumber: number,
  tier: StageTier
): boolean {
  return Boolean(progress.scenarios[getScenarioKey(stageNumber, tier)]);
}

export function recordStageAttempt(
  progress: GameProgress,
  stageNumber: number,
  tier: StageTier,
  title: string,
  status: EvaluationStatus
): GameProgress {
  const next: GameProgress = {
    ...progress,
    maxStageReached: Math.max(progress.maxStageReached, stageNumber),
    stagesCleared: { ...progress.stagesCleared },
    scenarios: { ...progress.scenarios },
    stats: { ...progress.stats },
  };

  const key = getScenarioKey(stageNumber, tier);
  const existing = next.scenarios[key];
  const now = new Date().toISOString();

  if (existing) {
    next.scenarios[key] = {
      ...existing,
      timesEncountered: existing.timesEncountered + 1,
      clearedOnce: existing.clearedOnce || status === "clear",
      bestStatus: pickBetterStatus(existing.bestStatus, status),
    };
  } else {
    next.scenarios[key] = {
      stageNumber,
      tier,
      title,
      firstSeenAt: now,
      timesEncountered: 1,
      clearedOnce: status === "clear",
      bestStatus: status,
    };
  }

  if (status === "clear") {
    const wasCleared = Boolean(next.stagesCleared[stageNumber]);
    next.stagesCleared[stageNumber] = true;
    if (!wasCleared) {
      next.stats.totalStageClears += 1;
    }
  }

  return next;
}

function pickBetterStatus(
  current: EvaluationStatus | null,
  next: EvaluationStatus
): EvaluationStatus {
  const order: Record<EvaluationStatus, number> = {
    clear: 3,
    insufficient: 2,
    labor_consultation: 1,
  };
  if (!current) return next;
  return order[next] >= order[current] ? next : current;
}

export function recordPlayEnd(
  progress: GameProgress,
  params: {
    history: StageHistory[];
    finalResult: FinalResult | null;
    gameOverReason: GameOverReason;
  }
): GameProgress {
  const { history, finalResult, gameOverReason } = params;
  const clearedCount = history.filter((h) => h.result.status === "clear").length;
  const next: GameProgress = {
    ...progress,
    stats: { ...progress.stats },
    endingsSeen: [...progress.endingsSeen],
    playHistory: [...progress.playHistory],
  };

  next.stats.totalPlays += 1;

  if (clearedCount === MAX_STAGES) {
    next.stats.totalFullClears += 1;
  }

  if (finalResult) {
    if (isBetterRank(next.stats.bestRank, finalResult.rank)) {
      next.stats.bestRank = finalResult.rank;
    }

    if (
      next.stats.lowestAvgHarassment === null ||
      finalResult.averageHarassment < next.stats.lowestAvgHarassment
    ) {
      next.stats.lowestAvgHarassment = finalResult.averageHarassment;
    }

    if (!next.endingsSeen.includes(finalResult.ending)) {
      next.endingsSeen.push(finalResult.ending);
    }
  }

  next.playHistory.unshift({
    finishedAt: new Date().toISOString(),
    clearedCount,
    ending: finalResult?.ending ?? null,
    rank: finalResult?.rank ?? null,
    gameOverReason,
  });
  next.playHistory = next.playHistory.slice(0, 20);

  return next;
}

export function markStageReached(
  progress: GameProgress,
  stageNumber: number
): GameProgress {
  return {
    ...progress,
    maxStageReached: Math.max(progress.maxStageReached, stageNumber),
  };
}

export function persistStageReached(stageNumber: number): GameProgress {
  const updated = markStageReached(loadGameProgress(), stageNumber);
  saveGameProgress(updated);
  return updated;
}

export function persistStageAttempt(
  stageNumber: number,
  tier: StageTier,
  title: string,
  status: EvaluationStatus
): GameProgress {
  const updated = recordStageAttempt(
    loadGameProgress(),
    stageNumber,
    tier,
    title,
    status
  );
  saveGameProgress(updated);
  return updated;
}

export function persistPlayEnd(params: {
  history: StageHistory[];
  finalResult: FinalResult | null;
  gameOverReason: GameOverReason;
}): GameProgress {
  const updated = recordPlayEnd(loadGameProgress(), params);
  saveGameProgress(updated);
  return updated;
}

export function getProgressSummary(progress: GameProgress) {
  const allScenarios = listAllScenarios();
  const unlockedScenarioCount = allScenarios.filter((s) =>
    isScenarioUnlocked(progress, s.stageNumber, s.tier)
  ).length;

  const unlockedStageCount = Array.from({ length: MAX_STAGES }, (_, i) => i + 1).filter(
    (n) => isStageUnlocked(progress, n)
  ).length;

  return {
    unlockedScenarioCount,
    totalScenarios: allScenarios.length,
    unlockedStageCount,
    totalStages: MAX_STAGES,
    endingsUnlocked: progress.endingsSeen.length,
    totalEndings: 5,
  };
}

export function getStageUnlockLabel(stageNumber: number): string {
  const labels: Record<number, string> = {
    1: "チュートリアル",
    2: "日常ミス",
    3: "エスカレート",
    4: "危機管理",
    5: "最終試練",
  };
  return labels[stageNumber] ?? `ステージ${stageNumber}`;
}

export function formatPlayDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getEndingDisplayList() {
  return (
    [
      "model_boss",
      "growth",
      "survivor",
      "neglect",
      "tanaka_chaos",
    ] as GameEnding[]
  ).map((id) => getEndingInfo(id));
}

export { TIER_LABELS };
