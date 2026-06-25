export type SeId =
  | "click"
  | "submit"
  | "judge_tick"
  | "clear"
  | "insufficient"
  | "critical"
  | "stage_advance"
  | "game_over"
  | "ending_positive"
  | "ending_neutral"
  | "ending_neglect"
  | "ending_chaos"
  | "mental_breakdown"
  | "chaos_alert"
  | "rank_tick"
  | "rank_reveal"
  | "rank_s";

export type BgmId =
  | "play"
  | "chaos_play"
  | "evaluating"
  | "ending_growth"
  | "ending_model"
  | "ending_survivor"
  | "ending_neglect"
  | "ending_chaos"
  | "game_over"
  | "mental_breakdown";

const STORAGE_KEY = "kikuchi-game-audio-muted";

type ToneOptions = {
  frequency: number;
  duration: number;
  volume?: number;
  type?: OscillatorType;
  attack?: number;
  release?: number;
  detune?: number;
};

type BgmLoop = {
  intervalId: ReturnType<typeof setInterval>;
  stop: () => void;
};

class GameAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private seGain: GainNode | null = null;
  private bgmLoop: BgmLoop | null = null;
  private currentBgm: BgmId | null = null;
  private muted = false;
  private unlocked = false;
  private bgmVolume = 0.45;
  private seVolume = 0.55;

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = localStorage.getItem(STORAGE_KEY) === "true";
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(muted));
    }
    this.applyMasterVolume();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  async unlock(): Promise<void> {
    if (typeof window === "undefined") return;

    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.seGain = this.ctx.createGain();

      this.bgmGain.connect(this.masterGain);
      this.seGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain.gain.value = this.bgmVolume;
      this.seGain.gain.value = this.seVolume;
      this.applyMasterVolume();
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    this.unlocked = true;
  }

  private applyMasterVolume(): void {
    if (!this.masterGain || !this.ctx) return;
    const target = this.muted ? 0 : 1;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  private ensureReady(): boolean {
    return Boolean(this.ctx && this.unlocked && !this.muted);
  }

  private playTone({
    frequency,
    duration,
    volume = 0.2,
    type = "sine",
    attack = 0.01,
    release = 0.08,
    detune = 0,
  }: ToneOptions): void {
    if (!this.ensureReady() || !this.ctx || !this.seGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.seGain);

    osc.start(now);
    osc.stop(now + duration + release);
  }

  private playSequence(
    notes: Array<{ freq: number; dur: number; vol?: number; type?: OscillatorType }>,
    gap = 0.05
  ): void {
    if (!this.ensureReady()) return;
    let offset = 0;
    for (const note of notes) {
      window.setTimeout(() => {
        this.playTone({
          frequency: note.freq,
          duration: note.dur,
          volume: note.vol ?? 0.18,
          type: note.type ?? "square",
        });
      }, offset * 1000);
      offset += note.dur + gap;
    }
  }

  private playBgmTone({
    frequency,
    duration,
    volume = 0.2,
    type = "sine",
    attack = 0.01,
    release = 0.08,
  }: Omit<ToneOptions, "detune">): void {
    if (!this.ensureReady() || !this.ctx || !this.bgmGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(now);
    osc.stop(now + duration + release);
  }

  playSe(id: SeId): void {
    if (!this.ensureReady()) return;

    switch (id) {
      case "click":
        this.playTone({ frequency: 880, duration: 0.04, volume: 0.08, type: "triangle" });
        break;
      case "submit":
        this.playSequence([
          { freq: 523.25, dur: 0.06, vol: 0.12, type: "triangle" },
          { freq: 659.25, dur: 0.08, vol: 0.14, type: "triangle" },
        ]);
        break;
      case "judge_tick":
        this.playTone({ frequency: 420, duration: 0.03, volume: 0.06, type: "square" });
        break;
      case "clear":
        this.playSequence([
          { freq: 523.25, dur: 0.08, vol: 0.16, type: "triangle" },
          { freq: 659.25, dur: 0.08, vol: 0.16, type: "triangle" },
          { freq: 783.99, dur: 0.1, vol: 0.18, type: "triangle" },
          { freq: 1046.5, dur: 0.14, vol: 0.2, type: "triangle" },
        ]);
        break;
      case "insufficient":
        this.playSequence([
          { freq: 349.23, dur: 0.12, vol: 0.14, type: "sawtooth" },
          { freq: 293.66, dur: 0.16, vol: 0.14, type: "sawtooth" },
        ]);
        break;
      case "critical":
        this.playSequence([
          { freq: 220, dur: 0.12, vol: 0.2, type: "sawtooth" },
          { freq: 185, dur: 0.12, vol: 0.2, type: "sawtooth" },
          { freq: 146.83, dur: 0.2, vol: 0.22, type: "sawtooth" },
        ]);
        break;
      case "stage_advance":
        this.playSequence([
          { freq: 440, dur: 0.06, vol: 0.12, type: "triangle" },
          { freq: 554.37, dur: 0.08, vol: 0.14, type: "triangle" },
        ]);
        break;
      case "game_over":
        this.playSequence([
          { freq: 392, dur: 0.15, vol: 0.16, type: "sawtooth" },
          { freq: 311.13, dur: 0.15, vol: 0.16, type: "sawtooth" },
          { freq: 246.94, dur: 0.15, vol: 0.16, type: "sawtooth" },
          { freq: 196, dur: 0.35, vol: 0.2, type: "sawtooth" },
        ]);
        break;
      case "ending_positive":
        this.playSequence([
          { freq: 523.25, dur: 0.1, vol: 0.16, type: "triangle" },
          { freq: 659.25, dur: 0.1, vol: 0.16, type: "triangle" },
          { freq: 783.99, dur: 0.1, vol: 0.16, type: "triangle" },
          { freq: 987.77, dur: 0.2, vol: 0.2, type: "triangle" },
        ]);
        break;
      case "ending_neutral":
        this.playSequence([
          { freq: 392, dur: 0.12, vol: 0.12, type: "triangle" },
          { freq: 440, dur: 0.16, vol: 0.12, type: "triangle" },
        ]);
        break;
      case "ending_neglect":
        this.playSequence([
          { freq: 880, dur: 0.06, vol: 0.1, type: "sine" },
          { freq: 1174.66, dur: 0.08, vol: 0.08, type: "sine" },
          { freq: 880, dur: 0.06, vol: 0.07, type: "sine" },
        ]);
        break;
      case "ending_chaos":
        this.playSequence([
          { freq: 110, dur: 0.08, vol: 0.18, type: "sawtooth" },
          { freq: 55, dur: 0.15, vol: 0.14, type: "sawtooth" },
          { freq: 880, dur: 0.04, vol: 0.14, type: "square" },
          { freq: 698.46, dur: 0.04, vol: 0.14, type: "square" },
          { freq: 932.33, dur: 0.04, vol: 0.14, type: "square" },
          { freq: 587.33, dur: 0.12, vol: 0.16, type: "square" },
        ]);
        break;
      case "mental_breakdown":
        this.playSequence([
          { freq: 293.66, dur: 0.2, vol: 0.1, type: "sine" },
          { freq: 261.63, dur: 0.25, vol: 0.09, type: "sine" },
          { freq: 220, dur: 0.35, vol: 0.08, type: "sine" },
        ]);
        break;
      case "chaos_alert":
        this.playSequence([
          { freq: 880, dur: 0.08, vol: 0.16, type: "square" },
          { freq: 440, dur: 0.08, vol: 0.14, type: "square" },
          { freq: 880, dur: 0.08, vol: 0.16, type: "square" },
          { freq: 220, dur: 0.15, vol: 0.12, type: "sawtooth" },
        ]);
        break;
      case "rank_tick":
        this.playTone({ frequency: 520, duration: 0.04, volume: 0.1, type: "square" });
        break;
      case "rank_reveal":
        this.playSequence([
          { freq: 392, dur: 0.08, vol: 0.14, type: "triangle" },
          { freq: 523.25, dur: 0.1, vol: 0.16, type: "triangle" },
          { freq: 659.25, dur: 0.14, vol: 0.18, type: "triangle" },
        ]);
        break;
      case "rank_s":
        this.playSequence([
          { freq: 523.25, dur: 0.08, vol: 0.16, type: "triangle" },
          { freq: 659.25, dur: 0.08, vol: 0.16, type: "triangle" },
          { freq: 783.99, dur: 0.08, vol: 0.18, type: "triangle" },
          { freq: 987.77, dur: 0.1, vol: 0.2, type: "triangle" },
          { freq: 1174.66, dur: 0.2, vol: 0.22, type: "triangle" },
        ]);
        break;
    }
  }

  stopBgm(): void {
    if (this.bgmLoop) {
      clearInterval(this.bgmLoop.intervalId);
      this.bgmLoop.stop();
      this.bgmLoop = null;
    }
    this.currentBgm = null;
  }

  startBgm(id: BgmId): void {
    if (!this.unlocked || this.muted) {
      this.currentBgm = id;
      return;
    }
    if (this.currentBgm === id && this.bgmLoop) return;

    this.stopBgm();
    this.currentBgm = id;

    const patterns: Record<
      BgmId,
      { notes: number[]; interval: number; volume: number; type: OscillatorType }
    > = {
      play: {
        notes: [261.63, 329.63, 392, 329.63],
        interval: 720,
        volume: 0.14,
        type: "triangle",
      },
      chaos_play: {
        notes: [440, 523.25, 622.25, 466.16, 554.37],
        interval: 380,
        volume: 0.13,
        type: "square",
      },
      evaluating: {
        notes: [220, 277.18, 329.63],
        interval: 280,
        volume: 0.12,
        type: "square",
      },
      ending_growth: {
        notes: [523.25, 659.25, 783.99, 987.77],
        interval: 540,
        volume: 0.15,
        type: "triangle",
      },
      ending_model: {
        notes: [392, 493.88, 587.33, 783.99],
        interval: 620,
        volume: 0.15,
        type: "triangle",
      },
      ending_survivor: {
        notes: [349.23, 392, 440],
        interval: 800,
        volume: 0.12,
        type: "sine",
      },
      ending_neglect: {
        notes: [220, 246.94, 207.65],
        interval: 900,
        volume: 0.12,
        type: "sine",
      },
      ending_chaos: {
        notes: [440, 523.25, 622.25, 466.16],
        interval: 320,
        volume: 0.14,
        type: "square",
      },
      game_over: {
        notes: [196, 174.61, 155.56, 146.83],
        interval: 700,
        volume: 0.14,
        type: "sawtooth",
      },
      mental_breakdown: {
        notes: [220, 207.65, 196, 174.61, 164.81],
        interval: 1100,
        volume: 0.11,
        type: "sine",
      },
    };

    const pattern = patterns[id];
    let step = 0;
    const oscillators: OscillatorNode[] = [];

    const playStep = () => {
      if (!this.ensureReady()) return;
      this.playBgmTone({
        frequency: pattern.notes[step % pattern.notes.length],
        duration: pattern.interval / 1000 - 0.05,
        volume: pattern.volume,
        type: pattern.type,
        attack: 0.02,
        release: 0.12,
      });
      step += 1;
    };

    playStep();
    const intervalId = setInterval(playStep, pattern.interval);

    this.bgmLoop = {
      intervalId,
      stop: () => {
        for (const osc of oscillators) {
          try {
            osc.stop();
          } catch {
            /* noop */
          }
        }
      },
    };
  }

  syncBgmIfPending(): void {
    if (this.currentBgm && this.unlocked && !this.muted) {
      const pending = this.currentBgm;
      this.stopBgm();
      this.startBgm(pending);
    }
  }
}

export const gameAudio = new GameAudioManager();

export function endingToBgm(
  ending: import("@/types/game").GameEnding
): BgmId {
  switch (ending) {
    case "model_boss":
      return "ending_model";
    case "growth":
      return "ending_growth";
    case "survivor":
      return "ending_survivor";
    case "neglect":
      return "ending_neglect";
    case "tanaka_chaos":
      return "ending_chaos";
  }
}

export function endingToSe(
  ending: import("@/types/game").GameEnding
): SeId {
  switch (ending) {
    case "model_boss":
    case "growth":
      return "ending_positive";
    case "tanaka_chaos":
      return "ending_chaos";
    case "neglect":
      return "ending_neglect";
    default:
      return "ending_neutral";
  }
}
