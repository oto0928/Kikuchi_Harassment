"use client";

import { useOptionalGameAudio } from "@/components/GameAudioProvider";
import { HEADER_ACTION_BUTTON_CLASS } from "@/components/header-button-classes";
import { gameAudio } from "@/lib/audio/game-audio";

type AudioControlButtonProps = {
  className?: string;
};

export default function AudioControlButton({
  className = "",
}: AudioControlButtonProps) {
  const audio = useOptionalGameAudio();
  const muted = audio?.muted ?? gameAudio.isMuted();

  return (
    <button
      type="button"
      onClick={() => {
        if (audio) {
          audio.toggleMute();
        } else {
          void gameAudio.unlock().then(() => {
            const nextMuted = gameAudio.isMuted();
            if (nextMuted) {
              gameAudio.setMuted(false);
            }
            gameAudio.syncBgmIfPending();
          });
        }
      }}
      className={`${HEADER_ACTION_BUTTON_CLASS} ${
        muted
          ? "border-indigo-600 bg-indigo-900 text-indigo-300 hover:border-indigo-400"
          : "border-emerald-400 bg-emerald-700 text-white hover:bg-emerald-600"
      } ${className}`}
      aria-label={muted ? "音声をオンにする" : "音声をオフにする"}
      aria-pressed={!muted}
    >
      {muted ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5 shrink-0"
          aria-hidden="true"
        >
          <path d="M10.047 3.062a.75.75 0 011.047.648v12.58a.75.75 0 01-1.265.53L5.22 13H2.75A1.75 1.75 0 011 11.25V8.75c0-.966.784-1.75 1.75-1.75h2.47l4.829-4.588a.75.75 0 011.498.6zM15.22 6.22a.75.75 0 111.06 1.06L13.31 8.19l2.97 2.97a.75.75 0 11-1.06 1.06l-2.97-2.97-2.97 2.97a.75.75 0 11-1.06-1.06l2.97-2.97-2.97-2.97a.75.75 0 111.06-1.06l2.97 2.97 2.97-2.97z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5 shrink-0"
          aria-hidden="true"
        >
          <path d="M10.047 3.062a.75.75 0 011.047.648v12.58a.75.75 0 01-1.265.53L5.22 13H2.75A1.75 1.75 0 011 11.25V8.75c0-.966.784-1.75 1.75-1.75h2.47l4.829-4.588a.75.75 0 011.498.6zM14.22 7.22a.75.75 0 011.06 0 4.25 4.25 0 010 6.01l-1.06-1.06a3 3 0 000-3.88l1.06-1.07zm-2.12 2.12a.75.75 0 010 1.06l-1.06 1.06a1.75 1.75 0 010-2.47l1.06 1.06z" />
        </svg>
      )}
      <span className="whitespace-nowrap">{muted ? "音声OFF" : "音声ON"}</span>
    </button>
  );
}
