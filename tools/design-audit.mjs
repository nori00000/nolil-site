#!/usr/bin/env node
// Design drift audit: checks the site's CSS against the DESIGN.md front matter.
// Hard errors (token-mismatch, undocumented-token, broken front matter) always fail.
// Deviations (color-literal, radius, duration, font-size) are ratcheted against
// design/audit-baseline.json: new values or higher counts fail, lower counts pass.
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from "node:fs";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const CATEGORIES = ["color-literal", "radius", "duration", "font-size"];
const REQUIRED_KEYS = ["colors", "typography", "rounded"];
const DEFAULT_CSS = ["index.html", "tokens.css"];
const DEFAULT_BASELINE = "design/audit-baseline.json";
const DEFAULT_DESIGN = "DESIGN.md";
const COLOR_VALUE = /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch)\(.*\))$/i;
const HEX_LITERAL = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;
const TIME_LITERAL = /(?<![\w.-])(\d*\.?\d+)(ms|s)(?![\w-])/gi;
const RADIUS_IGNORED = new Set(["0", "50%", "inherit"]);

// ---------- normalisation ----------

export function normalizeColor(value) {
  const v = String(value).toLowerCase().replace(/\s+/g, "");
  const hex = /^#([0-9a-f]{3,4})$/.exec(v);
  if (hex) return "#" + [...hex[1]].map((c) => c + c).join("");
  return v;
}

export function normalizeDuration(value) {
  const m = /^(\d*\.?\d+)(ms|s)$/i.exec(String(value).trim());
  if (!m) throw new Error(`Not a duration: ${value}`);
  const ms = m[2].toLowerCase() === "s" ? Number(m[1]) * 1000 : Number(m[1]);
  return `${Number(ms.toFixed(3))}ms`;
}

function normalizeLength(value) {
  const m = /^(-?\d*\.?\d+)([a-z%]*)$/i.exec(String(value).trim());
  if (!m) return String(value).trim().toLowerCase();
  return `${Number(m[1])}${m[2].toLowerCase()}`;
}

// ---------- DESIGN.md ----------

export function parseDesign(text) {
  const fail = (message) => ({ design: null, errors: [{ type: "design-front-matter", message }] });
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!m) return fail("DESIGN.md has no YAML front matter block delimited by ---");
  let data;
  try {
    data = YAML.parse(m[1]);
  } catch (err) {
    return fail(`DESIGN.md front matter is not valid YAML: ${err.message}`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return fail("DESIGN.md front matter is not a mapping");
  }
  const errors = REQUIRED_KEYS.filter(
    (k) => !data[k] || typeof data[k] !== "object" || Array.isArray(data[k]),
  ).map((k) => ({ type: "design-front-matter", message: `DESIGN.md front matter is missing required key "${k}"` }));
  if (errors.length) return { design: null, errors };

  const colors = {};
  const resolve = (name, seen = new Set()) => {
    const raw = data.colors[name];
    if (typeof raw !== "string") throw new Error(`colors.${name} is not a string`);
    const ref = /^\{colors\.([^}]+)\}$/.exec(raw.trim());
    if (!ref) return raw;
    if (seen.has(name) || !(ref[1] in data.colors)) throw new Error(`colors.${name} has an unresolvable reference ${raw}`);
    seen.add(name);
    return resolve(ref[1], seen);
  };
  for (const name of Object.keys(data.colors)) {
    try {
      colors[name] = resolve(name);
    } catch (err) {
      errors.push({ type: "design-front-matter", message: err.message });
    }
  }
  if (errors.length) return { design: null, errors };

  const uniq = (arr) => [...new Set(arr)];
  const design = {
    colors,
    colorValues: new Set(Object.values(colors).map(normalizeColor)),
    rounded: uniq(Object.values(data.rounded).map((v) => normalizeLength(v))),
    fontSizes: uniq(
      Object.values(data.typography)
        .filter((t) => t && t.fontSize !== undefined)
        .map((t) => normalizeLength(t.fontSize)),
    ),
    durations: uniq(
      Object.values(data.motion && typeof data.motion === "object" ? data.motion : {})
        .filter((t) => t && t.duration !== undefined)
        .map((t) => normalizeDuration(t.duration)),
    ),
  };
  return { design, errors: [] };
}

