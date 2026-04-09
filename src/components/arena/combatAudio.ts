import type { Faction, FighterId } from "@/features/arena/arenaTypes";
import { resolveClimaxStinger } from "@/features/arena/climaxStingerConfig";

export type CombatSoundKind =
  | "player_hit"
  | "opponent_hit"
  | "blocked_hit"
  | "round_start"
  | "stinger_clutch"
  | "stinger_streak";

/**
 * Lightweight UI beeps via Web Audio (no asset files). Call {@link unlock} after a user gesture.
 */
export function createCombatAudioController() {
  let ctx: AudioContext | null = null;

  function ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    }
    return ctx;
  }

  async function unlock(): Promise<void> {
    const c = ensureCtx();
    if (c?.state === "suspended") {
      try {
        await c.resume();
      } catch {
        /* ignore */
      }
    }
  }

  function playTone(opts: {
    freq: number;
    durationSec: number;
    gain: number;
    type?: OscillatorType;
    freqEnd?: number;
  }): void {
    const c = ensureCtx();
    if (!c || c.state !== "running") return;

    const osc = c.createOscillator();
    const g = c.createGain();
    const t0 = c.currentTime;
    const dur = Math.max(0.02, opts.durationSec);

    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.freqEnd != null && opts.freqEnd !== opts.freq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, opts.freqEnd),
        t0 + dur,
      );
    }

    g.gain.setValueAtTime(opts.gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);

    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function play(kind: CombatSoundKind): void {
    const c = ensureCtx();
    if (!c || c.state !== "running") return;

    switch (kind) {
      case "player_hit":
        playTone({ freq: 920, freqEnd: 620, durationSec: 0.07, gain: 0.09 });
        break;
      case "opponent_hit":
        playTone({ freq: 340, freqEnd: 220, durationSec: 0.09, gain: 0.1 });
        break;
      case "blocked_hit":
        playTone({
          freq: 180,
          durationSec: 0.05,
          gain: 0.06,
          type: "triangle",
        });
        playTone({
          freq: 120,
          durationSec: 0.06,
          gain: 0.05,
          type: "square",
        });
        break;
      case "round_start":
        playTone({ freq: 523.25, durationSec: 0.1, gain: 0.07 });
        window.setTimeout(() => {
          const c2 = ensureCtx();
          if (!c2 || c2.state !== "running") return;
          playTone({
            freq: 659.25,
            durationSec: 0.14,
            gain: 0.08,
            freqEnd: 784,
          });
        }, 95);
        break;
      case "stinger_clutch":
        playTone({ freq: 392, freqEnd: 523.25, durationSec: 0.09, gain: 0.065 });
        window.setTimeout(() => {
          const c2 = ensureCtx();
          if (!c2 || c2.state !== "running") return;
          playTone({
            freq: 587.33,
            durationSec: 0.11,
            gain: 0.07,
            freqEnd: 698.46,
          });
        }, 70);
        break;
      case "stinger_streak":
        playTone({ freq: 659.25, durationSec: 0.08, gain: 0.06 });
        window.setTimeout(() => {
          const c2 = ensureCtx();
          if (!c2 || c2.state !== "running") return;
          playTone({ freq: 783.99, durationSec: 0.09, gain: 0.065 });
        }, 75);
        window.setTimeout(() => {
          const c2 = ensureCtx();
          if (!c2 || c2.state !== "running") return;
          playTone({
            freq: 987.77,
            durationSec: 0.14,
            gain: 0.075,
            freqEnd: 1174.66,
          });
        }, 165);
        break;
      default:
        break;
    }
  }

  function playClimaxConnect(fighterId: FighterId, faction: Faction): void {
    const t = resolveClimaxStinger(fighterId, faction);
    const playProcedural = () => {
      playTone({
        freq: t.freq,
        freqEnd: t.freqEnd,
        durationSec: t.durationSec,
        gain: t.gain,
        type: t.type,
      });
    };

    if (t.sampleUrl && typeof window !== "undefined") {
      const el = new Audio(t.sampleUrl);
      el.volume = Math.min(1, t.gain * 8);
      void el.play().catch(() => {
        playProcedural();
      });
      return;
    }

    playProcedural();
  }

  function dispose(): void {
    void ctx?.close();
    ctx = null;
  }

  return { unlock, play, playClimaxConnect, dispose };
}

export type CombatAudioController = ReturnType<typeof createCombatAudioController>;

export function vibrateCombat(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
