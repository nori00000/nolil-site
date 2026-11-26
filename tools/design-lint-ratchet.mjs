#!/usr/bin/env node
// Ratchet for `designmd lint` warnings. Lint errors still fail (exit 1).
// Warnings are fingerprinted as rule::path and compared with
// design/lint-baseline.json: a new or more frequent fingerprint fails, fewer
// warnings pass with a note to tighten the baseline (--update-baseline).
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const LINTER = fileURLToPath(new URL("../node_modules/@google/design.md/dist/index.js", import.meta.url));
const USAGE = "Usage: node tools/design-lint-ratchet.mjs [--design <path>] [--baseline <path>] [--report <lint-json>] [--update-baseline]";

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
  const args = { design: "DESIGN.md", baseline: "design/lint-baseline.json", report: null, updateBaseline: false };
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

function run(argv) {
  const args = parseArgs(argv);
  const report = lintReport(args);
  const lines = [];
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
    writeFileSync(args.baseline, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), warnings: current }, null, 2) + "\n");
    lines.push(`Lint baseline written to ${args.baseline}`);
    return { code: 0, out: lines.join("\n") };
  }
  let baseline;
  try {
    baseline = JSON.parse(readFileSync(args.baseline, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") throw new Error(`Lint baseline ${args.baseline} not found. Create it with: node tools/design-lint-ratchet.mjs --update-baseline`);
    throw new Error(`Lint baseline ${args.baseline} is unreadable: ${err.message}`);
  }
  const warnings = baseline && baseline.warnings;
  if (!warnings || typeof warnings !== "object" || Object.values(warnings).some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error(`Lint baseline ${args.baseline} is invalid: warnings must map fingerprints to non-negative integers`);
  }
  const { added, removed } = compareWarnings(current, warnings);
  for (const a of added) lines.push(`NEW WARNING ${a.fingerprint}: count ${a.count} > baseline ${a.baseline}`);
  for (const r of removed) lines.push(`fixed ${r.fingerprint}: count ${r.count} < baseline ${r.baseline}`);
  if (removed.length) lines.push("Note: warnings dropped below the baseline; tighten it with: node tools/design-lint-ratchet.mjs --update-baseline");
  lines.push(added.length ? `FAIL: ${added.length} new lint warning(s)` : "PASS: no new lint warnings");
  return { code: added.length ? 1 : 0, out: lines.join("\n") };
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
