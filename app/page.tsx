"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FinalScreen from "@/components/FinalScreen";
import EvaluationOverlay, {
  waitForEvaluation,
} from "@/components/EvaluationOverlay";
import GameHud from "@/components/GameHud";
import { MentalBreakdownFullScreenFlash } from "@/components/MentalBreakdownGameOverImage";
import RoukiGameOverImage, {
  RoukiFullScreenFlash,
} from "@/components/RoukiGameOverImage";
import ResultCard from "@/components/ResultCard";
import StageCard from "@/components/StageCard";
import TanakaStatusPanel from "@/components/TanakaStatusPanel";
import T4ChaosEffects from "@/components/T4ChaosEffects";
import T4StageIntro from "@/components/T4StageIntro";
import StageTransitionCutscene from "@/components/StageTransitionCutscene";
import AppNav from "@/components/AppNav";
import { useGameAudio } from "@/components/GameAudioProvider";
import { calculateBossRank, evaluateGuidance } from "@/lib/evaluator";
import { resolveEnding } from "@/lib/endings";
import { persistPlayEnd, persistStageAttempt, persistStageReached } from "@/lib/game-progress";
import {
  clearGameSession,
  loadGameSession,
  saveGameSession,
  type GameSessionPhase,
} from "@/lib/game-session";
import { generateStage } from "@/lib/stage-generator";
import {
  INITIAL_TANAKA_STATUS,
  applyTanakaDelta,
  calcTanakaDelta,
  checkGameOver,
} from "@/lib/tanaka-state";
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
import { MAX_STAGES } from "@/types/game";

type GamePhase = GameSessionPhase;