// ---------- CSS ----------

export function extractStyleBlocks(html) {
  return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
}

// Index of the first char in `chars` at paren depth 0, outside strings; -1 if none.
function scanTo(text, start, chars) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0 && chars.includes(c)) return i;
  }
  return -1;
}

function matchingBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const next = scanTo(text, i, "{}");
    if (next === -1) break;
    depth += text[next] === "{" ? 1 : -1;
    if (depth === 0) return next;
    i = next;
  }
  throw new Error(`Unbalanced braces in CSS near: ${text.slice(open, open + 60)}`);
}

function parseDeclarations(body) {
  const out = [];
  let i = 0;
  while (i < body.length) {
    let end = scanTo(body, i, ";");
    if (end === -1) end = body.length;
    const decl = body.slice(i, end);
    const colon = decl.indexOf(":");
    if (colon > 0) {
      const prop = decl.slice(0, colon).trim();
      const value = decl.slice(colon + 1).replace(/!\s*important\s*$/i, "").trim();
      out.push({ prop: prop.startsWith("--") ? prop : prop.toLowerCase(), value });
    }
    i = end + 1;
  }
  return out;
}

export function parseCss(css, atRules = [], out = []) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  while (i < text.length) {
    const stop = scanTo(text, i, "{;}");
    if (stop === -1 || text[stop] !== "{") {
      if (stop === -1) break;
      i = stop + 1; // at-statement such as @import, or stray terminator
      continue;
    }
    const prelude = text.slice(i, stop).trim();
    const close = matchingBrace(text, stop);
    const body = text.slice(stop + 1, close);
    if (prelude.startsWith("@") && body.includes("{")) {
      parseCss(body, [...atRules, prelude], out);
    } else {
      const parts = prelude.split(",").map((s) => s.trim());
      out.push({
        selector: prelude,
        atRules,
        topLevel: atRules.length === 0,
        isRoot: parts.every((s) => s.startsWith(":root")),
        isExactRoot: parts.every((s) => s === ":root"),
        declarations: parseDeclarations(body),
      });
    }
    i = close + 1;
  }
  return out;
}

// Split a value on whitespace/commas/slashes at paren depth 0.
function topLevelTokens(value) {
  const tokens = [];
  let depth = 0;
  let cur = "";
  for (const c of value) {
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (depth === 0 && /[\s,/]/.test(c)) {
      if (cur) tokens.push(cur);
      cur = "";
    } else cur += c;
  }
  if (cur) tokens.push(cur);
  return tokens;
}

// ---------- audit ----------

export function emptyDeviations() {
  return Object.fromEntries(CATEGORIES.map((c) => [c, {}]));
}

