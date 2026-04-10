import { describe, expect, it } from "vitest";
import {
  PLAYTEST_RUBRIC,
  PLAYTEST_SESSION_GUIDANCE,
} from "./playtestRubric";

describe("playtestRubric", () => {
  it("covers T1–T6 with substantive prompts", () => {
    expect(PLAYTEST_RUBRIC).toHaveLength(6);
    const ids = PLAYTEST_RUBRIC.map((x) => x.id);
    expect(ids).toEqual(["T1", "T2", "T3", "T4", "T5", "T6"]);
    for (const row of PLAYTEST_RUBRIC) {
      expect(row.title.length).toBeGreaterThan(2);
      expect(row.prompt.length).toBeGreaterThan(40);
    }
  });

  it("session guidance is non-empty", () => {
    expect(PLAYTEST_SESSION_GUIDANCE.length).toBeGreaterThan(20);
  });
});
