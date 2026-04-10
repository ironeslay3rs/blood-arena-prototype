import {
  PLAYTEST_ANTI_GOALS,
  PLAYTEST_RUBRIC,
  PLAYTEST_SESSION_GUIDANCE,
} from "./playtestRubric";

/** Plain-text worksheet for session note-taking (clipboard export). */
export function buildPlaytestRubricClipboardText(): string {
  const blocks: string[] = [
    "Blood Arena — playtest session worksheet",
    "",
    PLAYTEST_SESSION_GUIDANCE,
    "",
  ];
  for (const row of PLAYTEST_RUBRIC) {
    blocks.push(`${row.id} — ${row.title}`);
    blocks.push(row.prompt);
    blocks.push("Pass: [ ]   Notes:");
    blocks.push("");
  }
  blocks.push("Anti-goals (confirm you did not ship these traps):");
  for (const line of PLAYTEST_ANTI_GOALS) {
    blocks.push(`- [ ] ${line}`);
  }
  return blocks.join("\n");
}
