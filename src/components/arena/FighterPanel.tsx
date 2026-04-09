import type {
  CombatStanceId,
  FighterState,
  ReputationSnapshot,
  UnifiedFighterIdentity,
} from "@/features/arena/arenaTypes";
import {
  STANCE_ORDER,
  STANCE_UI,
} from "@/features/arena/combatStance";
import { CLIMAX_METER_MAX } from "@/features/arena/climaxMeterConfig";
import { fighterDef } from "@/features/arena/arenaUtils";
import type { CardCombatFeedback } from "./useCombatFeedback";

function CombatStanceStrip({
  current,
  onChange,
  disabled,
}: {
  current: CombatStanceId;
  onChange?: (stance: CombatStanceId) => void;
  disabled?: boolean;
}) {
  const interactive = !!onChange && !disabled;
  return (
    <div className="mb-3" role="group" aria-label="Combat stance">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Stance — how you lane
      </p>
      <div className="flex flex-wrap gap-1.5">
        {STANCE_ORDER.map((id) => {
          const active = current === id;
          const ui = STANCE_UI[id];
          return (
            <button
              key={id}
              type="button"
              disabled={!interactive}
              title={ui.shortHint}
              onClick={() => onChange?.(id)}
              className={`rounded-md border px-2 py-1 text-left text-[11px] font-medium transition ${
                active
                  ? "border-rose-500 bg-rose-50 text-rose-950 dark:border-rose-500 dark:bg-rose-950/50 dark:text-rose-100"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
              } ${!interactive ? "cursor-default opacity-70" : ""}`}
            >
              {ui.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-zinc-500">{STANCE_UI[current].shortHint}</p>
    </div>
  );
}

function ResourceBar({
  label,
  current,
  max,
  fillClass,
}: {
  label: string;
  current: number;
  max: number;
  fillClass: string;
}) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>
          {Math.round(current)} / {max}
        </span>
      </div>
      <div className="mt-0.5 h-2 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-sm transition-[width] duration-150 ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ShieldBar({
  current,
  crack,
}: {
  current: number;
  crack: boolean;
}) {
  const pct = Math.min(100, Math.max(0, current));
  return (
    <div className="relative">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>Shield</span>
        <span className="tabular-nums">{Math.round(current)}</span>
      </div>
      <div
        className={`relative mt-0.5 h-2 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800 ${crack ? "ring-1 ring-cyan-300/60 dark:ring-cyan-500/40" : ""}`}
      >
        <div
          className="h-full rounded-sm bg-cyan-500 transition-[width] duration-150 dark:bg-cyan-400"
          style={{ width: `${pct}%` }}
        />
        {crack ? (
          <div
            className="evolution-shield-crack-overlay pointer-events-none absolute inset-0"
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}

function IdentityMilestone({
  earned,
  label,
}: {
  earned: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-start gap-2 text-xs ${
        earned
          ? "text-zinc-700 dark:text-zinc-300"
          : "text-zinc-400 dark:text-zinc-600"
      }`}
    >
      <span className="mt-0.5 w-4 shrink-0 font-mono" aria-hidden>
        {earned ? "✓" : "·"}
      </span>
      <span>{label}</span>
    </div>
  );
}

type FighterPanelProps = {
  fighter: FighterState;
  /**
   * When set (player), replaces the minimal header with the unified identity block.
   * Record and evolution are read from {@link UnifiedFighterIdentity}.
   */
  identity?: UnifiedFighterIdentity | null;
  combatFeedback?: CardCombatFeedback;
  onCombatStanceChange?: (stance: CombatStanceId) => void;
  /** When true, stance buttons are view-only (e.g. match ended). */
  stanceChangeLocked?: boolean;
  /** Shown when {@link identity} is absent (e.g. Player 2). */
  reputation?: ReputationSnapshot | null;
  /** Local PvP: P2 climax controls (meter read from {@link fighter}.climaxMeter). */
  hotSeatClimax?: {
    disabled: boolean;
    onClimax: () => void;
    /** P2 link line — roster-specific actions (see `cancelRouteConfig`). */
    linkHint?: string;
  };
};

function reputationCardClass(prestige: ReputationSnapshot["prestige"]): string {
  if (prestige >= 4) {
    return "border-rose-500/55 bg-rose-100/50 dark:border-rose-600/50 dark:bg-rose-950/40";
  }
  if (prestige >= 3) {
    return "border-rose-400/45 bg-rose-50/70 dark:border-rose-800/40 dark:bg-rose-950/25";
  }
  if (prestige >= 2) {
    return "border-zinc-300/90 bg-white/50 dark:border-zinc-600 dark:bg-zinc-900/35";
  }
  return "border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/30";
}

function ReputationCard({ rep }: { rep: ReputationSnapshot }) {
  return (
    <div
      className={`mt-3 rounded-lg border px-2.5 py-2 ${reputationCardClass(rep.prestige)}`}
      aria-label="Reputation"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Known as
      </p>
      <p className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-100">
        {rep.title}
      </p>
      <p className="mt-0.5 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
        {rep.descriptor}
      </p>
    </div>
  );
}

export function FighterPanel({
  fighter,
  identity,
  combatFeedback,
  onCombatStanceChange,
  stanceChangeLocked,
  reputation,
  hotSeatClimax,
}: FighterPanelProps) {
  const def = fighterDef(fighter);
  const hpRatio = fighter.hpMax > 0 ? fighter.hp / fighter.hpMax : 0;
  const status =
    fighter.hp <= 0
      ? "Down"
      : fighter.blocking
        ? "Blocking"
        : hpRatio <= 0.25
          ? "Critical"
          : "Ready";

  const fb = combatFeedback;
  const outlineClass = fb?.targetedGlow
    ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-100 dark:ring-offset-zinc-950"
    : "";

  const healPulseClass =
    identity && fb?.evolutionHealPulse ? "evolution-heal-pulse" : "";

  const slotEyebrow =
    fighter.role === "player" ? "Player 1" : "Player 2";

  return (
    <article
      aria-label={`${slotEyebrow}: ${def.displayName}`}
      className={`relative rounded-lg border border-zinc-200 p-4 transition-shadow duration-200 dark:border-zinc-800 ${outlineClass} ${healPulseClass}`}
    >
      {fb?.showTargetedCaption ? (
        <div
          className="combat-float-caption pointer-events-none absolute -top-2 right-2 rounded bg-yellow-500/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-950 shadow"
          aria-live="polite"
        >
          TARGETED
        </div>
      ) : null}

      {fb?.traitLabel ? (
        <div
          className="pointer-events-none absolute -top-2 left-2 rounded border border-zinc-400/80 bg-zinc-800/95 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-200 shadow dark:border-zinc-600"
          aria-label={`AI stance ${fb.traitLabel}`}
        >
          {fb.traitLabel}
        </div>
      ) : null}

      {fb?.evolutionFirstHitFlash ? (
        <div
          className="evolution-first-hit-flash pointer-events-none absolute inset-0 z-[9] rounded-md"
          aria-hidden
        />
      ) : null}

      {fb?.damageNumber != null ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-live="polite"
        >
          <span className="combat-damage-float text-2xl font-black tabular-nums text-rose-500 drop-shadow-md dark:text-rose-400">
            −{fb.damageNumber}
          </span>
        </div>
      ) : null}

      {identity ? (
        <header className="mb-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div className="relative overflow-hidden rounded-xl border border-rose-200/70 bg-gradient-to-b from-rose-50/90 via-rose-50/40 to-transparent px-3.5 py-3 dark:border-rose-900/45 dark:from-rose-950/55 dark:via-rose-950/25 dark:to-transparent">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-600/90 dark:text-rose-400/90">
              {slotEyebrow}
            </p>
            <p className="mt-2 text-[1.35rem] font-black uppercase leading-[1.1] tracking-[0.12em] text-rose-900 dark:text-rose-300 sm:text-2xl">
              {identity.arenaTitle}
            </p>
            <h2 className="mt-2 text-xl font-bold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
              {identity.displayName}
            </h2>
            {identity.nickname ? (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {identity.canonName}
              </p>
            ) : null}
            <p
              className="mt-2.5 text-sm font-medium italic leading-snug text-amber-900 dark:text-amber-200/95"
              aria-label="Fighter identity"
            >
              {identity.identityLine}
            </p>
            <ReputationCard rep={identity.reputation} />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-rose-300/80 bg-rose-100/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-950 dark:border-rose-700/60 dark:bg-rose-950/50 dark:text-rose-100">
                {identity.keyTraitDisplay}
              </span>
              <span className="rounded-full border border-zinc-300/90 bg-white/60 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-200">
                {identity.evolutionTierDisplay}
              </span>
            </div>
            <p className="mt-3 text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
              {identity.wins}W / {identity.losses}L · Lv {identity.level} ·{" "}
              <span className="text-zinc-500 dark:text-zinc-500">
                {identity.rosterName}
              </span>
            </p>
            <details className="mt-2 border-t border-rose-200/50 pt-2 dark:border-rose-900/40">
              <summary className="cursor-pointer text-[11px] font-medium text-rose-800/80 hover:text-rose-900 dark:text-rose-300/90 dark:hover:text-rose-200">
                Career detail
              </summary>
              <div className="mt-2 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <p className="tabular-nums">
                  {Math.round(identity.totalDamageDealt).toLocaleString()} dealt ·{" "}
                  {Math.round(identity.totalDamageTaken).toLocaleString()} taken
                </p>
                <div className="space-y-1" aria-label="Career milestones">
                  <IdentityMilestone
                    earned={identity.milestoneArenaRemembersName}
                    label="Arena remembers your name"
                  />
                  <IdentityMilestone
                    earned={identity.milestoneNoLongerPrey}
                    label="You are no longer prey"
                  />
                </div>
              </div>
            </details>
          </div>
        </header>
      ) : (
        <header className="mb-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            {slotEyebrow}
          </p>
          <h2 className="mt-1 text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-50">
            {def.displayName}
          </h2>
          {fighter.isDummy ? (
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-200/90">
              {fighter.label} — AI controls this slot
            </p>
          ) : null}
          {reputation ? <ReputationCard rep={reputation} /> : null}
        </header>
      )}

      <CombatStanceStrip
        current={fighter.combatStance}
        onChange={onCombatStanceChange}
        disabled={stanceChangeLocked}
      />

      <div className="space-y-3">
        <ResourceBar
          label="HP"
          current={fighter.hp}
          max={fighter.hpMax}
          fillClass="bg-rose-500"
        />
        {fighter.tempShield > 0 || fb?.evolutionShieldCrack ? (
          <ShieldBar
            current={fighter.tempShield}
            crack={!!fb?.evolutionShieldCrack}
          />
        ) : null}
        <ResourceBar
          label={def.resourceLabel}
          current={fighter.resource}
          max={fighter.resourceMax}
          fillClass={def.resourceBarFillClass}
        />
        {hotSeatClimax ? (
          <div
            className="rounded-md border border-violet-500/35 bg-violet-950/15 px-2.5 py-2 dark:border-violet-600/40 dark:bg-violet-950/35"
            aria-label="Player 2 Climax"
          >
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-violet-200/90">
              <span>Climax</span>
              <span className="tabular-nums text-violet-100">
                {Math.min(CLIMAX_METER_MAX, fighter.climaxMeter)} /{" "}
                {CLIMAX_METER_MAX}
              </span>
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-zinc-900/90 ring-1 ring-violet-500/25">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-300 transition-[width] duration-150 ease-out"
                style={{
                  width: `${Math.min(100, (100 * fighter.climaxMeter) / CLIMAX_METER_MAX)}%`,
                }}
              />
            </div>
            <button
              type="button"
              className={`w-full rounded-md px-2 py-1.5 text-center text-xs font-semibold transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${
                hotSeatClimax.disabled ||
                fighter.climaxMeter < CLIMAX_METER_MAX
                  ? "bg-zinc-800 text-zinc-300"
                  : "bg-gradient-to-br from-violet-700 to-fuchsia-700 text-white shadow-sm shadow-violet-950/40"
              }`}
              disabled={
                hotSeatClimax.disabled ||
                fighter.climaxMeter < CLIMAX_METER_MAX
              }
              onClick={hotSeatClimax.onClimax}
            >
              Climax (M)
            </button>
            {hotSeatClimax.linkHint && !hotSeatClimax.disabled ? (
              <p className="mt-1.5 text-center text-[9px] font-semibold uppercase tracking-wide text-emerald-400/95">
                {hotSeatClimax.linkHint}
              </p>
            ) : null}
          </div>
        ) : null}
        <p className="text-[11px] text-zinc-500">
          Melee reach:{" "}
          <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
            {def.attackRange}
          </span>{" "}
          <span className="text-zinc-500">— compare to Gap on the arena</span>
        </p>
        <p className="text-xs text-zinc-500">
          Status:{" "}
          <span
            className={
              status === "Critical"
                ? "font-semibold text-rose-600 dark:text-rose-400"
                : "text-zinc-700 dark:text-zinc-300"
            }
          >
            {status}
            {status === "Critical" ? " — low HP" : ""}
          </span>
        </p>
      </div>
    </article>
  );
}
