/**
 * Shared parsing for combat log lines (damage attribution). Used by UI feedback and SFX.
 */
export function parseDamageLine(
  msg: string,
  youLabel: string,
  oppLabel: string,
): { attacker: string; target: string; amount: number } | null {
  const dm = msg.match(/ for (\d+) HP/);
  if (!dm) return null;
  const amount = parseInt(dm[1]!, 10);
  if (!Number.isFinite(amount)) return null;
  const pre = msg.split(" for ")[0] ?? "";

  const hitSep = " hit ";
  const hi = pre.indexOf(hitSep);
  if (hi !== -1) {
    return {
      attacker: pre.slice(0, hi),
      target: pre.slice(hi + hitSep.length),
      amount,
    };
  }

  const sw = " struck with ";
  const wi = pre.indexOf(sw);
  if (wi !== -1) {
    const rest = pre.slice(wi + sw.length);
    if (rest.endsWith(youLabel)) {
      return {
        attacker: pre.slice(0, wi),
        target: youLabel,
        amount,
      };
    }
    if (rest.endsWith(oppLabel)) {
      return {
        attacker: pre.slice(0, wi),
        target: oppLabel,
        amount,
      };
    }
  }

  return null;
}

export function isBlockedDamageMessage(msg: string): boolean {
  return msg.includes("(blocked)");
}

/** Matches `… unleashes Rending Climax!` (card or faction name before `!`). */
export function parseClimaxUnleashLine(message: string): {
  attackerLabel: string;
  climaxName: string;
} | null {
  const m = /^(.+?) unleashes (.+)!$/.exec(message.trim());
  if (!m) return null;
  return { attackerLabel: m[1]!, climaxName: m[2]! };
}
