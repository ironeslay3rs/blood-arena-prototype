/**
 * Copy for relay / lockstep trust UX (BP-39 / BP-40) — deterministic sim visibility without claiming peer parity yet.
 */

export function netplayLockstepDetailLine(args: {
  lockstepFrame: number;
  tickMs: number;
  stateChecksumHex: string | null;
  /** Frames received but not yet applied (waiting for next sequential `input_confirm`). */
  pendingConfirmCount?: number;
}): string {
  const { lockstepFrame, tickMs, stateChecksumHex, pendingConfirmCount } = args;
  const backlog =
    pendingConfirmCount != null && pendingConfirmCount > 0
      ? pendingConfirmCount
      : 0;

  if (lockstepFrame <= 0 && !stateChecksumHex) {
    const base = `Lockstep ${tickMs}ms — awaiting first confirmed frame`;
    if (backlog > 0) return `${base} · confirm backlog ${backlog}…`;
    return `${base}…`;
  }
  const parts: string[] = [`frame ${lockstepFrame}`, `${tickMs}ms lockstep`];
  if (stateChecksumHex) parts.push(`state ${stateChecksumHex}`);
  if (backlog > 0) parts.push(`confirm backlog ${backlog}`);
  return parts.join(" · ");
}

/** RTT + peer career + checksum alignment — relay trust supplement (BP-46). */
export function netplayRelayTrustSupplementLine(args: {
  rttMs: number | null;
  peerWins: number | null;
  peerLevel: number | null;
  /** Optional short label from `?netplayLabel=` (BP-47). */
  peerDisplayLabel?: string | null;
  checksumAligned: boolean | null;
}): string {
  const parts: string[] = [];
  if (args.rttMs != null) {
    parts.push(`relay RTT ~${args.rttMs}ms`);
  }
  if (args.peerLevel != null && args.peerWins != null) {
    const label =
      args.peerDisplayLabel != null && args.peerDisplayLabel.length > 0
        ? `peer “${args.peerDisplayLabel}” · Lv.${args.peerLevel} · ${args.peerWins}W`
        : `peer disclosed Lv.${args.peerLevel} · ${args.peerWins}W`;
    parts.push(label);
  }
  if (args.checksumAligned === true) {
    parts.push("peer checksum match");
  } else if (args.checksumAligned === false) {
    parts.push("peer checksum mismatch (inspect desync)");
  }
  return parts.join(" · ");
}

/** Actionable copy when local and peer sim checksums disagree (BP-47). */
export function netplayRelayDesyncRecoveryLine(
  checksumAligned: boolean | null,
): string | null {
  if (checksumAligned !== false) return null;
  return "Sim disagrees with peer at this frame — both press Rematch (same build). If it repeats, screenshot this strip and the combat log tail.";
}

export function netplayRelayAriaDescription(args: {
  status: string;
  slot: number;
  error?: string;
  lockstepFrame: number;
  tickMs: number;
  stateChecksumHex: string | null;
  pendingConfirmCount?: number;
}): string {
  const base = `Netplay relay ${args.status}, slot ${args.slot}`;
  const err = args.error ? `. ${args.error}` : "";
  const detail = netplayLockstepDetailLine({
    lockstepFrame: args.lockstepFrame,
    tickMs: args.tickMs,
    stateChecksumHex: args.stateChecksumHex,
    pendingConfirmCount: args.pendingConfirmCount,
  });
  return `${base}. ${detail}${err}`;
}