export default function GamePage() {
  const [hydrated, setHydrated] = useState(false);
  const isFreshGameRef = useRef(true);
  const [stageNumber, setStageNumber] = useState(1);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [tanakaStatus, setTanakaStatus] = useState<TanakaStatus>(INITIAL_TANAKA_STATUS);
  const [lastTanakaDelta, setLastTanakaDelta] = useState<TanakaStatusDelta | null>(null);
  const [inputText, setInputText] = useState("");
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<StageHistory[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null);
  const [inputError, setInputError] = useState("");
  const [evaluatorMode, setEvaluatorMode] = useState<EvaluatorMode>("keyword");
  const [llmAvailable, setLlmAvailable] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [showRoukiFlash, setShowRoukiFlash] = useState(false);
  const [showMentalBreakdownFlash, setShowMentalBreakdownFlash] = useState(false);
  const [lastEvaluatorSource, setLastEvaluatorSource] =
    useState<EvaluatorMode>("keyword");
  const [usedLlmFallback, setUsedLlmFallback] = useState(false);
  const [llmFallbackReason, setLlmFallbackReason] = useState<string | undefined>();
  const [showT4Intro, setShowT4Intro] = useState(false);
  const { unlock, playSe, startBgm, playEndingAudio } = useGameAudio();

  const clearedCount = history.filter((h) => h.result.status === "clear").length;

  function buildFinalResult(
    allHistory: StageHistory[],
    finalTanaka: TanakaStatus
  ): FinalResult {
    const avg =
      allHistory.length > 0
        ? allHistory.reduce((sum, h) => sum + h.result.harassmentScore, 0) /
          allHistory.length
        : 0;
    const cleared = allHistory.filter((h) => h.result.status === "clear").length;
    const endingInfo = resolveEnding(cleared, avg, finalTanaka, allHistory);
    return calculateBossRank(
      cleared,
      MAX_STAGES,
      avg,
      finalTanaka,
      endingInfo.id,
      endingInfo.title,
      endingInfo.description
    );
  }

  /** ゲーム初期化・ステージ生成 */
  const initGame = useCallback(() => {
    clearGameSession();
    const initialTanaka = { ...INITIAL_TANAKA_STATUS };
    const firstStage = generateStage(1, initialTanaka);
    setStageNumber(1);
    setCurrentStage(firstStage);
    setTanakaStatus(initialTanaka);
    setLastTanakaDelta(null);
    setInputText("");
    setCurrentResult(null);
    setHistory([]);
    setPhase("playing");
    setFinalResult(null);
    setGameOverReason(null);
    setShowRoukiFlash(false);
    setShowMentalBreakdownFlash(false);
    setInputError("");
    setUsedLlmFallback(false);
    setLlmFallbackReason(undefined);
    setShowT4Intro(false);
    persistStageReached(1);
  }, []);

  /** マウント時：進行中セッションを復元、なければ新規開始 */
  useEffect(() => {
    const saved = loadGameSession();
    if (saved) {
      isFreshGameRef.current = false;
      setStageNumber(saved.stageNumber);
      setCurrentStage(saved.currentStage);
      setTanakaStatus(saved.tanakaStatus);
      setLastTanakaDelta(saved.lastTanakaDelta);
      setInputText(saved.inputText);
      setCurrentResult(saved.currentResult);
      setHistory(saved.history);
      setPhase(saved.phase);
      setFinalResult(saved.finalResult);
      setGameOverReason(saved.gameOverReason);
      setInputError(saved.inputError);
      setEvaluatorMode(saved.evaluatorMode);
      setLastEvaluatorSource(saved.lastEvaluatorSource);
      setUsedLlmFallback(saved.usedLlmFallback);
      setLlmFallbackReason(saved.llmFallbackReason);
      setShowT4Intro(saved.showT4Intro);
      if (
        saved.phase === "result" ||
        saved.phase === "gameover" ||
        saved.phase === "finished"
      ) {
        setCanProceed(true);
      }
    } else {
      initGame();
    }
    setHydrated(true);
  }, [initGame]);

  /** ゲーム状態を sessionStorage に保存（ページ遷移後も復元できるように） */
  useEffect(() => {
    if (!hydrated || !currentStage) return;

    saveGameSession({
      version: 1,
      stageNumber,
      currentStage,
      tanakaStatus,
      lastTanakaDelta,
      inputText,
      currentResult,
      history,
      phase,
      finalResult,
      gameOverReason,
      inputError,
      evaluatorMode,
      lastEvaluatorSource,
      usedLlmFallback,
      llmFallbackReason,
      showT4Intro,
    });
  }, [
    hydrated,
    stageNumber,
    currentStage,
    tanakaStatus,
    lastTanakaDelta,
    inputText,
    currentResult,
    history,
    phase,
    finalResult,
    gameOverReason,
    inputError,
    evaluatorMode,
    lastEvaluatorSource,
    usedLlmFallback,
    llmFallbackReason,
    showT4Intro,
  ]);

  /** AI評価APIの利用可否を確認 */
  useEffect(() => {
    fetch("/api/evaluate")
      .then((res) => res.json())
      .then((data: { available: boolean }) => {
        setLlmAvailable(data.available);
        if (data.available && isFreshGameRef.current) {
          setEvaluatorMode("llm");
        }
      })
      .catch(() => setLlmAvailable(false));
  }, []);

  /** 労基フラッシュを自動で消す */
  useEffect(() => {
    if (!showRoukiFlash) return;
    const timer = setTimeout(() => setShowRoukiFlash(false), 2500);
    return () => clearTimeout(timer);
  }, [showRoukiFlash]);

  /** メンタル崩壊フラッシュを自動で消す */
  useEffect(() => {
    if (!showMentalBreakdownFlash) return;
    const timer = setTimeout(() => setShowMentalBreakdownFlash(false), 2800);
    return () => clearTimeout(timer);
  }, [showMentalBreakdownFlash]);

  /** 結果アニメーション完了後に次へ進めるようにする */
  useEffect(() => {
    if (phase === "result" || phase === "gameover") {
      setCanProceed(false);
      const timer = setTimeout(() => setCanProceed(true), 3500);
      return () => clearTimeout(timer);
    }
    setCanProceed(false);
  }, [phase, currentResult]);

  /** BGM切り替え */
  useEffect(() => {
    const isChaosStage = currentStage?.tier === "t4";

    if (phase === "playing") {
      startBgm(isChaosStage ? "chaos_play" : "play");
    } else if (phase === "evaluating") {
      startBgm("evaluating");
    } else if (phase === "result") {
      startBgm(isChaosStage ? "chaos_play" : "play");
    } else if (phase === "gameover") {
      if (gameOverReason === "mental_breakdown") {
        startBgm("mental_breakdown");
      } else {
        startBgm("game_over");
      }
    } else if (phase === "finished" && finalResult) {
      playEndingAudio(finalResult.ending);
    }
  }, [phase, finalResult, gameOverReason, startBgm, playEndingAudio, currentStage?.tier]);

  /** T4ステージ突入時のイントロ演出 */
  useEffect(() => {
    if (phase !== "playing" || !currentStage) return;
    if (currentStage.tier === "t4") {
      setShowT4Intro(true);
    }
  }, [phase, currentStage?.id, currentStage?.tier]);

  /** 判定SE */
  useEffect(() => {
    if (phase === "result" && currentResult) {
      if (currentResult.status === "clear") {
        playSe("clear");
      } else if (currentResult.status === "insufficient") {
        playSe("insufficient");
      }
    }
    if (phase === "gameover" && currentResult) {
      if (currentResult.status === "labor_consultation") {
        playSe("critical");
      } else if (gameOverReason === "mental_breakdown") {
        playSe("mental_breakdown");
      } else {
        playSe("game_over");
      }
    }
  }, [phase, currentResult, gameOverReason, playSe]);

  /** 評価結果を反映してゲーム状態を更新 */
  function applyResult(result: EvaluationResult, trimmed: string, source: EvaluatorMode) {
    if (!currentStage) return;

    setCurrentResult(result);
    setLastEvaluatorSource(source);

    const tanakaBefore = { ...tanakaStatus };
    const delta = calcTanakaDelta(result);
    const tanakaAfter = applyTanakaDelta(tanakaBefore, delta);
    setTanakaStatus(tanakaAfter);
    setLastTanakaDelta(delta);

    const entry: StageHistory = {
      stageId: currentStage.id,
      stageTitle: currentStage.title,
      tier: currentStage.tier,
      inputText: trimmed,
      result,
      tanakaBefore,
      tanakaAfter,
      tanakaDelta: delta,
    };
    const allHistory = [...history, entry];
    setHistory(allHistory);

    persistStageAttempt(
      currentStage.id,
      currentStage.tier,
      currentStage.title,
      result.status
    );

    const overReason = checkGameOver(result, tanakaAfter);
    if (overReason) {
      setGameOverReason(overReason);
      if (overReason === "harassment") {
        setShowRoukiFlash(true);
      }
      if (overReason === "mental_breakdown") {
        setShowMentalBreakdownFlash(true);
      }
      const final = buildFinalResult(allHistory, tanakaAfter);
      setFinalResult(final);
      persistPlayEnd({
        history: allHistory,
        finalResult: final,
        gameOverReason: overReason,
      });
      setPhase("gameover");
    } else {
      setPhase("result");
    }
  }

  /** 指導文を評価する */
  async function handleEvaluate() {
    if (!currentStage) return;

    const trimmed = inputText.trim();
    if (!trimmed) {
      setInputError("指導文を入力してください。");
      return;
    }
    await unlock();
    playSe("submit");
    setInputError("");
    setPhase("evaluating");

    try {
      const runEvaluation = async (): Promise<{
        result: EvaluationResult;
        source: EvaluatorMode;
        usedFallback?: boolean;
        fallbackReason?: string;
      }> => {
        if (evaluatorMode === "llm") {
          const res = await fetch("/api/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inputText: trimmed,
              stage: currentStage,
            }),
          });

          const data = (await res.json()) as {
            result?: EvaluationResult;
            source?: EvaluatorMode;
            usedFallback?: boolean;
            fallbackReason?: string;
            error?: string;
          };

          if (!res.ok || !data.result) {
            throw new Error(data.error ?? "AI評価に失敗しました。");
          }

          return {
            result: data.result,
            source: data.usedFallback ? "keyword" : (data.source ?? "llm"),
            usedFallback: data.usedFallback,
            fallbackReason: data.fallbackReason,
          };
        }

        return { result: evaluateGuidance(trimmed), source: "keyword" };
      };

      const { result, source, usedFallback, fallbackReason } =
        await waitForEvaluation(runEvaluation());
      setUsedLlmFallback(Boolean(usedFallback));
      setLlmFallbackReason(fallbackReason);
      applyResult(result, trimmed, source);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "評価中にエラーが発生しました。";
      setInputError(message);
      setPhase("playing");
    }
  }

  /** 次のステージへ進む */
  function handleNextStage() {
    if (stageNumber >= MAX_STAGES) {
      playSe("stage_advance");
      finishGame();
      return;
    }

    setPhase("transition");
  }

  /** ステージ間カット終了後に次ステージへ */
  function completeStageTransition() {
    const nextNumber = stageNumber + 1;
    const nextStage = generateStage(nextNumber, tanakaStatus);
    persistStageReached(nextNumber);

    setStageNumber(nextNumber);
    setCurrentStage(nextStage);
    setInputText("");
    setCurrentResult(null);
    setLastTanakaDelta(null);
    setShowT4Intro(nextStage.tier === "t4");
    setPhase("playing");
    setInputError("");
  }

  /** ゲーム終了処理 */
  function finishGame() {
    const final = buildFinalResult(history, tanakaStatus);
    setFinalResult(final);
    persistPlayEnd({
      history,
      finalResult: final,
      gameOverReason: null,
    });
    setPhase("finished");
  }

  /** ゲームをリセット */
  function handleRestart() {
    playSe("click");
    isFreshGameRef.current = true;
    initGame();
  }

  const isGameEnded = phase === "finished" || phase === "gameover";

  if (!hydrated || !currentStage) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-indigo-950 text-white">
        読み込み中...
      </div>
    );
  }

  const isChaosStage = currentStage.tier === "t4";

  return (
    <div className="min-h-dvh overflow-x-hidden bg-indigo-950">
      <RoukiFullScreenFlash show={showRoukiFlash} />
      <MentalBreakdownFullScreenFlash show={showMentalBreakdownFlash} />
      <T4StageIntro
        show={showT4Intro}
        stageNumber={stageNumber}
        onComplete={() => setShowT4Intro(false)}
      />
      <StageTransitionCutscene
        show={phase === "transition"}
        completedStage={stageNumber}
        nextStage={stageNumber + 1}
        tanakaStatus={tanakaStatus}
        delta={lastTanakaDelta}
        resultStatus={currentResult?.status ?? "insufficient"}
        onComplete={completeStageTransition}
      />
      {isChaosStage && !isGameEnded && !showT4Intro && phase !== "transition" && (
        <T4ChaosEffects active variant="full" />
      )}

      {/* ゲーム背景パターン */}
      <div
        className="pointer-events-none fixed inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #6366f1 2px, #6366f1 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, #6366f1 2px, #6366f1 4px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-8">
        {/* ゲームフレーム */}
        <div className="border-4 border-indigo-400 bg-indigo-900 p-1 sm:p-2">
          <div className="border-2 border-indigo-600 bg-gradient-to-b from-indigo-800 to-indigo-950 p-4 sm:p-6">
            {/* ヘッダー */}
            <header className="mb-6 text-center">
              <p className="mb-1 text-xs font-black tracking-[0.3em] text-yellow-400">
                OPEN CAMPUS GAME
              </p>
              <h1 className="text-xl font-black text-white sm:text-2xl md:text-3xl">
                AI部下指導シミュレーター
              </h1>
              <p className="mt-2 inline-block border-2 border-orange-500 bg-orange-600 px-4 py-1 text-sm font-black text-white sm:text-base">
                ハラスメント80点を超えるな！
              </p>
              <div className="mt-4 flex justify-center">
                <AppNav current="game" />
              </div>
            </header>

            {/* ゲーム説明（プレイ中のみ） */}
            {!isGameEnded &&
              phase === "playing" &&
              stageNumber === 1 &&
              history.length === 0 && (
                <section className="mb-6 border-2 border-indigo-400 bg-indigo-800 p-4 sm:p-5">
                  <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-yellow-300">
                    <span className="border border-yellow-400 px-2 py-0.5 text-xs">
                      HOW TO PLAY
                    </span>
                    ゲーム説明
                  </h2>
                  <p className="text-left text-base leading-relaxed text-indigo-100">
                    あなたは上司役です。部下の田中が仕事でミスをした場面が表示されます。
                    ハラスメントにならない範囲で、具体的で改善につながる指導文を考えて入力してください。
                  </p>
                  <ul className="mt-3 space-y-1 text-left text-sm text-indigo-200">
                    <li>・ハラスメント度が80点以上 → 即ゲームオーバー</li>
                    <li>・田中のメンタルが0 → メンタル崩壊ゲームオーバー</li>
                    <li>
                      ・問題点の明確さまたは改善行動の具体性が30点未満 → 指導不足（ステージ失敗）
                    </li>
                    <li>・田中の状態が悪いほど、ミスがエスカレートします</li>
                    <li>・全5ステージ完走でエンディングが表示されます</li>
                  </ul>
                </section>
              )}

            {/* プレイ画面 */}
            {!isGameEnded && (phase === "playing" || phase === "evaluating") && (
              <>
                <TanakaStatusPanel status={tanakaStatus} compact />

                <GameHud
                  currentStage={stageNumber}
                  totalStages={MAX_STAGES}
                  clearedCount={clearedCount}
                  stageTitle={currentStage.title}
                  tier={currentStage.tier}
                />

                <StageCard
                  stage={currentStage}
                  currentIndex={stageNumber - 1}
                  totalStages={MAX_STAGES}
                  tanakaStatus={tanakaStatus}
                />

                {phase === "playing" && (
                  <div className="mt-4 border-4 border-indigo-600 bg-indigo-800 p-4 sm:mt-6">
                    <div className="mb-4 border-2 border-indigo-500 bg-indigo-900 p-3">
                      <p className="mb-2 text-xs font-black tracking-wider text-indigo-300">
                        評価モード
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => setEvaluatorMode("keyword")}
                          className={`min-h-[44px] flex-1 border-2 px-3 py-2 text-sm font-bold ${
                            evaluatorMode === "keyword"
                              ? "border-yellow-400 bg-yellow-400 text-indigo-900"
                              : "border-indigo-600 bg-indigo-800 text-indigo-300 hover:border-indigo-400"
                          }`}
                        >
                          キーワード判定（オフライン）
                        </button>
                        <button
                          type="button"
                          onClick={() => llmAvailable && setEvaluatorMode("llm")}
                          disabled={!llmAvailable}
                          className={`min-h-[44px] flex-1 border-2 px-3 py-2 text-sm font-bold ${
                            evaluatorMode === "llm"
                              ? "border-emerald-400 bg-emerald-500 text-white"
                              : llmAvailable
                                ? "border-indigo-600 bg-indigo-800 text-indigo-300 hover:border-indigo-400"
                                : "cursor-not-allowed border-indigo-700 bg-indigo-950 text-indigo-600"
                          }`}
                        >
                          AI判定（OpenAI）
                        </button>
                      </div>
                      {!llmAvailable && (
                        <p className="mt-2 text-xs text-indigo-400">
                          AI判定を使うには .env.local に OPENAI_API_KEY を設定してください
                        </p>
                      )}
                      {evaluatorMode === "llm" && llmAvailable && (
                        <p className="mt-2 text-xs text-emerald-400">
                          OpenAI API で文脈を理解した分析を行います
                        </p>
                      )}
                    </div>

                    <label
                      htmlFor="guidance-input"
                      className="mb-2 flex items-center gap-2 text-base font-black text-yellow-300"
                    >
                      <span className="border border-yellow-400 px-2 py-0.5 text-xs text-yellow-400">
                        INPUT
                      </span>
                      あなたの指導文
                    </label>
                    <textarea
                      id="guidance-input"
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        if (inputError) setInputError("");
                      }}
                      placeholder="例：今回の遅刻について、次回からは出発時間を15分早めに設定して、会議5分前には到着するようにしましょう。困ったら早めに連絡してください。"
                      rows={5}
                      className="w-full min-h-[120px] border-2 border-indigo-500 bg-white p-4 text-base text-gray-800 focus:border-yellow-400 focus:outline-none"
                    />
                    {inputError && (
                      <p className="mt-2 text-sm font-bold text-red-400">
                        {inputError}
                      </p>
                    )}
                    <p className="mt-1 text-right text-sm text-indigo-300">
                      {inputText.length} 文字
                    </p>

                    <button
                      type="button"
                      onClick={handleEvaluate}
                      className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[8px] bg-orange-500 px-6 py-3 text-base font-black text-white hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      指導する
                    </button>
                  </div>
                )}

                {phase === "evaluating" && (
                  <EvaluationOverlay
                    inputPreview={inputText.trim()}
                    isLlm={evaluatorMode === "llm"}
                  />
                )}
              </>
            )}

            {/* 評価結果 */}
            {!isGameEnded && phase === "result" && currentResult && (
              <div className="mt-4 space-y-4 sm:mt-6">
                <TanakaStatusPanel
                  status={tanakaStatus}
                  delta={lastTanakaDelta}
                />
                <ResultCard
                  result={currentResult}
                  evaluatorSource={lastEvaluatorSource}
                  usedLlmFallback={usedLlmFallback}
                  llmFallbackReason={llmFallbackReason}
                />
                <button
                  type="button"
                  onClick={handleNextStage}
                  disabled={!canProceed}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[8px] bg-emerald-500 px-6 py-3 text-base font-black text-white hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-wait disabled:opacity-50"
                >
                  {!canProceed ? (
                    "判定表示中..."
                  ) : (
                    <>
                      {stageNumber >= MAX_STAGES ? "結果を見る" : "次のステージへ"}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ゲームオーバー */}
            {phase === "gameover" && currentResult && finalResult && (
              <div className="space-y-6">
                <TanakaStatusPanel
                  status={tanakaStatus}
                  delta={lastTanakaDelta}
                />
                <ResultCard
                  result={currentResult}
                  evaluatorSource={lastEvaluatorSource}
                  usedLlmFallback={usedLlmFallback}
                  llmFallbackReason={llmFallbackReason}
                />
                <FinalScreen
                  finalResult={finalResult}
                  history={history}
                  isGameOver
                  gameOverReason={gameOverReason}
                  onRestart={handleRestart}
                />
              </div>
            )}

            {/* ゲームクリア / 通常終了 */}
            {phase === "finished" && finalResult && (
              <FinalScreen
                finalResult={finalResult}
                history={history}
                isGameOver={false}
                allCleared={clearedCount === MAX_STAGES}
                onRestart={handleRestart}
              />
            )}

            {/* 注意書き */}
            <footer className="mt-6 border-2 border-indigo-600 bg-indigo-800 p-4">
              <p className="text-left text-xs leading-relaxed text-indigo-300 sm:text-sm">
                このゲームのスコアは教育目的の簡易判定であり、実際の法的判断ではありません。現実のハラスメント判断は、発言内容、関係性、文脈、継続性などを総合的に考慮する必要があります。
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
