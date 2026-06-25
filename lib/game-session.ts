import type {
  EvaluationResult,
  EvaluatorMode,
  FinalResult,
  GameOverReason,
  Stage,
  StageHistory,
  TanakaStatus,
  TanakaStatusDelta,
} from "@/types/game";

const SESSION_KEY = "kikuchi-harassment-session";
const SESSION_VERSION = 1;

export type GameSessionPhase =
  | "playing"
  | "evaluating"
  | "result"
  | "transition"
  | "finished"
  | "gameover";

export type GameSession = {
  version: typeof SESSION_VERSION;
  stageNumber: number;
  currentStage: Stage;
  tanakaStatus: TanakaStatus;
  lastTanakaDelta: TanakaStatusDelta | null;
  inputText: string;
  currentResult: EvaluationResult | null;
  history: StageHistory[];
  phase: GameSessionPhase;
  finalResult: FinalResult | null;
  gameOverReason: GameOverReason;
  inputError: string;
  evaluatorMode: EvaluatorMode;
  lastEvaluatorSource: EvaluatorMode;
  usedLlmFallback: boolean;
  llmFallbackReason?: string;
  showT4Intro: boolean;
};

function normalizePhase(phase: GameSessionPhase): GameSessionPhase {
  if (phase === "evaluating" || phase === "transition") {
    return "playing";
  }
  return phase;
}

export function saveGameSession(session: GameSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* quota exceeded etc. */
  }
}

export function loadGameSession(): GameSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GameSession;
    if (parsed.version !== SESSION_VERSION) return null;
    if (!parsed.currentStage || !parsed.tanakaStatus) return null;

    return {
      ...parsed,
      phase: normalizePhase(parsed.phase),
      showT4Intro: false,
    };
  } catch {
    return null;
  }
}

export function clearGameSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}
