"use client";

import AppNav from "@/components/AppNav";
import {
  formatPlayDate,
  getEndingDisplayList,
  getProgressSummary,
  getScenarioKey,
  getStageUnlockLabel,
  isScenarioUnlocked,
  isStageUnlocked,
  loadGameProgress,
  TIER_LABELS,
  type GameProgress,
} from "@/lib/game-progress";
import { listAllScenarios } from "@/lib/stage-templates";
import { getStatusLabel } from "@/lib/evaluator";
import { MAX_STAGES } from "@/types/game";
import Link from "next/link";
import { useEffect, useState } from "react";

function StatBox({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border-2 p-3 text-center sm:p-4 ${
        highlight
          ? "border-orange-500 bg-orange-900"
          : "border-indigo-500 bg-indigo-800"
      }`}
    >
      <p className="text-xs font-bold text-indigo-300">{label}</p>
      <p className="mt-1 text-xl font-black text-white sm:text-2xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-indigo-300">{sub}</p>}
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="mx-auto h-8 w-8 text-indigo-400"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function AchievementsPage() {
  const [progress, setProgress] = useState<GameProgress | null>(null);

  useEffect(() => {
    setProgress(loadGameProgress());
  }, []);

  const allScenarios = listAllScenarios();
  const summary = progress ? getProgressSummary(progress) : null;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-indigo-950">
      <div
        className="pointer-events-none fixed inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #6366f1 2px, #6366f1 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, #6366f1 2px, #6366f1 4px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-3xl px-3 py-4 sm:px-4 sm:py-8">
        <div className="border-4 border-indigo-400 bg-indigo-900 p-1 sm:p-2">
          <div className="border-2 border-indigo-600 bg-gradient-to-b from-indigo-800 to-indigo-950 p-4 sm:p-6">
            <header className="mb-4 text-center">
              <p className="mb-1 text-xs font-black tracking-[0.3em] text-yellow-400">
                ACHIEVEMENTS
              </p>
              <h1 className="text-xl font-black text-white sm:text-2xl md:text-3xl">
                実績・解放状況
              </h1>
              <p className="mt-2 text-sm text-indigo-200">
                プレイ記録はこのブラウザに保存されます
              </p>
            </header>

            <div className="mb-4 flex justify-center">
              <AppNav current="achievements" />
            </div>

            {!progress ? (
              <p className="py-12 text-center text-indigo-200">読み込み中...</p>
            ) : progress.stats.totalPlays === 0 &&
              Object.keys(progress.scenarios).length === 0 ? (
              <section className="border-2 border-indigo-400 bg-indigo-800 p-6 text-center">
                <LockIcon />
                <p className="mt-4 text-base text-indigo-100">
                  まだプレイ記録がありません。
                </p>
                <p className="mt-2 text-sm text-indigo-300">
                  ゲームを1回プレイすると、ステージやシナリオの解放状況がここに表示されます。
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-[8px] bg-orange-500 px-6 py-3 text-base font-black text-white hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
                >
                  ゲームを始める
                </Link>
              </section>
            ) : (
              <div className="space-y-6">
                {/* サマリー */}
                <section>
                  <h2 className="mb-3 text-sm font-black tracking-wider text-yellow-300">
                    プレイ統計
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatBox
                      label="プレイ回数"
                      value={`${progress.stats.totalPlays}`}
                    />
                    <StatBox
                      label="5ステージ完走"
                      value={`${progress.stats.totalFullClears}`}
                      highlight
                    />
                    <StatBox
                      label="最高ランク"
                      value={progress.stats.bestRank ?? "—"}
                    />
                    <StatBox
                      label="最低ハラスメント平均"
                      value={
                        progress.stats.lowestAvgHarassment !== null
                          ? `${progress.stats.lowestAvgHarassment}点`
                          : "—"
                      }
                    />
                  </div>
                </section>

                {/* ステージ解放 */}
                <section className="border-2 border-indigo-400 bg-indigo-800 p-4">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <h2 className="text-sm font-black tracking-wider text-yellow-300">
                      ステージ解放
                    </h2>
                    <p className="text-xs text-indigo-300">
                      {summary?.unlockedStageCount}/{summary?.totalStages} 解放
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                    {Array.from({ length: MAX_STAGES }, (_, i) => i + 1).map(
                      (stageNum) => {
                        const unlocked = isStageUnlocked(progress, stageNum);
                        const cleared = Boolean(progress.stagesCleared[stageNum]);
                        const reached = progress.maxStageReached >= stageNum;

                        return (
                          <div
                            key={stageNum}
                            className={`border-2 p-3 text-center ${
                              unlocked
                                ? cleared
                                  ? "border-emerald-500 bg-emerald-900/40"
                                  : "border-indigo-400 bg-indigo-900"
                                : "border-indigo-700 bg-indigo-950"
                            }`}
                          >
                            <p className="text-xs font-bold text-indigo-300">
                              STAGE {stageNum}
                            </p>
                            {unlocked ? (
                              <>
                                <p className="mt-1 text-sm font-black text-white">
                                  {getStageUnlockLabel(stageNum)}
                                </p>
                                <p className="mt-2 text-xs font-bold">
                                  {cleared ? (
                                    <span className="text-emerald-300">
                                      クリア済み
                                    </span>
                                  ) : reached ? (
                                    <span className="text-yellow-300">
                                      到達済み
                                    </span>
                                  ) : (
                                    <span className="text-indigo-300">解放</span>
                                  )}
                                </p>
                              </>
                            ) : (
                              <>
                                <LockIcon />
                                <p className="mt-1 text-xs text-indigo-400">
                                  未解放
                                </p>
                              </>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                  <p className="mt-3 text-left text-xs leading-relaxed text-indigo-300">
                    前のステージに到達すると次のステージが解放されます。ステージ1は常にプレイ可能です。
                  </p>
                </section>

                {/* シナリオ図鑑 */}
                <section className="border-2 border-indigo-400 bg-indigo-800 p-4">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <h2 className="text-sm font-black tracking-wider text-yellow-300">
                      シナリオ図鑑
                    </h2>
                    <p className="text-xs text-indigo-300">
                      {summary?.unlockedScenarioCount}/{summary?.totalScenarios}{" "}
                      遭遇
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {allScenarios.map((scenario) => {
                      const key = getScenarioKey(
                        scenario.stageNumber,
                        scenario.tier
                      );
                      const record = progress.scenarios[key];
                      const unlocked = isScenarioUnlocked(
                        progress,
                        scenario.stageNumber,
                        scenario.tier
                      );

                      return (
                        <div
                          key={key}
                          className={`flex flex-col border-2 p-3 ${
                            unlocked
                              ? record?.clearedOnce
                                ? "border-emerald-500 bg-emerald-900/30"
                                : "border-indigo-400 bg-indigo-900"
                              : "border-indigo-700 bg-indigo-950"
                          }`}
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="border border-indigo-500 px-2 py-0.5 text-xs font-bold text-indigo-200">
                              S{scenario.stageNumber}
                            </span>
                            <span className="border border-indigo-500 px-2 py-0.5 text-xs font-bold text-indigo-200">
                              {TIER_LABELS[scenario.tier]}
                            </span>
                            {record?.clearedOnce && (
                              <span className="border border-emerald-500 bg-emerald-700 px-2 py-0.5 text-xs font-bold text-white">
                                CLEAR
                              </span>
                            )}
                          </div>

                          {unlocked && record ? (
                            <>
                              <p className="text-base font-black text-white">
                                {record.title}
                              </p>
                              <p className="mt-2 flex-1 text-left text-xs leading-relaxed text-indigo-200">
                                {scenario.mistake}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-indigo-300">
                                <span>遭遇 {record.timesEncountered}回</span>
                                {record.bestStatus && (
                                  <span>
                                    最高判定: {getStatusLabel(record.bestStatus)}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-1 flex-col items-center justify-center py-4">
                              <LockIcon />
                              <p className="mt-2 text-sm font-bold text-indigo-400">
                                未遭遇
                              </p>
                              <p className="mt-1 text-xs text-indigo-500">
                                プレイ中に遭遇すると解放されます
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* エンディング */}
                <section className="border-2 border-indigo-400 bg-indigo-800 p-4">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <h2 className="text-sm font-black tracking-wider text-yellow-300">
                      エンディングコレクション
                    </h2>
                    <p className="text-xs text-indigo-300">
                      {summary?.endingsUnlocked}/{summary?.totalEndings} 解放
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {getEndingDisplayList().map((ending) => {
                      const unlocked = progress.endingsSeen.includes(ending.id);

                      return (
                        <div
                          key={ending.id}
                          className={`border-2 p-4 ${
                            unlocked
                              ? "border-orange-500 bg-orange-900/30"
                              : "border-indigo-700 bg-indigo-950"
                          }`}
                        >
                          {unlocked ? (
                            <>
                              <p className="text-base font-black text-white">
                                {ending.title}
                              </p>
                              <p className="mt-2 text-left text-sm leading-relaxed text-indigo-100">
                                {ending.description}
                              </p>
                            </>
                          ) : (
                            <div className="text-center">
                              <LockIcon />
                              <p className="mt-2 text-sm font-bold text-indigo-400">
                                ？？？
                              </p>
                              <p className="mt-1 text-xs text-indigo-500">
                                5ステージ完走で解放
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 最近のプレイ */}
                {progress.playHistory.length > 0 && (
                  <section className="border-2 border-indigo-400 bg-indigo-800 p-4">
                    <h2 className="mb-3 text-sm font-black tracking-wider text-yellow-300">
                      最近のプレイ
                    </h2>
                    <ul className="space-y-2">
                      {progress.playHistory.slice(0, 5).map((play, index) => (
                        <li
                          key={`${play.finishedAt}-${index}`}
                          className="border-2 border-indigo-600 bg-indigo-900 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-bold text-white">
                              {formatPlayDate(play.finishedAt)}
                            </p>
                            {play.rank && (
                              <span className="border border-yellow-400 bg-yellow-400 px-2 py-0.5 text-xs font-black text-indigo-900">
                                ランク {play.rank}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-indigo-300">
                            クリア {play.clearedCount}/{MAX_STAGES} ステージ
                            {play.ending && ` · ${getEndingDisplayList().find((e) => e.id === play.ending)?.title}`}
                            {play.gameOverReason === "harassment" &&
                              " · 労基ゲームオーバー"}
                            {play.gameOverReason === "mental_breakdown" &&
                              " · メンタル崩壊"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <Link
                  href="/"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[8px] bg-orange-500 px-6 py-3 text-base font-black text-white hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
                >
                  ゲームに戻る
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
