#!/usr/bin/env node
// Ratchet for `designmd lint` warnings. Lint errors still fail (exit 1).
// Warnings are fingerprinted as rule::path and compared with
// design/lint-baseline.json: a new or more frequent fingerprint fails, and a
// fixed one fails as stale-baseline until --update-baseline tightens it.
// --against <git-ref> also fails when the baseline itself was loosened
// relative to that ref.
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readJsonAtRef } from "./git-ref.mjs";

export const LINT_SCHEMA_VERSION = 1;

const LINTER = fileURLToPath(new URL("../node_modules/@google/design.md/dist/index.js", import.meta.url));
const USAGE = "Usage: node tools/design-lint-ratchet.mjs [--design <path>] [--baseline <path>] [--report <lint-json>] [--update-baseline] [--against <git-ref> [--allow-schema-migration]]";

export function warningFingerprints(report) {
  const out = {};
  for (const f of report.findings || []) {
    if (f.severity !== "warning") continue;
    const fp = `${f.rule}::${f.path}`;
    out[fp] = (out[fp] || 0) + 1;
  }
  return Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
}

export function compareWarnings(current, baseline) {
  const added = [];
  const removed = [];
  for (const fp of Object.keys(current).sort()) {
    const b = baseline[fp] || 0;
    if (current[fp] > b) added.push({ fingerprint: fp, count: current[fp], baseline: b });
  }
  for (const fp of Object.keys(baseline).sort()) {
    const c = current[fp] || 0;
    if (c < baseline[fp]) removed.push({ fingerprint: fp, count: c, baseline: baseline[fp] });
  }
  return { added, removed };
}

class UsageError extends Error {}

function parseArgs(argv) {
  const args = { design: "DESIGN.md", baseline: "design/lint-baseline.json", report: null, updateBaseline: false, against: null, allowSchemaMigration: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined || next.startsWith("--")) throw new UsageError(`Option ${flag} requires a value`);
      return next;
    };
    if (flag === "--design") args.design = value();
    else if (flag === "--baseline") args.baseline = value();
    else if (flag === "--report") args.report = value();
    else if (flag === "--update-baseline") args.updateBaseline = true;
    else if (flag === "--against") args.against = value();
    else if (flag === "--allow-schema-migration") args.allowSchemaMigration = true;
    else throw new UsageError(`Unknown option: ${flag}`);
  }
  return args;
}

function lintReport(args) {
  let text;
  if (args.report) {
    text = readFileSync(args.report, "utf8");
  } else {
    const r = spawnSync(process.execPath, [LINTER, "lint", args.design], { encoding: "utf8" });
    if (r.error) throw new Error(`cannot run designmd: ${r.error.message}`);
    text = r.stdout;
    if (r.status !== 0 && r.status !== 1) throw new Error(`designmd lint exited ${r.status}: ${r.stderr.trim()}`);
  }
  let report;
  try {
    report = JSON.parse(text);
  } catch (err) {
    throw new Error(`designmd lint output is not JSON: ${err.message}`);
  }
  if (!report || !Array.isArray(report.findings)) throw new Error("designmd lint output has no findings array");
  return report;
}

function validWarnings(baseline) {
  const warnings = baseline && baseline.warnings;
  return Boolean(warnings) && typeof warnings === "object" && !Array.isArray(warnings) && Object.values(warnings).every((n) => Number.isInteger(n) && n >= 0);
}

function readBaseline(path) {
  let baseline;
  try {
    baseline = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") throw new Error(`Lint baseline ${path} not found. Create it with: node tools/design-lint-ratchet.mjs --update-baseline`);
    throw new Error(`Lint baseline ${path} is unreadable: ${err.message}`);
  }
  if (!validWarnings(baseline)) throw new Error(`Lint baseline ${path} is invalid: warnings must map fingerprints to non-negative integers`);
  return baseline;
}

function run(argv) {
  const args = parseArgs(argv);
  const report = lintReport(args);
  const lines = [];
  const failures = [];
  const errors = report.findings.filter((f) => f.severity === "error");
  for (const e of errors) lines.push(`LINT ERROR ${e.rule} ${e.path}: ${e.message}`);
  const current = warningFingerprints(report);
  const total = Object.values(current).reduce((a, b) => a + b, 0);
  lines.push(`designmd lint: ${errors.length} error(s), ${total} warning(s)`);
  if (errors.length) {
    if (args.updateBaseline) lines.push("Baseline not written: fix lint errors first.");
    return { code: 1, out: lines.join("\n") };
  }

  if (args.updateBaseline) {
    mkdirSync(dirname(args.baseline), { recursive: true });
    const baseline = { schemaVersion: LINT_SCHEMA_VERSION, generatedAt: new Date().toISOString().slice(0, 10), warnings: current };
    writeFileSync(args.baseline, JSON.stringify(baseline, null, 2) + "\n");
    lines.push(`Lint baseline written to ${args.baseline}`);
  } else {
    const baseline = readBaseline(args.baseline);
    if (baseline.schemaVersion !== LINT_SCHEMA_VERSION) {
      failures.push(`baseline-schema-mismatch ${args.baseline} has schemaVersion ${baseline.schemaVersion ?? "(none)"}, this tool writes ${LINT_SCHEMA_VERSION}; regenerate it with --update-baseline`);
    } else {
      const { added, removed } = compareWarnings(current, baseline.warnings);
      for (const a of added) failures.push(`NEW WARNING ${a.fingerprint}: count ${a.count} > baseline ${a.baseline}`);
      for (const r of removed) lines.push(`fixed ${r.fingerprint}: count ${r.count} < baseline ${r.baseline}`);
      if (removed.length) failures.push(`stale-baseline: ${removed.length} baselined warning(s) were fixed; tighten the baseline with: node tools/design-lint-ratchet.mjs --update-baseline`);
    }
  }

  if (args.against) {
    const refBaseline = readJsonAtRef(args.against, args.baseline);
    if (refBaseline === undefined) {
      lines.push(`--against: ${args.against} has no ${args.baseline}; skipping the baseline-loosening check (first introduction).`);
    } else if (refBaseline.schemaVersion !== LINT_SCHEMA_VERSION) {
      const change = `${args.against} schemaVersion ${refBaseline.schemaVersion ?? "(none)"} -> current ${LINT_SCHEMA_VERSION}`;
      if (args.allowSchemaMigration) lines.push(`--against: 형식 이관: 비교 생략 (${change}).`);
      else failures.push(`baseline-schema-mismatch --against: ${change}; fingerprints cannot be compared. Review the baseline diff by hand, then rerun with --allow-schema-migration (deliberately not used in CI).`);
    } else {
      if (!validWarnings(refBaseline)) throw new Error(`--against: ${args.against}:${args.baseline} is invalid`);
      const current = readBaseline(args.baseline);
      for (const a of compareWarnings(current.warnings, refBaseline.warnings).added) {
        failures.push(`baseline-loosened ${a.fingerprint}: baseline allows ${a.count}, ${args.against} allowed ${a.baseline}`);
      }
    }
  }

  lines.push(...failures);
  lines.push(failures.length ? `FAIL: ${failures.length} problem(s)` : "PASS: no new lint warnings");
  return { code: failures.length ? 1 : 0, out: lines.join("\n") };
}

const isMain = (() => {
  try {
    return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isMain) {
  try {
    const { code, out } = run(process.argv.slice(2));
    console.log(out);
    process.exitCode = code;
  } catch (err) {
    console.error(`design-lint-ratchet: ${err.message}`);
    if (err instanceof UsageError) console.error(USAGE);
    process.exitCode = err instanceof UsageError ? 2 : 1;
  }
}
