import { describe, expect, it } from "vitest";
import {
  FUTURE_UPGRADE_CATALOG,
  type ImplementationStatus,
} from "./futureUpgrades";

const STATUSES: ImplementationStatus[] = ["shipped", "planned", "in_progress"];

describe("futureUpgrades catalog", () => {
  it("every entry has an explicit implementation status", () => {
    expect(FUTURE_UPGRADE_CATALOG.length).toBeGreaterThan(10);
    for (const e of FUTURE_UPGRADE_CATALOG) {
      expect(
        e.implementation,
        `${e.id} should set implementation (shipped | planned | in_progress)`,
      ).toBeDefined();
      expect(STATUSES).toContain(e.implementation);
    }
  });

  it("phase-3 backlog items that stay ground-only / rollback are honestly marked planned", () => {
    const air = FUTURE_UPGRADE_CATALOG.find((x) => x.id === "air_or_lane_variant");
    const rb = FUTURE_UPGRADE_CATALOG.find((x) => x.id === "rollback_netcode");
    expect(air?.implementation).toBe("planned");
    expect(rb?.implementation).toBe("planned");
  });
});
