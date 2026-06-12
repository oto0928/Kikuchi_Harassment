"use client";

import { useCallback, useEffect, useState } from "react";
import EvaluationOverlay, {
  waitForEvaluation,
} from "@/components/EvaluationOverlay";
import GameHud from "@/components/GameHud";
import RoukiGameOverImage, {
  RoukiFullScreenFlash,
} from "@/components/RoukiGameOverImage";
import ResultCard from "@/components/ResultCard";
import StageCard from "@/components/StageCard";
import TanakaStatusPanel from "@/components/TanakaStatusPanel";
import { calculateBossRank, evaluateGuidance, getStatusLabel } from "@/lib/evaluator";
import { generateStage } from "@/lib/stage-generator";
import {
  INITIAL_TANAKA_STATUS,
  applyTanakaDelta,
  calcTanakaDelta,
  checkGameOver,
  getGameOverMessage,
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

type GamePhase = "playing" | "evaluating" | "result" | "finished" | "gameover";

export default function GamePage() {
  const [stageNumber, setStageNumber] = useState(1);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [usedTemplateIds, setUsedTemplateIds] = useState<string[]>([]);
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
  const [lastEvaluatorSource, setLastEvaluatorSource] =
    useState<EvaluatorMode>("keyword");

  const clearedCount = history.filter((h) => h.result.status === "clear").length;

  /** ゲーム初期化・ステージ生成 */
  const initGame = useCallback(() => {
    const initialTanaka = { ...INITIAL_TANAKA_STATUS };
    const firstStage = generateStage(1, initialTanaka, []);
    setStageNumber(1);
    setCurrentStage(firstStage);
    setUsedTemplateIds([firstStage.templateId]);
    setTanakaStatus(initialTanaka);
    setLastTanakaDelta(null);
    setInputText("");
    setCurrentResult(null);
    setHistory([]);
    setPhase("playing");
    setFinalResult(null);
    setGameOverReason(null);
    setShowRoukiFlash(false);
    setInputError("");
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  /** AI評価APIの利用可否を確認 */
  useEffect(() => {
    fetch("/api/evaluate")
      .then((res) => res.json())
      .then((data: { available: boolean }) => {
        setLlmAvailable(data.available);
        if (data.available) {
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

  /** 結果アニメーション完了後に次へ進めるようにする */
  useEffect(() => {
    if (phase === "result" || phase === "gameover") {
      setCanProceed(false);
      const timer = setTimeout(() => setCanProceed(true), 3500);
      return () => clearTimeout(timer);
    }
    setCanProceed(false);
  }, [phase, currentResult]);

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
      inputText: trimmed,
      result,
      tanakaBefore,
      tanakaAfter,
      tanakaDelta: delta,
    };
    const allHistory = [...history, entry];
    setHistory(allHistory);

    const overReason = checkGameOver(result, tanakaAfter);
    if (overReason) {
      setGameOverReason(overReason);
      if (overReason === "harassment") {
        setShowRoukiFlash(true);
      }
      const avg =
        allHistory.reduce((sum, h) => sum + h.result.harassmentScore, 0) /
        allHistory.length;
      setFinalResult(
        calculateBossRank(
          allHistory.filter((h) => h.result.status === "clear").length,
          MAX_STAGES,
          avg,
          tanakaAfter
        )
      );
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
    setInputError("");
    setPhase("evaluating");

    try {
      const runEvaluation = async (): Promise<{
        result: EvaluationResult;
        source: EvaluatorMode;
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
            error?: string;
          };

          if (!res.ok || !data.result) {
            throw new Error(data.error ?? "AI評価に失敗しました。");
          }

          return { result: data.result, source: "llm" };
        }

        return { result: evaluateGuidance(trimmed), source: "keyword" };
      };

      const { result, source } = await waitForEvaluation(runEvaluation());
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
      finishGame();
      return;
    }

    const nextNumber = stageNumber + 1;
    const nextStage = generateStage(nextNumber, tanakaStatus, usedTemplateIds);

    setStageNumber(nextNumber);
    setCurrentStage(nextStage);
    setUsedTemplateIds((prev) => [...prev, nextStage.templateId]);
    setInputText("");
    setCurrentResult(null);
    setLastTanakaDelta(null);
    setPhase("playing");
    setInputError("");
  }

  /** ゲーム終了処理 */
  function finishGame() {
    const avg =
      history.length > 0
        ? history.reduce((sum, h) => sum + h.result.harassmentScore, 0) / history.length
        : 0;
    setFinalResult(
      calculateBossRank(clearedCount, MAX_STAGES, avg, tanakaStatus)
    );
    setPhase("finished");
  }

  /** ゲームをリセット */
  function handleRestart() {
    initGame();
  }

  const isGameEnded = phase === "finished" || phase === "gameover";

  if (!currentStage) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-indigo-950 text-white">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-indigo-950">
      <RoukiFullScreenFlash show={showRoukiFlash} />

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
                    <li>・田中の精神衛生度が0 → メンタル崩壊ゲームオーバー</li>
                    <li>
                      ・具体性または改善提案が30点未満 → 指導不足（ステージ失敗）
                    </li>
                    <li>・田中の状態に応じて、毎回異なるミスが発生します</li>
                    <li>・全7ステージクリアでゲームクリア！</li>
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

// ---------------------------------------------------------------------------
// 最終結果画面
// ---------------------------------------------------------------------------

type FinalScreenProps = {
  finalResult: FinalResult;
  history: StageHistory[];
  isGameOver: boolean;
  allCleared?: boolean;
  gameOverReason?: GameOverReason;
  onRestart: () => void;
};

function FinalScreen({
  finalResult,
  history,
  isGameOver,
  allCleared,
  gameOverReason,
  onRestart,
}: FinalScreenProps) {
  const rankColors: Record<string, string> = {
    S: "text-yellow-600 bg-yellow-50 border-yellow-300",
    A: "text-indigo-600 bg-indigo-50 border-indigo-300",
    B: "text-emerald-600 bg-emerald-50 border-emerald-300",
    C: "text-orange-600 bg-orange-50 border-orange-300",
    D: "text-red-600 bg-red-50 border-red-300",
  };

  const rankStyle = rankColors[finalResult.rank] ?? rankColors.D;

  return (
    <div className="space-y-6">
      {/* 労基ゲームオーバー（ハラスメント） */}
      {isGameOver && gameOverReason === "harassment" && (
        <RoukiGameOverImage variant="full" />
      )}

      {/* タイトル */}
      <div
        className={`border-4 p-6 text-center ${
          isGameOver
            ? "border-red-500 bg-red-900"
            : allCleared
              ? "border-emerald-500 bg-emerald-900"
              : "border-indigo-500 bg-indigo-800"
        }`}
      >
        <p className="mb-1 text-xs font-black tracking-[0.3em] text-yellow-400">
          {isGameOver ? "GAME OVER" : allCleared ? "ALL CLEAR" : "END"}
        </p>
        <h2
          className={`text-2xl font-black sm:text-3xl ${
            isGameOver
              ? "text-red-300"
              : allCleared
                ? "text-emerald-300"
                : "text-white"
          }`}
        >
          {isGameOver
            ? "ゲームオーバー"
            : allCleared
              ? "ゲームクリア！"
              : "ゲーム終了"}
        </h2>
        <p className="mt-2 text-base text-indigo-200">
          {isGameOver
            ? getGameOverMessage(gameOverReason ?? "harassment")
            : allCleared
              ? "全ステージをクリアしました！田中も成長しました。"
              : "お疲れさまでした。結果を確認しましょう。"}
        </p>
      </div>

      {/* 田中の最終ステータス */}
      <TanakaStatusPanel status={finalResult.finalTanakaStatus} compact />

      {/* 総合スコア */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatBox
          label="平均ハラスメント度"
          value={`${finalResult.averageHarassment}点`}
          highlight={finalResult.averageHarassment >= 40}
        />
        <StatBox
          label="クリアステージ"
          value={`${finalResult.clearedCount} / ${finalResult.totalStages}`}
        />
        <div
          className={`col-span-2 border p-4 text-center sm:col-span-1 ${rankStyle}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            上司ランク
          </p>
          <p className="text-4xl font-black">{finalResult.rank}</p>
          <p className="text-sm font-medium">{finalResult.rankLabel}</p>
        </div>
      </div>

      {/* ステージ履歴 */}
      <div className="border-2 border-indigo-500 bg-indigo-800 p-4 sm:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-yellow-300">
          <span className="border border-yellow-400 px-2 py-0.5 text-xs">LOG</span>
          ステージ履歴
        </h3>
        <div className="space-y-3">
          {history.map((entry, index) => (
            <div
              key={`${entry.stageId}-${index}`}
              className="border-2 border-indigo-600 bg-indigo-900 p-3 sm:p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-indigo-200">
                  ステージ{entry.stageId}：{entry.stageTitle}
                </span>
                <span
                  className={`rounded-sm px-2 py-0.5 text-xs font-bold text-white ${
                    entry.result.status === "clear"
                      ? "bg-emerald-600"
                      : entry.result.status === "insufficient"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                  }`}
                >
                  {getStatusLabel(entry.result.status)}
                </span>
              </div>
              <p className="mb-2 text-sm text-indigo-300">
                入力：「{entry.inputText}」
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-indigo-400">
                <span>ハラスメント {entry.result.harassmentScore}点</span>
                <span>具体性 {entry.result.specificityScore}点</span>
                <span>改善提案 {entry.result.improvementScore}点</span>
                <span>納得度 {entry.result.satisfactionScore}点</span>
                <span>
                  精神衛生 {entry.tanakaAfter.mentalHealth}
                  ({entry.tanakaDelta.mentalHealth >= 0 ? "+" : ""}
                  {entry.tanakaDelta.mentalHealth})
                </span>
                <span>
                  意識 {entry.tanakaAfter.awarenessLevel}
                  ({entry.tanakaDelta.awarenessLevel >= 0 ? "+" : ""}
                  {entry.tanakaDelta.awarenessLevel})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* もう一度遊ぶ */}
      <button
        type="button"
        onClick={onRestart}
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[8px] bg-orange-500 px-6 py-3 text-base font-black text-white hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
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
            d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466A5.5 5.5 0 1116 9.75M12.75 9.75V4.5"
            clipRule="evenodd"
          />
        </svg>
        もう一度遊ぶ
      </button>
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border-2 p-4 text-center ${
        highlight
          ? "border-orange-500 bg-orange-900"
          : "border-indigo-500 bg-indigo-800"
      }`}
    >
      <p className="text-xs font-bold text-indigo-300">{label}</p>
      <p
        className={`mt-1 text-xl font-black ${highlight ? "text-orange-300" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
