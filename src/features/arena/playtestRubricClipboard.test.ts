import { describe, expect, it } from "vitest";
import { buildPlaytestRubricClipboardText } from "./playtestRubricClipboard";

describe("playtestRubricClipboard", () => {
  it("includes rubric ids and anti-goals", () => {
    const t = buildPlaytestRubricClipboardText();
    expect(t).toContain("T1");
    expect(t).toContain("T6");
    expect(t).toContain("Anti-goals");
    expect(t.length).toBeGreaterThan(400);
  });
});