export function auditSources(design, sources) {
  const errors = [];
  const deviations = emptyDeviations();
  const bump = (cat, value) => {
    deviations[cat][value] = (deviations[cat][value] || 0) + 1;
  };
  const roundedSet = new Set(design.rounded);
  const durationSet = new Set(design.durations);
  const fontSizeSet = new Set(design.fontSizes);

  for (const src of sources) {
    for (const rule of parseCss(src.css)) {
      if (rule.isRoot) {
        if (!(rule.isExactRoot && rule.topLevel)) continue;
        for (const { prop, value } of rule.declarations) {
          if (!prop.startsWith("--")) continue;
          const name = prop.slice(2);
          if (Object.hasOwn(design.colors, name)) {
            if (normalizeColor(value) !== normalizeColor(design.colors[name])) {
              errors.push({
                type: "token-mismatch",
                token: name,
                file: src.file,
                cssValue: value,
                designValue: design.colors[name],
                message: `--${name} is "${value}" in ${src.file} but colors.${name} is "${design.colors[name]}" in DESIGN.md`,
              });
            }
          } else if (src.kind === "html" && COLOR_VALUE.test(value.trim())) {
            errors.push({
              type: "undocumented-token",
              token: name,
              file: src.file,
              cssValue: value,
              message: `--${name}: ${value} in ${src.file} :root has no colors.${name} token in DESIGN.md`,
            });
          }
        }
        continue;
      }
      for (const { prop, value } of rule.declarations) {
        const literalValue = value.replace(/url\([^)]*\)/gi, "").replace(/"[^"]*"|'[^']*'/g, "");
        for (const m of literalValue.matchAll(HEX_LITERAL)) {
          const hex = normalizeColor(m[0]);
          if (!design.colorValues.has(hex)) bump("color-literal", hex);
        }
        if (/^border(-[a-z]+)*-radius$/.test(prop) && !value.includes("var(")) {
          for (const token of topLevelTokens(value)) {
            const v = normalizeLength(token);
            if (RADIUS_IGNORED.has(token.trim().toLowerCase()) || v === "0" || v === "0px") continue;
            if (!roundedSet.has(v)) bump("radius", v);
          }
        }
        if (/^(transition|animation)(-|$)/.test(prop)) {
          for (const m of literalValue.matchAll(TIME_LITERAL)) {
            const d = normalizeDuration(m[0]);
            if (!durationSet.has(d)) bump("duration", d);
          }
        }
        if (prop === "font-size" && /^\d*\.?\d+px$/i.test(value.trim())) {
          const v = normalizeLength(value);
          if (!fontSizeSet.has(v)) bump("font-size", v);
        }
      }
    }
  }
  for (const cat of CATEGORIES) deviations[cat] = sortObject(deviations[cat]);
  return { errors, deviations };
}

function sortObject(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}

export function compareToBaseline(current, baseline) {
  const regressions = [];
  const improvements = [];
  for (const category of CATEGORIES) {
    const cur = current[category] || {};
    const base = (baseline && baseline[category]) || {};
    for (const value of Object.keys(cur).sort()) {
      const b = base[value] || 0;
      if (cur[value] > b) regressions.push({ category, value, count: cur[value], baseline: b });
    }
    for (const value of Object.keys(base).sort()) {
      const c = cur[value] || 0;
      if (c < base[value]) improvements.push({ category, value, count: c, baseline: base[value] });
    }
  }
  return { regressions, improvements };
}

// ---------- CLI ----------

export function parseArgs(argv) {
  const args = { css: [], baseline: DEFAULT_BASELINE, design: DEFAULT_DESIGN, json: false, updateBaseline: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].startsWith("--") && argv[i].includes("=") ? argv[i].split(/=(.*)/s, 2) : [argv[i], undefined];
    const takeValue = () => {
      if (inline !== undefined) return inline;
      const next = argv[++i];
      if (next === undefined || next.startsWith("--")) throw new Error(`Option ${flag} requires a value`);
      return next;
    };
    switch (flag) {
      case "--css": args.css.push(takeValue()); break;
      case "--baseline": args.baseline = takeValue(); break;
      case "--design": args.design = takeValue(); break;
      case "--json": args.json = true; break;
      case "--update-baseline": args.updateBaseline = true; break;
      case "--help": case "-h": args.help = true; break;
      default: throw new Error(`Unknown option: ${argv[i]}`);
    }
  }
  if (args.css.length === 0) args.css = [...DEFAULT_CSS];
  return args;
}

const USAGE = `Usage: node tools/design-audit.mjs [--css <path>]... [--baseline <path>] [--design <path>] [--json] [--update-baseline]`;

function loadSources(paths) {
  return paths.map((file) => {
    const text = readFileSync(file, "utf8");
    const kind = /\.html?$/i.test(file) ? "html" : "css";
    return { file, kind, css: kind === "html" ? extractStyleBlocks(text) : text };
  });
}

