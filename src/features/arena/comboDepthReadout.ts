/**
 * HUD copy for active combo chain depth (BP-35) — mirrors {@link FighterState.comboChainDepth}.
 * Depth advances on clean hits within the chain gap window (see `comboChainConfig`).
 */

export type ComboDepthHudCopy = {
  visible: boolean;
  displayLine: string;
  srLine: string;
};

export function activeComboDepthSummary(
  p1Depth: number,
  p2Depth: number,
): ComboDepthHudCopy {
  if (p1Depth < 1 && p2Depth < 1) {
    return { visible: false, displayLine: "", srLine: "" };
  }
  return {
    visible: true,
    displayLine: `Chain depth · P1 ×${p1Depth} · P2 ×${p2Depth}`,
    srLine:
      `Active combo chain depth from the simulation: Player 1 ${p1Depth}, Player 2 ${p2Depth}. ` +
      `Depth rises on clean hits inside the chain timing window.`,
  };
}
