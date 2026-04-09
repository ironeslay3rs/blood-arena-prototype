"use client";

import { ArenaStage } from "@/components/arena/ArenaStage";
import { tempoCombatAnimationSpeedMultiplier } from "@/features/arena/arenaActions";
import { compactArenaChecksum } from "@/features/arena/arenaNetplayLockstep";
import { DEFAULT_PLAYER_FIGHTER_ID } from "@/features/arena/classData";
import type { FighterId } from "@/features/arena/arenaTypes";
import { useArenaLockstepHotSeatDev } from "@/features/arena/useArenaLockstepHotSeatDev";
import Link from "next/link";

const PICKS: { label: string; fighterId: FighterId }[] = [
  { label: "Feral Hound", fighterId: "feral-hound" },
  { label: "Vault Disciple", fighterId: "vault-disciple" },
  { label: "Ironheart Cadet", fighterId: "ironheart-cadet" },
];

export default function NetplayLockstepDevPage() {
  const { state, simFrame, wireRxCount, lastPeerChecksum, actions } =
    useArenaLockstepHotSeatDev();
  const [p0, p1] = state.fighters;
  const checksumLocal = compactArenaChecksum(state);
  const wireMatches =
    lastPeerChecksum != null && lastPeerChecksum === checksumLocal;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 text-zinc-100">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-rose-400">
          Dev only
        </p>
        <h1 className="text-xl font-bold">Netplay lockstep (fixed tick)</h1>
        <p className="text-sm text-zinc-400">
          Same bindings as the main arena; sim advances on{" "}
          <code className="rounded bg-zinc-800 px-1">NETPLAY_RECOMMENDED_TICK_MS</code>{" "}
          with <code className="rounded bg-zinc-800 px-1">arenaReducerNetplayFrame</code>.
          Each tick sends <code className="rounded bg-zinc-800 px-1">input_confirm</code>{" "}
          + <code className="rounded bg-zinc-800 px-1">peer_advance</code> over a memory
          transport mirror (BP-24).
        </p>
        <Link
          href="/"
          className="inline-block text-sm text-rose-400 underline hover:text-rose-300"
        >
          ← Back to main arena
        </Link>
      </header>

      <section className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-3 font-mono text-xs text-zinc-300">
        <div>Sim frame: {simFrame}</div>
        <div>Wire RX (mirror): {wireRxCount}</div>
        <div>Checksum (local): {checksumLocal}</div>
        <div>
          Checksum (last peer_advance): {lastPeerChecksum ?? "—"}
        </div>
        <div className={wireMatches ? "text-emerald-400" : "text-amber-400"}>
          Mirror parity: {lastPeerChecksum == null ? "waiting…" : wireMatches ? "ok" : "mismatch"}
        </div>
      </section>

      <ArenaStage
        fighters={state.fighters}
        matchModifier={state.matchModifier}
        opponentMode="local_human"
        tempoAnimSpeed={tempoCombatAnimationSpeedMultiplier(state.combatTempo)}
      />

      <section className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded border border-zinc-700 p-2">
          <div className="font-semibold text-rose-300">P1</div>
          <div className="tabular-nums text-zinc-400">
            HP {p0.hp}/{p0.hpMax} · res {Math.round(p0.resource)}
          </div>
        </div>
        <div className="rounded border border-zinc-700 p-2">
          <div className="font-semibold text-zinc-300">P2</div>
          <div className="tabular-nums text-zinc-400">
            HP {p1.hp}/{p1.hpMax} · res {Math.round(p1.resource)}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-300">P1 fighter (dev)</h2>
        <div className="flex flex-wrap gap-2">
          {PICKS.map(({ label, fighterId }) => (
            <button
              key={fighterId}
              type="button"
              className={`rounded border px-2 py-1 text-sm ${
                state.playerFighter.id === fighterId
                  ? "border-rose-500 bg-rose-950/50"
                  : "border-zinc-600"
              }`}
              onClick={() => actions.setPlayerFighter(fighterId)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Default P1 is {DEFAULT_PLAYER_FIGHTER_ID}. Progress is not saved on this route.
        </p>
      </section>

      <p className="text-xs text-zinc-500">
        R / Enter / Esc — reset match · P1: WASD move, G block, Shift dash, F attack, C
        climax, 1–2 skills · P2: J/L, I block, O dash, U attack, M climax, [ ] skills
      </p>
    </main>
  );
}
