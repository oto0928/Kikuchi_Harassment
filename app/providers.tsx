"use client";

import { GameAudioProvider } from "@/components/GameAudioProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <GameAudioProvider>{children}</GameAudioProvider>;
}
