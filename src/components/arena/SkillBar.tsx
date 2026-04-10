import {
  ABILITY_RESOURCE_COST,
  CLIMAX_METER_MAX,
} from "@/features/arena/arenaActions";
import type {
  FighterState,
  OpponentControllerKind,
} from "@/features/arena/arenaTypes";
import {
  DEFAULT_CANCEL_LINK_ROUTES,
  type CancelLinkRoutes,
} from "@/features/arena/cancelRouteConfig";
import { canUseAbility, fighterDef } from "@/features/arena/arenaUtils";

type SkillBarProps = {
  player: FighterState;
  disabled: boolean;
  /** Training vs local PvP — copy on this bar is only for P1. */
  opponentMode: OpponentControllerKind;
  /** Why inputs are off — clearer than a dead bar. */
  inputLockReason?: "round_over" | "knockout" | null;
  onAttack: () => void;
  onDash: () => void;
  onSkill1: () => void;
  onSkill2: () => void;
  onBlockDown: () => void;
  onBlockUp: () => void;
  climaxMeter: number;
  onClimax: () => void;
  /** After a clean hit, brief window where selected actions highlight as link routes. */
  linkWindowOpen?: boolean;
  /** Per-roster: which slots get the link ring (defaults: all on). */
  cancelLinkRoutes?: CancelLinkRoutes;
  /** When both set, shows remaining cancel-link window in ms (BP-47). */
  arenaNowMs?: number;
  cancelWindowUntilMs?: number;
};

function CooldownHint({ ms }: { ms: number }) {
  if (ms <= 0) return null;
  return (
    <span className="ml-1 tabular-nums text-[10px] text-amber-200/90">
      {(ms / 1000).toFixed(1)}s
    </span>
  );
}

const btn =
  "rounded-md px-3 py-2 text-sm font-medium transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40";

