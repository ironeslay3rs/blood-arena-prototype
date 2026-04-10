"use client";

import type { RemoteRelayStatus } from "@/features/arena/useArenaEngine";
import {
  netplayLockstepDetailLine,
  netplayRelayAriaDescription,
  netplayRelayDesyncRecoveryLine,
  netplayRelayTrustSupplementLine,
} from "@/features/arena/netplayTrustReadout";
import { NETPLAY_RECOMMENDED_TICK_MS } from "@/features/arena/onlineNetplayStub";

export type NetplayPeerCareerStrip = {
  wins: number;
  level: number;
  displayLabel?: string;
} | null;

export function NetplayRelayStrip({
  status,
  slot,
  error,
  lockstepFrame,
  stateChecksumHex,
  pendingConfirmCount,
  rttMs,
  peerCareer,
  peerChecksumAligned,
}: {
  status: RemoteRelayStatus;
  slot: 0 | 1;
  error?: string;
  lockstepFrame: number;
  stateChecksumHex: string | null;
  pendingConfirmCount: number;
  rttMs: number | null;
  peerCareer: NetplayPeerCareerStrip;
  peerChecksumAligned: boolean | null;
}) {
  const tickMs = NETPLAY_RECOMMENDED_TICK_MS;
  const detail = netplayLockstepDetailLine({
    lockstepFrame,
    tickMs,
    stateChecksumHex,
    pendingConfirmCount,
  });
  const trustExtra = netplayRelayTrustSupplementLine({
    rttMs,
    peerLevel: peerCareer?.level ?? null,
    peerWins: peerCareer?.wins ?? null,
    peerDisplayLabel: peerCareer?.displayLabel ?? null,
    checksumAligned: peerChecksumAligned,
  });
  const desyncRecovery = netplayRelayDesyncRecoveryLine(peerChecksumAligned);
  const livePriority = Boolean(error) || peerChecksumAligned === false;

  return (
    <section
      className="rounded-lg border border-amber-600/40 bg-amber-950/25 px-3 py-2 text-xs text-amber-100"
      role="status"
      aria-live={livePriority ? "assertive" : "polite"}
      aria-label={netplayRelayAriaDescription({
        status,
        slot,
        error,
        lockstepFrame,
        tickMs,
        stateChecksumHex,
        pendingConfirmCount,
      })}
    >
      <p className="tabular-nums">
        <span className="font-semibold">Netplay relay</span> — {status}
        {status === "open" ? (
          <>
            {" "}
            · slot {slot}
            {slot === 0
              ? " (P1 keys) — second window ?netplaySlot=1 for P2"
              : " (P2 keys)"}
          </>
        ) : null}
        {error ? (
          <>
            {" "}
            — {error}
          </>
        ) : null}
      </p>
      <p className="mt-1.5 font-mono text-[11px] leading-snug text-amber-200/90">
        {detail}
      </p>
      {trustExtra ? (
        <p className="mt-1.5 font-mono text-[11px] leading-snug text-amber-100/85">
          {trustExtra}
        </p>
      ) : null}
      {desyncRecovery ? (
        <p
          className="mt-2 rounded border border-red-500/50 bg-red-950/40 px-2 py-1.5 text-[11px] leading-snug text-red-100"
          role="alert"
        >
          {desyncRecovery}
        </p>
      ) : null}
    </section>
  );
}
