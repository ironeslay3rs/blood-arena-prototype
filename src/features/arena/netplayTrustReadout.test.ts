import { describe, expect, it } from "vitest";
import {
  netplayLockstepDetailLine,
  netplayRelayAriaDescription,
  netplayRelayDesyncRecoveryLine,
  netplayRelayTrustSupplementLine,
} from "./netplayTrustReadout";

describe("netplayTrustReadout", () => {
  it("shows awaiting copy before first lockstep frame", () => {
    expect(
      netplayLockstepDetailLine({
        lockstepFrame: 0,
        tickMs: 16,
        stateChecksumHex: null,
      }),
    ).toBe("Lockstep 16ms — awaiting first confirmed frame…");
  });

  it("shows confirm backlog while awaiting first frame (BP-40)", () => {
    expect(
      netplayLockstepDetailLine({
        lockstepFrame: 0,
        tickMs: 16,
        stateChecksumHex: null,
        pendingConfirmCount: 2,
      }),
    ).toBe(
      "Lockstep 16ms — awaiting first confirmed frame · confirm backlog 2…",
    );
  });

  it("includes frame, tick, and checksum when sim has advanced", () => {
    expect(
      netplayLockstepDetailLine({
        lockstepFrame: 12,
        tickMs: 16,
        stateChecksumHex: "deadbeef",
      }),
    ).toBe("frame 12 · 16ms lockstep · state deadbeef");
  });

  it("appends confirm backlog when sim has advanced (BP-40)", () => {
    expect(
      netplayLockstepDetailLine({
        lockstepFrame: 5,
        tickMs: 16,
        stateChecksumHex: "abc",
        pendingConfirmCount: 1,
      }),
    ).toBe("frame 5 · 16ms lockstep · state abc · confirm backlog 1");
  });

  it("supplement line includes RTT and checksum state", () => {
    expect(
      netplayRelayTrustSupplementLine({
        rttMs: 12,
        peerLevel: 2,
        peerWins: 5,
        checksumAligned: true,
      }),
    ).toContain("relay RTT ~12ms");
    expect(
      netplayRelayTrustSupplementLine({
        rttMs: null,
        peerLevel: null,
        peerWins: null,
        checksumAligned: false,
      }),
    ).toContain("mismatch");
  });

  it("supplement line uses peer display label when set", () => {
    const s = netplayRelayTrustSupplementLine({
      rttMs: null,
      peerLevel: 1,
      peerWins: 2,
      peerDisplayLabel: "Rival",
      checksumAligned: null,
    });
    expect(s).toContain("Rival");
  });

  it("desync recovery line only on mismatch", () => {
    expect(netplayRelayDesyncRecoveryLine(null)).toBeNull();
    expect(netplayRelayDesyncRecoveryLine(true)).toBeNull();
    expect(netplayRelayDesyncRecoveryLine(false)?.length).toBeGreaterThan(20);
  });

  it("merges status into aria string", () => {
    const s = netplayRelayAriaDescription({
      status: "open",
      slot: 0,
      lockstepFrame: 3,
      tickMs: 16,
      stateChecksumHex: "abc",
    });
    expect(s).toContain("Netplay relay open");
    expect(s).toContain("frame 3");
    expect(s).toContain("state abc");
  });
});
