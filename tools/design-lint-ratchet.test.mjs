import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { warningFingerprints, compareWarnings } from "./design-lint-ratchet.mjs";

const TOOL = fileURLToPath(new URL("./design-lint-ratchet.mjs", import.meta.url));
const REPO = fileURLToPath(new URL("..", import.meta.url));

const report = (findings, errors = 0) => ({
  findings,
  summary: { errors, warnings: findings.filter((f) => f.severity === "warning").length, infos: 0 },
});
const warning = (rule, path) => ({ severity: "warning", rule, path, message: `${rule} at ${path}` });

function run(dir, reportObj, ...args) {
  const reportPath = join(dir, `report-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(reportPath, typeof reportObj === "string" ? reportObj : JSON.stringify(reportObj));
  const r = spawnSync(process.execPath, [TOOL, "--report", reportPath, "--baseline", join(dir, "lint-baseline.json"), ...args], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

test("warningFingerprints counts warnings by rule and path and ignores other severities", () => {
  const fp = warningFingerprints(
    report([
      warning("contrast-ratio", "components.a"),
      warning("contrast-ratio", "components.a"),
      warning("orphaned-tokens", "colors.mint"),
      { severity: "info", rule: "summary", path: "", message: "x" },
      { severity: "error", rule: "broken-ref", path: "components.b", message: "x" },
    ]),
  );
  assert.deepEqual(fp, { "contrast-ratio::components.a": 2, "orphaned-tokens::colors.mint": 1 });
});

test("compareWarnings reports added and removed fingerprints", () => {
  const { added, removed } = compareWarnings({ "a::x": 2, "b::y": 1 }, { "a::x": 1, "c::z": 1 });
  assert.deepEqual(added, [
    { fingerprint: "a::x", count: 2, baseline: 1 },
    { fingerprint: "b::y", count: 1, baseline: 0 },
  ]);
  assert.deepEqual(removed, [{ fingerprint: "c::z", count: 0, baseline: 1 }]);
});

test("CLI: missing baseline fails, update writes it, new warnings fail, fewer warnings fail as stale-baseline until updated", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-ratchet-"));
  const base = report([warning("orphaned-tokens", "colors.mint")]);
  const missing = run(dir, base);
  assert.equal(missing.code, 1);
  assert.match(missing.out, /not found/);
  assert.equal(run(dir, base, "--update-baseline").code, 0);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, "lint-baseline.json"), "utf8")).warnings, { "orphaned-tokens::colors.mint": 1 });
  assert.equal(run(dir, base).code, 0);

  const worse = run(dir, report([warning("orphaned-tokens", "colors.mint"), warning("contrast-ratio", "components.x")]));
  assert.equal(worse.code, 1);
  assert.match(worse.out, /NEW WARNING contrast-ratio::components.x/);

  const better = run(dir, report([]));
  assert.equal(better.code, 1);
  assert.match(better.out, /stale-baseline/);
  assert.equal(run(dir, report([]), "--update-baseline").code, 0);
  assert.equal(run(dir, report([])).code, 0);
});

test("CLI: linter errors and unreadable reports fail; unknown flags exit 2", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-ratchet-"));
  run(dir, report([]), "--update-baseline");
  const errors = run(dir, report([{ severity: "error", rule: "broken-ref", path: "components.b", message: "bad ref" }], 1));
  assert.equal(errors.code, 1);
  assert.match(errors.out, /bad ref/);
  assert.equal(run(dir, "not json").code, 1);
  assert.equal(run(dir, report([]), "--bogus").code, 2);
});

test("CLI: errors refuse to write a baseline", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-ratchet-"));
  const r = run(dir, report([{ severity: "error", rule: "broken-ref", path: "c", message: "bad" }], 1), "--update-baseline");
  assert.equal(r.code, 1);
  assert.equal(existsSync(join(dir, "lint-baseline.json")), false);
});

test("CLI: runs the real linter on the repository DESIGN.md", () => {
  const dir = mkdtempSync(join(tmpdir(), "lint-ratchet-"));
  const r = spawnSync(process.execPath, [TOOL, "--baseline", join(dir, "b.json"), "--update-baseline"], { cwd: REPO, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const saved = JSON.parse(readFileSync(join(dir, "b.json"), "utf8"));
  assert.ok(Object.keys(saved.warnings).length > 0);
});

function gitRepo() {
  const dir = mkdtempSync(join(tmpdir(), "lint-ratchet-git-"));
  mkdirSync(join(dir, "design"));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  return dir;
}
function commitAll(dir, message) {
  const git = (...a) => execFileSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", ...a], { cwd: dir });
  git("add", "-A");
  git("commit", "-q", "--allow-empty", "-m", message);
}
function runIn(dir, reportObj, ...args) {
  const reportPath = join(dir, "report.json");
  writeFileSync(reportPath, JSON.stringify(reportObj));
  const r = spawnSync(process.execPath, [TOOL, "--report", reportPath, ...args], { cwd: dir, encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

test("CLI --against: skips when the ref has no lint baseline, fails when the baseline was loosened", () => {
  const dir = gitRepo();
  commitAll(dir, "empty");
  const one = report([warning("orphaned-tokens", "colors.mint")]);
  assert.equal(runIn(dir, one, "--update-baseline").code, 0);
  const first = runIn(dir, one, "--against", "HEAD");
  assert.equal(first.code, 0, first.out);
  assert.match(first.out, /has no design\/lint-baseline\.json; skipping/);

  commitAll(dir, "baseline");
  const two = report([warning("orphaned-tokens", "colors.mint"), warning("contrast-ratio", "components.x")]);
  assert.equal(runIn(dir, two, "--update-baseline").code, 0);
  assert.equal(runIn(dir, two).code, 0);
  const loosened = runIn(dir, two, "--against", "HEAD");
  assert.equal(loosened.code, 1);
  assert.match(loosened.out, /baseline-loosened contrast-ratio::components.x/);
});

test("CLI --against: git failures and schema mismatches fail", () => {
  const plain = mkdtempSync(join(tmpdir(), "lint-ratchet-nogit-"));
  const r0 = report([]);
  assert.equal(runIn(plain, r0, "--baseline", join(plain, "b.json"), "--update-baseline").code, 0);
  const noGit = runIn(plain, r0, "--baseline", join(plain, "b.json"), "--against", "HEAD");
  assert.equal(noGit.code, 1);
  assert.match(noGit.out, /git/);

  const dir = gitRepo();
  writeFileSync(join(dir, "design/lint-baseline.json"), JSON.stringify({ warnings: {} }));
  commitAll(dir, "unversioned lint baseline");
  assert.equal(runIn(dir, r0, "--update-baseline").code, 0);
  const mismatch = runIn(dir, r0, "--against", "HEAD");
  assert.equal(mismatch.code, 1);
  assert.match(mismatch.out, /baseline-schema-mismatch/);
});
