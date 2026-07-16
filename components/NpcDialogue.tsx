import Image from "next/image";
import type { NpcMood } from "@/lib/npc-reaction";

export type { NpcMood };

const PORTRAIT = {
  default: "/images/subordinate.png",
  chaos: "/images/subordinate-chaos.png",
} as const;

type NpcDialogueProps = {
  message: string;
  mood?: NpcMood;
  /** 吹き出しのラベル（省略時は「部下」） */
  speakerLabel?: string;
  /** T4カオスモード：泣き崩れ立ち絵を使用 */
  chaosMode?: boolean;
};

const MOOD_STYLES: Record<
  NpcMood,
  { bubble: string; label: string; tail: string; imageFilter: string }
> = {
  normal: {
    bubble: "border-indigo-300 bg-white",
    label: "bg-indigo-600",
    tail: "border-r-indigo-300",
    imageFilter: "",
  },
  worried: {
    bubble: "border-amber-400 bg-amber-50",
    label: "bg-amber-600",
    tail: "border-r-amber-400",
    imageFilter: "",
  },
  happy: {
    bubble: "border-emerald-400 bg-emerald-50",
    label: "bg-emerald-600",
    tail: "border-r-emerald-400",
    imageFilter: "brightness-105",
  },
  shocked: {
    bubble: "border-red-400 bg-red-50",
    label: "bg-red-600",
    tail: "border-r-red-400",
    imageFilter: "brightness-95 saturate-90",
  },
  crying: {
    bubble: "border-red-500 bg-red-50",
    label: "bg-red-700",
    tail: "border-r-red-500",
    imageFilter: "brightness-90 saturate-75",
  },
};

function TearOverlay() {
  return (
    <>
      <span
        className="pointer-events-none absolute left-[18%] top-[38%] h-3 w-1.5 rounded-full bg-sky-300/90 sm:h-4 sm:w-2"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute right-[22%] top-[40%] h-4 w-1.5 rounded-full bg-sky-300/90 sm:h-5 sm:w-2"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute left-[24%] top-[48%] h-2 w-1 rounded-full bg-sky-200/80 sm:top-[50%]"
        aria-hidden="true"
      />
    </>
  );
}

export default function NpcDialogue({
  message,
  mood = "normal",
  speakerLabel = "部下・田中",
  chaosMode = false,
}: NpcDialogueProps) {
  const styles = MOOD_STYLES[mood];
  const isCrying = mood === "crying";
  const portraitSrc = chaosMode ? PORTRAIT.chaos : PORTRAIT.default;
  const showTearOverlay = isCrying && !chaosMode;

  return (
    <div className="flex w-full flex-row items-end gap-2 sm:gap-4">
      {/* キャラクター */}
      <div className="relative shrink-0">
        <div
          className={`overflow-hidden border-4 ${
            chaosMode
              ? "border-orange-600 bg-orange-100"
              : "border-indigo-700 bg-indigo-100"
          }`}
        >
          <Image
            src={portraitSrc}
            alt={
              chaosMode
                ? "部下・田中（カオスモード・泣き崩れ）"
                : "部下キャラクター"
            }
            width={chaosMode ? 512 : 160}
            height={chaosMode ? 431 : 200}
            className={`h-[100px] w-[80px] sm:h-[180px] sm:w-[144px] ${
              chaosMode
                ? "object-cover object-[center_20%]"
                : `object-cover object-top ${styles.imageFilter}`
            }`}
            priority
          />
          {showTearOverlay && <TearOverlay />}
        </div>
        <span
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap border-2 px-2 py-0.5 text-xs font-bold text-white ${
            chaosMode
              ? "border-orange-800 bg-orange-700"
              : "border-indigo-800 bg-indigo-700"
          }`}
        >
          {speakerLabel}
        </span>
      </div>

      {/* 吹き出し */}
      <div className="relative min-w-0 flex-1">
        <div
          className={`absolute -left-2 bottom-4 h-0 w-0 border-y-[8px] border-r-[10px] border-y-transparent sm:bottom-6 sm:border-y-[10px] sm:border-r-[12px] ${styles.tail}`}
          aria-hidden="true"
        />

        <div className={`relative border-4 p-3 sm:p-5 ${styles.bubble}`}>
          <span
            className={`mb-1 inline-block px-2 py-0.5 text-xs font-bold text-white sm:mb-2 ${styles.label}`}
          >
            {speakerLabel}
          </span>
          <p
            className={`text-sm leading-relaxed sm:text-lg ${
              isCrying ? "font-bold text-red-900" : "text-gray-800"
            }`}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

/** @deprecated getNpcMoodFromResult を使用 */
export function getNpcMoodFromStatus(
  status: "clear" | "insufficient" | "labor_consultation"
): NpcMood {
  switch (status) {
    case "clear":
      return "happy";
    case "insufficient":
      return "worried";
    case "labor_consultation":
      return "crying";
  }
}

export { getNpcMoodFromResult } from "@/lib/npc-reaction";
