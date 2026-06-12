import Image from "next/image";

type NpcMood = "normal" | "worried" | "happy" | "shocked";

type NpcDialogueProps = {
  message: string;
  mood?: NpcMood;
  /** 吹き出しのラベル（省略時は「部下」） */
  speakerLabel?: string;
};

const MOOD_STYLES: Record<
  NpcMood,
  { bubble: string; label: string; tail: string; imageFilter: string }
> = {
  normal: {
    bubble: "border-indigo-300 bg-white",
    label: "bg-indigo-600",
    tail: "border-t-indigo-300 sm:border-r-indigo-300",
    imageFilter: "",
  },
  worried: {
    bubble: "border-amber-400 bg-amber-50",
    label: "bg-amber-600",
    tail: "border-t-amber-400 sm:border-r-amber-400",
    imageFilter: "",
  },
  happy: {
    bubble: "border-emerald-400 bg-emerald-50",
    label: "bg-emerald-600",
    tail: "border-t-emerald-400 sm:border-r-emerald-400",
    imageFilter: "",
  },
  shocked: {
    bubble: "border-red-400 bg-red-50",
    label: "bg-red-600",
    tail: "border-t-red-400 sm:border-r-red-400",
    imageFilter: "brightness-95",
  },
};

export default function NpcDialogue({
  message,
  mood = "normal",
  speakerLabel = "部下・田中",
}: NpcDialogueProps) {
  const styles = MOOD_STYLES[mood];

  return (
    <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-4">
      {/* キャラクター */}
      <div className="relative shrink-0 sm:order-1">
        <div className="overflow-hidden border-4 border-indigo-700 bg-indigo-100">
          <Image
            src="/images/subordinate.png"
            alt="部下キャラクター"
            width={160}
            height={200}
            className={`h-[140px] w-[112px] object-cover object-top sm:h-[180px] sm:w-[144px] ${styles.imageFilter}`}
            priority
          />
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap border-2 border-indigo-800 bg-indigo-700 px-2 py-0.5 text-xs font-bold text-white">
          {speakerLabel}
        </span>
      </div>

      {/* 吹き出し */}
      <div className="relative flex-1 sm:order-2">
        {/* モバイル：下向きしっぽ */}
        <div
          className={`absolute -bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent sm:hidden ${styles.tail.split(" ")[0]}`}
          aria-hidden="true"
        />
        {/* デスクトップ：左向きしっぽ */}
        <div
          className={`absolute -left-2 bottom-6 hidden h-0 w-0 border-y-[10px] border-r-[12px] border-y-transparent sm:block ${styles.tail.split(" ")[1]}`}
          aria-hidden="true"
        />

        <div
          className={`relative border-4 p-4 sm:p-5 ${styles.bubble}`}
        >
          <span
            className={`mb-2 inline-block px-2 py-0.5 text-xs font-bold text-white ${styles.label}`}
          >
            {speakerLabel}
          </span>
          <p className="text-base leading-relaxed text-gray-800 sm:text-lg">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 評価結果のステータスから部下のムードを決定 */
export function getNpcMoodFromStatus(
  status: "clear" | "insufficient" | "labor_consultation"
): NpcMood {
  switch (status) {
    case "clear":
      return "happy";
    case "insufficient":
      return "worried";
    case "labor_consultation":
      return "shocked";
  }
}
