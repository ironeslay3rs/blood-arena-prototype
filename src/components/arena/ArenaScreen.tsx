"use client";

import type { FighterId } from "@/features/arena/arenaTypes";
import { canSpendArenaPrep } from "@/features/arena/arenaSpend";
import { useArenaEngine } from "@/features/arena/useArenaEngine";
import { CANON_CHARACTER_DEFINITIONS } from "@/features/shared/canonCharacters";
import { ArenaStage } from "./ArenaStage";
import { CombatLog } from "./CombatLog";
import { FighterPanel } from "./FighterPanel";
import { FighterProfilePanel } from "./FighterProfilePanel";
import { MatchHud } from "./MatchHud";
import { SkillBar } from "./SkillBar";

const PLAYER_FIGHTER_OPTIONS: { label: string; fighterId: FighterId }[] = [
  { label: "Werewolf", fighterId: "feral-hound" },
  { label: "Paladin", fighterId: "vault-disciple" },
  { label: "Silver Knight", fighterId: "ironheart-cadet" },
  { label: "Feral Hound", fighterId: "feral-hound" },
  { label: "Vault Disciple", fighterId: "vault-disciple" },
  { label: "Ironheart Cadet", fighterId: "ironheart-cadet" },
  { label: "Scrap Hound", fighterId: "scrap-hound" },
];

export function ArenaScreen() {
  const { state, actions } = useArenaEngine();
  const [player, opponent] = state.fighters;
  const controlsLocked = player.hp <= 0 || state.winner != null;
  const playerCareer = state.fighterProgress[player.fighterId];
  const spendUnlocked = canSpendArenaPrep(state);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <MatchHud
        title="Blood Arena Prototype"
        winner={state.winner}
        resources={state.resources}
        lastMatchResult={state.lastMatchResult}
        pendingHpPenalty={state.pendingHpPenalty}
        nextMatchHpBonus={state.nextMatchHpBonus}
        nextMatchAttackBonus={state.nextMatchAttackBonus}
        spendUnlocked={spendUnlocked}
        activeFighterName={state.playerFighter.name}
        activeFighterCareer={playerCareer}
        onResetMatch={actions.resetMatch}
        onReinforceBody={actions.reinforceBody}
        onBribeHandler={actions.bribeHandler}
        onBloodRitual={actions.bloodRitual}
        resourceFocus={state.resourceFocus}
        onResourceFocusChange={actions.setResourceFocus}
      />

      <section className="flex flex-col gap-2">
        <p className="text-sm text-zinc-500">Your fighter</p>
        <div className="flex flex-wrap gap-2">
          {PLAYER_FIGHTER_OPTIONS.map(({ label, fighterId }) => (
            <button
              key={label}
              type="button"
              className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600"
              onClick={() => actions.setPlayerFighter(fighterId)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <FighterProfilePanel
        profile={
          state.fighterProfiles[player.fighterDefinition.canonCharacterId]
        }
        identityName={
          CANON_CHARACTER_DEFINITIONS[player.fighterDefinition.canonCharacterId]
            .name
        }
      />

      <ArenaStage fighters={state.fighters} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FighterPanel fighter={player} career={playerCareer} />
        <FighterPanel fighter={opponent} />
      </div>

      <SkillBar
        player={player}
        disabled={controlsLocked}
        onAttack={actions.basicAttack}
        onDash={actions.dash}
        onSkill1={actions.useSkill1}
        onSkill2={actions.useSkill2}
        onBlockDown={actions.startBlock}
        onBlockUp={actions.stopBlock}
      />

      <CombatLog entries={state.log} />
    </div>
  );
}
