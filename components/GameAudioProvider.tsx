"use client";

import {
  endingToBgm,
  endingToSe,
  gameAudio,
  type BgmId,
  type SeId,
} from "@/lib/audio/game-audio";
import type { GameEnding } from "@/types/game";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type GameAudioContextValue = {
  muted: boolean;
  unlocked: boolean;
  unlock: () => Promise<void>;
  toggleMute: () => void;
  playSe: (id: SeId) => void;
  startBgm: (id: BgmId) => void;
  stopBgm: () => void;
  playEndingAudio: (ending: GameEnding) => void;
};

const GameAudioContext = createContext<GameAudioContextValue | null>(null);

export function GameAudioProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(() =>
    typeof window !== "undefined" ? gameAudio.isMuted() : true
  );
  const [unlocked, setUnlocked] = useState(() =>
    typeof window !== "undefined" ? gameAudio.isUnlocked() : false
  );

  const unlock = useCallback(async () => {
    await gameAudio.unlock();
    setUnlocked(true);
    setMuted(gameAudio.isMuted());
    gameAudio.syncBgmIfPending();
  }, []);

  useEffect(() => {
    setMuted(gameAudio.isMuted());
    setUnlocked(gameAudio.isUnlocked());
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced && !localStorage.getItem("kikuchi-game-audio-muted")) {
      gameAudio.setMuted(true);
      setMuted(true);
    }
  }, []);

  /** ブラウザの自動再生制限: 最初の操作で AudioContext を解放 */
  useEffect(() => {
    if (unlocked) return;

    const onFirstInteraction = () => {
      void unlock();
    };

    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, [unlocked, unlock]);

  const toggleMute = useCallback(() => {
    const nextMuted = !muted;

    if (!unlocked) {
      void unlock().then(() => {
        gameAudio.setMuted(nextMuted);
        setMuted(nextMuted);
        if (!nextMuted) {
          gameAudio.syncBgmIfPending();
        } else {
          gameAudio.stopBgm();
        }
      });
      return;
    }

    gameAudio.setMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) {
      gameAudio.syncBgmIfPending();
    } else {
      gameAudio.stopBgm();
    }
  }, [unlock, unlocked, muted]);

  const playSe = useCallback((id: SeId) => {
    gameAudio.playSe(id);
  }, []);

  const startBgm = useCallback((id: BgmId) => {
    gameAudio.startBgm(id);
  }, []);

  const stopBgm = useCallback(() => {
    gameAudio.stopBgm();
  }, []);

  const playEndingAudio = useCallback(
    (ending: GameEnding) => {
      gameAudio.playSe(endingToSe(ending));
      gameAudio.startBgm(endingToBgm(ending));
    },
    []
  );

  const value = useMemo(
    () => ({
      muted,
      unlocked,
      unlock,
      toggleMute,
      playSe,
      startBgm,
      stopBgm,
      playEndingAudio,
    }),
    [muted, unlocked, unlock, toggleMute, playSe, startBgm, stopBgm, playEndingAudio]
  );

  return (
    <GameAudioContext.Provider value={value}>{children}</GameAudioContext.Provider>
  );
}

export function useGameAudio(): GameAudioContextValue {
  const ctx = useContext(GameAudioContext);
  if (!ctx) {
    throw new Error("useGameAudio must be used within GameAudioProvider");
  }
  return ctx;
}

/** Provider外でもクリック音だけ鳴らす（実績ページ等） */
export function useOptionalGameAudio(): GameAudioContextValue | null {
  return useContext(GameAudioContext);
}
