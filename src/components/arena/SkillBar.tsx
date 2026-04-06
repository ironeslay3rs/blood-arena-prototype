import { ABILITY_RESOURCE_COST } from "@/features/arena/arenaActions";
import type { FighterState } from "@/features/arena/arenaTypes";
import { canUseAbility } from "@/features/arena/arenaUtils";

type SkillBarProps = {
  player: FighterState;
  disabled: boolean;
  onAttack: () => void;
  onDash: () => void;
  onSkill1: () => void;
  onSkill2: () => void;
  onBlockDown: () => void;
  onBlockUp: () => void;
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
  onAttack,
  onDash,
  onSkill1,
  onSkill2,
  onBlockDown,
  onBlockUp,
}: SkillBarProps) {
  const cd = player.cooldowns;
  const [ability0, ability1] = player.fighterDefinition.abilities;

  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 space-y-1.5 text-xs leading-relaxed text-zinc-500">
        <p>
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">
            Player 1
          </span>{" "}
          — A/D or ←/→ · Shift dash · F attack · hold G block · 1/2 skills (buttons
          below; hold block).
        </p>
        <p>
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">
            Player 2
          </span>{" "}
          — J/L move · O dash · U attack · I block · [ ] skills (local PvP).
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${btn} bg-zinc-800 text-zinc-100`}
          disabled={disabled || cd.attack > 0}
          onClick={onAttack}
        >
          Attack
          <CooldownHint ms={cd.attack} />
        </button>
        <button
          type="button"
          className={`${btn} bg-zinc-800 text-zinc-100`}
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
          className={`${btn} bg-indigo-900 text-indigo-50`}
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
          className={`${btn} bg-indigo-900 text-indigo-50`}
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
      </div>
    </section>
  );
}