export function SkillBar({
  player,
  disabled,
  opponentMode,
  inputLockReason = null,
  onAttack,
  onDash,
  onSkill1,
  onSkill2,
  onBlockDown,
  onBlockUp,
  climaxMeter,
  onClimax,
  linkWindowOpen = false,
  cancelLinkRoutes = DEFAULT_CANCEL_LINK_ROUTES,
  arenaNowMs,
  cancelWindowUntilMs,
}: SkillBarProps) {
  const cd = player.cooldowns;
  const linkRingClass =
    "ring-2 ring-emerald-400/85 ring-offset-2 ring-offset-zinc-950";
  const linkDash =
    linkWindowOpen && !disabled && cancelLinkRoutes.dash ? linkRingClass : "";
  const linkSk1 =
    linkWindowOpen && !disabled && cancelLinkRoutes.skill1
      ? linkRingClass
      : "";
  const linkSk2 =
    linkWindowOpen && !disabled && cancelLinkRoutes.skill2
      ? linkRingClass
      : "";
  const kit = fighterDef(player);
  const [ability0, ability1] = player.fighterDefinition.abilities;
  const modeHeadline =
    opponentMode === "dummy"
      ? "Player 1 controls — training (AI has P2)"
      : "Player 1 controls — hot-seat PvP";

  return (
    <section
      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      aria-label="Player 1 controls"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {modeHeadline}
      </p>
      <div className="mb-3 space-y-2 text-xs leading-relaxed">
        <p className="rounded-md border-l-4 border-rose-500/80 bg-rose-50/50 py-1.5 pl-2.5 text-zinc-600 dark:bg-rose-950/20 dark:text-zinc-400">
          <span className="font-bold text-rose-800 dark:text-rose-300">
            P1
          </span>{" "}
          A/D or ←/→ move · Shift dash ·{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            F attack
          </span>{" "}
          ·{" "}
          <span className="font-medium text-violet-800 dark:text-violet-200">
            C Climax
          </span>{" "}
          · hold G
          block · 1 / 2 skills ·{" "}
          <span className="font-medium text-emerald-800 dark:text-emerald-300/90">
            link window
          </span>{" "}
          on clean hit (roster-tuned dash / skill rings)
        </p>
        <p className="rounded-md border-l-4 border-zinc-400/90 bg-zinc-100/60 py-1.5 pl-2.5 text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            P2
          </span>{" "}
          J/L move · O dash ·{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            U attack
          </span>{" "}
          · I block · [ ] skills
        </p>
        {opponentMode === "local_human" ? (
          <p className="text-[10px] leading-snug text-zinc-500 dark:text-zinc-500">
            P2 numpad alt: 4/6 move · 8 dash · 5 attack · * Climax · 0 block ·
            7/9 skills — link text under P2 card when active
          </p>
        ) : null}
        {typeof arenaNowMs === "number" &&
        typeof cancelWindowUntilMs === "number" &&
        cancelWindowUntilMs > arenaNowMs ? (
          <p
            className="rounded-md border border-emerald-600/45 bg-emerald-950/35 px-2 py-1.5 text-[11px] font-medium text-emerald-100"
            role="status"
            aria-label="Cancel link window remaining"
          >
            Cancel link window:{" "}
            <span className="tabular-nums">
              {Math.max(0, Math.ceil(cancelWindowUntilMs - arenaNowMs))}ms
            </span>{" "}
            left — chain dash or skills after your clean hit
          </p>
        ) : null}
      </div>
      <p className="mb-2 text-[10px] text-zinc-500 dark:text-zinc-500">
        Each ability spends {ABILITY_RESOURCE_COST} {kit.resourceLabel}{" "}
        (same bar).
      </p>
      <div
        className="mb-3 rounded-md border border-violet-500/35 bg-violet-950/25 px-2.5 py-2 dark:border-violet-600/40 dark:bg-violet-950/40"
        aria-label="Climax meter"
      >
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-violet-200/90">
          <span>Climax</span>
          <span className="tabular-nums text-violet-100">
            {Math.min(CLIMAX_METER_MAX, climaxMeter)} / {CLIMAX_METER_MAX}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-zinc-900/90 ring-1 ring-violet-500/25"
          role="progressbar"
          aria-valuenow={Math.min(CLIMAX_METER_MAX, climaxMeter)}
          aria-valuemin={0}
          aria-valuemax={CLIMAX_METER_MAX}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-300 transition-[width] duration-150 ease-out"
            style={{
              width: `${Math.min(100, (100 * climaxMeter) / CLIMAX_METER_MAX)}%`,
            }}
          />
        </div>
        <p className="mt-1 text-[10px] leading-snug text-violet-200/70">
          Builds when you deal or take HP damage. At full, Climax (melee range,
          long attack CD after).
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${btn} ${
            disabled || cd.attack > 0
              ? "bg-zinc-800 text-zinc-100"
              : "bg-rose-700 text-white shadow-md shadow-rose-950/45 dark:bg-rose-800"
          }`}
          disabled={disabled || cd.attack > 0}
          onClick={onAttack}
        >
          Attack
          <CooldownHint ms={cd.attack} />
        </button>
        <button
          type="button"
          className={`${btn} bg-zinc-800 text-zinc-100 ${linkDash}`}
          disabled={disabled || cd.dash > 0}
          onClick={onDash}
        >
          Dash
          <CooldownHint ms={cd.dash} />
        </button>
        <button
          type="button"
          className={`${btn} bg-amber-950 text-amber-100`}
          disabled={disabled}
          onPointerDown={(e) => {
            e.preventDefault();
            onBlockDown();
          }}
          onPointerUp={onBlockUp}
          onPointerCancel={onBlockUp}
          onPointerLeave={onBlockUp}
        >
          Block
        </button>
        <button
          type="button"
          className={`${btn} bg-indigo-900 text-indigo-50 ${linkSk1}`}
          disabled={
            disabled ||
            !canUseAbility(
              cd.skill1,
              player.resource,
              ABILITY_RESOURCE_COST,
            )
          }
          onClick={onSkill1}
        >
          {ability0.name}
          <CooldownHint ms={cd.skill1} />
        </button>
        <button
          type="button"
          className={`${btn} bg-indigo-900 text-indigo-50 ${linkSk2}`}
          disabled={
            disabled ||
            !canUseAbility(
              cd.skill2,
              player.resource,
              ABILITY_RESOURCE_COST,
            )
          }
          onClick={onSkill2}
        >
          {ability1.name}
          <CooldownHint ms={cd.skill2} />
        </button>
        <button
          type="button"
          className={`${btn} ${
            disabled || climaxMeter < CLIMAX_METER_MAX
              ? "bg-zinc-800 text-zinc-300"
              : "bg-gradient-to-br from-violet-700 to-fuchsia-700 text-white shadow-md shadow-violet-950/50"
          }`}
          disabled={disabled || climaxMeter < CLIMAX_METER_MAX}
          onClick={onClimax}
        >
          Climax
        </button>
      </div>
      {disabled && inputLockReason ? (
        <p
          className="mt-3 text-xs text-amber-800 dark:text-amber-200/95"
          role="status"
        >
          {inputLockReason === "round_over"
            ? "Round ended — press R, Esc, or Enter, or tap Reset match."
            : "Player 1 is down — press R, Esc, or Enter, or tap Reset match."}
        </p>
      ) : null}
    </section>
  );
}
