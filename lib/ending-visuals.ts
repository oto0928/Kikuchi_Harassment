import type { GameEnding } from "@/types/game";

export type EndingVisualConfig = {
  image?: string;
  imageAlt: string;
  useSubordinateFallback: boolean;
  subordinateFilter?: string;
  badgeLabel: string;
  headerLabel: string;
  accentText: string;
  borderClass: string;
  bgClass: string;
  badgeClass: string;
  titleClass: string;
  descClass: string;
  sweepClass: string;
  particleClass: string;
  captionClass: string;
};

export const ENDING_VISUALS: Record<GameEnding, EndingVisualConfig> = {
  model_boss: {
    image: "/images/ending-model-boss.png",
    imageAlt: "模範上司エンド - 千手観音のように働く田中",
    useSubordinateFallback: false,
    badgeLabel: "EXCELLENT",
    headerLabel: "ALL CLEAR",
    accentText: "text-yellow-300",
    borderClass: "border-yellow-400",
    bgClass: "bg-yellow-950",
    badgeClass: "border-yellow-400 bg-yellow-500 text-yellow-950",
    titleClass: "text-yellow-200",
    descClass: "text-yellow-100/90",
    sweepClass: "bg-yellow-400/35",
    particleClass: "bg-yellow-300",
    captionClass: "bg-yellow-900 border-yellow-500 text-yellow-100",
  },
  growth: {
    image: "/images/ending-growth.png",
    imageAlt: "成長エンド - 笑顔でサムズアップする田中",
    useSubordinateFallback: false,
    badgeLabel: "GROWTH",
    headerLabel: "ENDING",
    accentText: "text-emerald-300",
    borderClass: "border-emerald-400",
    bgClass: "bg-emerald-950",
    badgeClass: "border-emerald-400 bg-emerald-500 text-emerald-950",
    titleClass: "text-emerald-200",
    descClass: "text-emerald-100/90",
    sweepClass: "bg-emerald-400/25",
    particleClass: "bg-emerald-300",
    captionClass: "bg-emerald-900 border-emerald-500 text-emerald-100",
  },
  survivor: {
    image: undefined,
    imageAlt: "ギリギリサバイバーエンド",
    useSubordinateFallback: true,
    subordinateFilter: "brightness-90 saturate-75",
    badgeLabel: "SURVIVOR",
    headerLabel: "END",
    accentText: "text-amber-300",
    borderClass: "border-amber-500",
    bgClass: "bg-amber-950",
    badgeClass: "border-amber-500 bg-amber-600 text-amber-950",
    titleClass: "text-amber-200",
    descClass: "text-amber-100/80",
    sweepClass: "bg-amber-400/20",
    particleClass: "bg-amber-400",
    captionClass: "bg-amber-900 border-amber-600 text-amber-100",
  },
  neglect: {
    image: "/images/ending-neglect.png",
    imageAlt: "放置上司エンド - スマホを見る田中",
    useSubordinateFallback: false,
    badgeLabel: "NEGLECT",
    headerLabel: "END",
    accentText: "text-slate-300",
    borderClass: "border-slate-500",
    bgClass: "bg-slate-900",
    badgeClass: "border-slate-500 bg-slate-600 text-slate-100",
    titleClass: "text-slate-200",
    descClass: "text-slate-300/80",
    sweepClass: "bg-slate-400/15",
    particleClass: "bg-slate-400",
    captionClass: "bg-slate-800 border-slate-600 text-slate-200",
  },
  tanaka_chaos: {
    image: "/images/ending-tanaka-chaos.png",
    imageAlt: "田中伝説エンド - 爆発の前に立つ田中",
    useSubordinateFallback: false,
    badgeLabel: "LEGEND",
    headerLabel: "CHAOS END",
    accentText: "text-orange-300",
    borderClass: "border-orange-500",
    bgClass: "bg-orange-950",
    badgeClass: "border-orange-500 bg-orange-600 text-orange-950",
    titleClass: "text-orange-200",
    descClass: "text-orange-100/90",
    sweepClass: "bg-orange-500/40",
    particleClass: "bg-orange-400",
    captionClass: "bg-orange-900 border-orange-600 text-orange-100",
  },
};

export function getEndingVisual(ending: GameEnding): EndingVisualConfig {
  return ENDING_VISUALS[ending];
}
