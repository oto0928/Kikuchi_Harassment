import { MAX_STAGES } from "@/types/game";

/** 菊池先生のお手本指導文（ステージ番号 1〜5） */
const KIKUCHI_MODEL_GUIDANCE: Record<number, string> = {
  1: "田中くん。なんで遅刻したんですか。遅れる場合は先に「遅れる理由」「何分遅れるか」を連絡をしてくださいと伝えたはずです。なぜ、そのような基本的な連絡ができないのでしょうか。以後このようなことがないようにしてください。",
  2: "わかりました、今回はこちらで対処します。以後、気をつけてください",
  3: "私は事前にこのようなことがないように伝えしておいたはずです。また、遅れる場合には事前連絡するようにと再三注意したはずです。改善計画を書いて提出してください。",
  4: "はい、すぐ直しておいてください。",
  5: "はい、田中君の資料がない、ということで。もうからは僕コメントしません。",
};

export function getKikuchiModelGuidance(stageNumber: number): string | null {
  if (stageNumber < 1 || stageNumber > MAX_STAGES) return null;
  return KIKUCHI_MODEL_GUIDANCE[stageNumber] ?? null;
}

export function hasKikuchiModelGuidance(stageNumber: number): boolean {
  return getKikuchiModelGuidance(stageNumber) !== null;
}
