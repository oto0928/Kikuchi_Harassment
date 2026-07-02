"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GUIDANCE_CHOICE_CATEGORIES,
  buildGuidanceFromChoices,
  type GuidanceChoiceOption,
  type GuidanceChoiceSelection,
} from "@/lib/guidance-choices";

type Props = {
  /** 組み立てた指導文が変わるたびに呼ばれる */
  onTextChange: (text: string) => void;
  /** パーツ選択時のSE */
  onSelectSound?: () => void;
};

const CHOICE_LETTERS = ["A", "B", "C", "D", "E"];

/** 配列をシャッフルした新しい配列を返す（Fisher-Yates） */
function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function GuidanceChoiceComposer({
  onTextChange,
  onSelectSound,
}: Props) {
  const [selection, setSelection] = useState<GuidanceChoiceSelection>({});

  // 良し悪しが位置で分からないよう、カテゴリごとに選択肢の順番をシャッフル（初回のみ）
  const shuffledCategories = useMemo(
    () =>
      GUIDANCE_CHOICE_CATEGORIES.map((category) => ({
        ...category,
        options: shuffle(category.options),
      })),
    []
  );

  const assembled = buildGuidanceFromChoices(selection);

  useEffect(() => {
    onTextChange(assembled);
  }, [assembled, onTextChange]);

  function handleSelect(categoryId: string, option: GuidanceChoiceOption) {
    onSelectSound?.();
    setSelection((prev) => ({
      ...prev,
      // 同じものを再クリックで解除できる
      [categoryId]: prev[categoryId] === option.id ? null : option.id,
    }));
  }

  return (
    <div className="space-y-4">
      <p className="text-left text-sm leading-relaxed text-indigo-200">
        パーツを選ぶだけで指導文が組み立てられます。各項目から1つずつ選ぶのがおすすめです（もう一度押すと選択を解除できます）。
      </p>

      {shuffledCategories.map((category) => (
        <div
          key={category.id}
          className="border-2 border-indigo-500 bg-indigo-900 p-3"
        >
          <p className="text-sm font-black text-yellow-300">{category.title}</p>
          <p className="mt-0.5 mb-2 text-xs text-indigo-300">{category.hint}</p>
          <div className="flex flex-col gap-2">
            {category.options.map((option, index) => {
              const isActive = selection[category.id] === option.id;
              const letter = CHOICE_LETTERS[index] ?? "?";
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(category.id, option)}
                  aria-pressed={isActive}
                  className={`min-h-[44px] w-full border-2 px-3 py-2 text-left text-sm font-bold ${
                    isActive
                      ? "border-yellow-400 bg-yellow-400 text-indigo-900"
                      : "border-indigo-600 bg-indigo-800 text-indigo-100 hover:border-indigo-400"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center border text-xs font-black ${
                        isActive
                          ? "border-indigo-900 text-indigo-900"
                          : "border-indigo-400 text-indigo-300"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="leading-relaxed">「{option.text}」</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="border-2 border-indigo-500 bg-indigo-950 p-3">
        <p className="mb-1 text-xs font-black tracking-wider text-indigo-300">
          組み立てた指導文プレビュー
        </p>
        {assembled ? (
          <p className="text-left text-base leading-relaxed text-white">
            {assembled}
          </p>
        ) : (
          <p className="text-left text-sm text-indigo-400">
            まだ選ばれていません。上のパーツを選んでください。
          </p>
        )}
      </div>
    </div>
  );
}
