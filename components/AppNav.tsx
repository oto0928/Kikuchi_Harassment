import AudioControlButton from "@/components/AudioControlButton";
import { HEADER_ACTION_BUTTON_CLASS } from "@/components/header-button-classes";
import Link from "next/link";

type AppNavProps = {
  current?: "game" | "achievements";
};

export default function AppNav({ current = "game" }: AppNavProps) {
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
      aria-label="メインナビゲーション"
    >
      <Link
        href="/"
        className={`${HEADER_ACTION_BUTTON_CLASS} ${
          current === "game"
            ? "border-yellow-400 bg-yellow-400 text-indigo-900"
            : "border-indigo-500 bg-indigo-800 text-indigo-100 hover:border-indigo-300"
        }`}
      >
        ゲーム
      </Link>
      <Link
        href="/achievements"
        className={`${HEADER_ACTION_BUTTON_CLASS} ${
          current === "achievements"
            ? "border-yellow-400 bg-yellow-400 text-indigo-900"
            : "border-indigo-500 bg-indigo-800 text-indigo-100 hover:border-indigo-300"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5 shrink-0"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6a4 4 0 100 8 4 4 0 000-8zM2.05 9.05a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zm15.9 0a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zM4.25 14.25a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.061l-1.06-1.06a.75.75 0 010-1.06zm11.5 0a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.061l-1.06-1.06a.75.75 0 010-1.06zM10 16.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z"
            clipRule="evenodd"
          />
        </svg>
        実績
      </Link>
      <AudioControlButton />
    </nav>
  );
}
