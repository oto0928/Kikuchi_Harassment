"use client";

import { useEffect, useState } from "react";
import {
  GUIDANCE_CHOICE_CATEGORIES,
  buildGuidanceFromChoices,
  type ChoiceTone,
  type GuidanceChoiceSelection,
} from "@/lib/guidance-choices";

type Props = {
  /** 組み立てた指導文が変わるたびに呼ばれる */
  onTextChange: (text: string) => void;
  /** パーツ選択時のSE */
  onSelectSound?: () => void;
};

const TONE_STYLE: Record<
  ChoiceTone,
  { active: string; idle: string; badge: string; badgeLabel: string }
> = {
  good: {
    active: "border-emerald-400 bg-emerald-500 text-white",
    idle: "border-emerald-700 bg-indigo-900 text-emerald-200 hover:border-emerald-400",
    badge: "border-emerald-400 text-emerald-300",
    badgeLabel: "良い例",
  },
  neutral: {
    active: "border-yellow-400 bg-yellow-400 text-indigo-900",
    idle: "border-indigo-600 bg-indigo-900 text-indigo-200 hover:border-indigo-400",
    badge: "border-indigo-400 text-indigo-300",
    badgeLabel: "ふつう",
  },
  bad: {
    active: "border-red-400 bg-red-500 text-white",
    idle: "border-red-800 bg-indigo-900 text-red-200 hover:border-red-500",
    badge: "border-red-400 text-red-300",
    badgeLabel: "NG例",
  },
};

export default function GuidanceChoiceComposer({
  onTextChange,
  onSelectSound,
}: Props) {
  const [selection, setSelection] = useState<GuidanceChoiceSelection>({});

  const assembled = buildGuidanceFromChoices(selection);

  useEffect(() => {
    onTextChange(assembled);
  }, [assembled, onTextChange]);

  function handleSelect(categoryId: string, optionId: string) {
    onSelectSound?.();
    setSelection((prev) => ({
      ...prev,
      // 同じものを再クリックで解除できる
      [categoryId]: prev[categoryId] === optionId ? null : optionId,
    }));
  }

  return (
    <div className="space-y-4">
      <p className="text-left text-sm leading-relaxed text-indigo-200">
        パーツを選ぶだけで指導文が組み立てられます。各項目から1つずつ選ぶのがおすすめです（もう一度押すと選択を解除できます）。
      </p>

      {GUIDANCE_CHOICE_CATEGORIES.map((category) => (
        <div
          key={category.id}
          className="border-2 border-indigo-500 bg-indigo-900 p-3"
        >
          <p className="text-sm font-black text-yellow-300">{category.title}</p>
          <p className="mt-0.5 mb-2 text-xs text-indigo-300">{category.hint}</p>
          <div className="flex flex-col gap-2">
            {category.options.map((option) => {
              const isActive = selection[category.id] === option.id;
              const style = TONE_STYLE[option.tone];
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(category.id, option.id)}
                  aria-pressed={isActive}
                  className={`min-h-[44px] w-full border-2 px-3 py-2 text-left text-sm font-bold ${
                    isActive ? style.active : style.idle
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`shrink-0 border px-1 py-0.5 text-[10px] font-black ${
                        isActive ? "border-white/70 text-white" : style.badge
                      }`}
                    >
                      {style.badgeLabel}
                    </span>
                    <span>{option.label}</span>
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