function gitCommit() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null; // not a git checkout; recorded as null in the baseline
  }
}

function totals(deviations) {
  return Object.fromEntries(
    CATEGORIES.map((c) => [c, Object.values(deviations[c] || {}).reduce((a, b) => a + b, 0)]),
  );
}

export function run(argv) {
  const lines = [];
  const args = parseArgs(argv);
  if (args.help) return { code: 0, stdout: USAGE };

  const parsed = parseDesign(readFileSync(args.design, "utf8"));
  let errors = parsed.errors;
  let deviations = emptyDeviations();
  if (parsed.design) {
    const audit = auditSources(parsed.design, loadSources(args.css));
    errors = audit.errors;
    deviations = audit.deviations;
  }

  let regressions = [];
  let improvements = [];
  let baselineNote = null;
  if (args.updateBaseline) {
    if (errors.length) {
      baselineNote = "Baseline not written: hard errors must be fixed first (they are never baselined).";
    } else {
      const baseline = {
        generatedAt: new Date().toISOString().slice(0, 10),
        commit: gitCommit(),
        cssFiles: args.css,
        totals: totals(deviations),
        deviations,
      };
      mkdirSync(dirname(args.baseline), { recursive: true });
      writeFileSync(args.baseline, JSON.stringify(baseline, null, 2) + "\n");
      baselineNote = `Baseline written to ${args.baseline}`;
    }
  } else {
    let baseline;
    try {
      baseline = JSON.parse(readFileSync(args.baseline, "utf8"));
    } catch (err) {
      if (err.code === "ENOENT") {
        throw new Error(`Baseline ${args.baseline} not found. Create it with: npm run design:audit -- --update-baseline`);
      }
      throw new Error(`Baseline ${args.baseline} is unreadable: ${err.message}`);
    }
    ({ regressions, improvements } = compareToBaseline(deviations, baseline.deviations));
  }

  const failed = errors.length > 0 || regressions.length > 0;
  const summary = {
    status: failed ? "fail" : "pass",
    errors: errors.length,
    regressions: regressions.length,
    improvements: improvements.length,
    totals: totals(deviations),
    cssFiles: args.css,
    baseline: args.baseline,
    note: baselineNote,
  };

  if (args.json) {
    return { code: failed ? 1 : 0, stdout: JSON.stringify({ errors, deviations, regressions, improvements, summary }, null, 2) };
  }

  lines.push(`Design audit (${args.design} vs ${args.css.join(", ")})`);
  lines.push(`Deviation totals: ${CATEGORIES.map((c) => `${c}=${summary.totals[c]}`).join(", ")}`);
  for (const e of errors) lines.push(`ERROR ${e.type}: ${e.message}`);
  for (const r of regressions) {
    lines.push(`REGRESSION ${r.category} ${r.value}: count ${r.count} > baseline ${r.baseline}`);
  }
  if (improvements.length) {
    for (const r of improvements) lines.push(`improved ${r.category} ${r.value}: count ${r.count} < baseline ${r.baseline}`);
    lines.push("Note: counts dropped below the baseline; tighten it with: npm run design:audit -- --update-baseline");
  }
  if (baselineNote) lines.push(baselineNote);
  lines.push(failed ? `FAIL: ${errors.length} error(s), ${regressions.length} regression(s)` : "PASS: no hard errors and no new deviations");
  return { code: failed ? 1 : 0, stdout: lines.join("\n") };
}

const isMain = (() => {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isMain) {
  try {
    const { code, stdout } = run(process.argv.slice(2));
    console.log(stdout);
    process.exitCode = code;
  } catch (err) {
    console.error(`design-audit: ${err.message}`);
    if (/Unknown option|requires a value/.test(err.message)) console.error(USAGE);
    process.exitCode = /Unknown option|requires a value/.test(err.message) ? 2 : 1;
  }
}
