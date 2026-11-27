import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeColor,
  normalizeDuration,
  parseDesign,
  collectDeclarations,
  extractHtml,
  auditSources,
  compareToBaseline,
  validateBaseline,
  parseArgs,
} from "./design-audit.mjs";

const TOOL = fileURLToPath(new URL("./design-audit.mjs", import.meta.url));

const DESIGN = `---
name: Test
colors:
  primary: "{colors.teal}"
  teal: "#015e5c"
  mint: "#eef6ef"
  white: "#ffffff"
  line: "rgba(59,74,54,.16)"
  ember-500: "oklch(0.68 0.17 55)"
typography:
  body-md:
    fontFamily: Pretendard
    fontSize: 17px
  title-md:
    fontSize: 24px
  display:
    fontSize: 76px
  display-sm:
    fontSize: 40px
rounded:
  sm: 8px
  full: 999px
spacing:
  page-max: 1180px
motion:
  state-change:
    duration: 160ms
    delay: 0ms
    timingFunction: ease
  state-change-emphasis:
    duration: 160ms
    timingFunction: ease-out
  reveal:
    duration: 720ms
    timingFunction: ease
---

# Body
`;

const CONFIG = {
  primaryPage: "index.html",
  extraCss: ["tokens.css"],
  exclude: ["node_modules/"],
  requiredColorVars: { "index.html": ["teal"], "tokens.css": ["ember-500"] },
  spacingAliases: { "page-max": "max" },
};

const design = () => {
  const result = parseDesign(DESIGN);
  assert.deepEqual(result.errors, []);
  return result.design;
};

const ROOT_OK = ":root{--teal:#015e5c;--max:1180px}";
const TOKENS_OK = ":root{--ember-500:oklch(0.68 0.17 55)}";
const page = (css, extra = "") => `<html><head><style>${ROOT_OK}${css}</style></head><body>${extra}</body></html>`;
const sources = (indexHtml, more = []) => [
  { file: "index.html", text: indexHtml },
  { file: "tokens.css", text: TOKENS_OK },
  ...more,
];
const audit = (indexHtml, more) => auditSources(design(), sources(indexHtml, more), CONFIG);
const values = (deviations, category) =>
  Object.entries(deviations[category]).map(([fp, n]) => [fp.split("::").pop(), n]);
const errorTypes = (result) => result.errors.map((e) => `${e.type}:${e.token ?? e.variable ?? ""}`);

test("normalizeColor treats equal numbers and comma/space syntax as equal without merging distinct values", () => {
  assert.equal(normalizeColor("#FFF"), "#ffffff");
  assert.equal(normalizeColor("#AbCd"), "#aabbccdd");
  assert.equal(normalizeColor("rgba(59,74,54,.16)"), normalizeColor("rgba(59, 74, 54, 0.16)"));
  assert.equal(normalizeColor("rgba(59,74,54,.16)"), normalizeColor("rgb(59 74 54 / 0.16)"));
  assert.equal(normalizeColor("OKLCH(0.68  0.17 55)"), normalizeColor("oklch(.68 .17 55)"));
  assert.notEqual(normalizeColor("oklch(0.68 0.17 55)"), normalizeColor("oklch(0.68 0.175 5)"));
  assert.notEqual(normalizeColor("rgb(1 2 3)"), normalizeColor("rgb(12 3)"));
});

test("normalizeDuration converts seconds to milliseconds", () => {
  assert.equal(normalizeDuration(".16s"), "160ms");
  assert.equal(normalizeDuration("1.5s"), "1500ms");
  assert.equal(normalizeDuration("240ms"), "240ms");
});

test("parseDesign resolves references, collects scales and motion pairs, and reports broken front matter", () => {
  const d = design();
  assert.equal(d.colors.primary, "#015e5c");
  assert.deepEqual(d.rounded, ["8px", "999px"]);
  assert.deepEqual(d.durations, ["160ms", "720ms"]);
  assert.deepEqual([...d.motionPairs].sort(), ["160ms ease", "160ms ease-out", "720ms ease"]);
  assert.equal(d.spacing["page-max"], "1180px");

  const missing = parseDesign("---\ncolors:\n  a: '#000'\n---\n");
  assert.deepEqual(missing.errors.map((e) => e.type), ["design-front-matter", "design-front-matter"]);
  assert.equal(parseDesign("# none").errors[0].type, "design-front-matter");
  assert.equal(parseDesign("---\ncolors: [\n---\n").errors[0].type, "design-front-matter");
});

test("collectDeclarations handles nesting, at-rules inside rules and :root-prefixed descendant selectors", () => {
  const decls = collectDeclarations(`
    /* .gone{color:red} */
    :root{--teal:#015e5c}
    .x{color:red; @media (width<500px){font-size:99px} & .y{border-radius:3px}}
    @media (max-width:500px){ :root{--teal:#000} }
    :root[data-theme="dark"] .icon{display:block}
  `);
  const show = decls.map((d) => [d.atRules.join("|"), d.selector, d.prop, d.value]);
  assert.deepEqual(show, [
    ["", ":root", "--teal", "#015e5c"],
    ["", ".x", "color", "red"],
    ["@media (width<500px)", ".x", "font-size", "99px"],
    ["", ".x .y", "border-radius", "3px"],
    ["@media (max-width:500px)", ":root", "--teal", "#000"],
    ["", ':root[data-theme="dark"] .icon', "display", "block"],
  ]);
});

test("extractHtml ignores commented-out and script content and collects inline style attributes", () => {
  const { css, inline } = extractHtml(
    `<!-- <style>.x{color:#abcdef}</style> --><style>a{color:#123456}</style>` +
      `<script>const s = '<style>.y{color:#654321}</style><p style="color:red">';</script>` +
      `<p class="note" style="text-align:center;color:#222222">x</p>`,
  );
  assert.equal(css.trim(), "a{color:#123456}");
  assert.deepEqual(inline, [{ context: 'p.note[style]', css: "text-align:center;color:#222222" }]);
});

test("color-literal collects hex, colour functions and named colours outside :root", () => {
  const r = audit(
    page(
      `a{color:#FFF;background:#123} b{color:hotpink;background:rgb(1 2 3);border:1px solid #015E5C}` +
        `c{background:url(x.svg#abc);font-family:Georgia} d{box-shadow:0 1px 2px rgba(59, 74, 54, 0.16);color:white}`,
      `<p style="color:#abcdef">x</p>`,
    ),
  );
  assert.deepEqual(r.errors, []);
  assert.deepEqual(values(r.deviations, "color-literal").sort(), [
    ["#112233", 1],
    ["#abcdef", 1],
    ["hotpink", 1],
    ["rgb(1 2 3)", 1],
  ]);
});

test("radius counts literal parts of shorthands, including next to var()", () => {
  const r = audit(page(`a{border-radius:8px 14px 0 3px} b{border-radius:50%} c{border-radius:inherit} d{border-radius:var(--r) 93px} e{border-top-left-radius:2px}`));
  assert.deepEqual(values(r.deviations, "radius").sort(), [["14px", 1], ["2px", 1], ["3px", 1], ["93px", 1]]);
});

test("duration ignores delays; easing compares (duration, timing) pairs with motion tokens", () => {
  const r = audit(
    page(
      `a{transition:opacity 160ms ease-out 0ms, transform .16s ease} b{transition:color .16s linear}` +
        `c{animation:spin-2s 1.5s ease infinite} d{transition:opacity .2s ease .5s} e{animation:none}`,
    ),
  );
  assert.deepEqual(values(r.deviations, "duration").sort(), [["1500ms", 1], ["200ms", 1]]);
  assert.deepEqual(values(r.deviations, "easing"), [["160ms linear", 1]]);
});

test("font-size covers px values, font shorthand and clamp() bounds", () => {
  const r = audit(
    page(`a{font-size:17px} b{font-size:14.5px} c{font-size:clamp(40px,7vw,760px)} d{font-size:1.2rem} e{font:800 99px/1.2 serif} f{font-size:clamp(40px,7vw,76px)}`),
  );
  assert.deepEqual(values(r.deviations, "font-size").sort(), [["1.2rem", 1], ["14.5px", 1], ["760px", 1], ["99px", 1]]);
});

test("token-mismatch compares values numerically and flags real differences", () => {
  const same = audit(`<style>:root{--teal:#015E5C;--max:1180px;--line:rgba(59, 74, 54, 0.16)}</style>`);
  assert.deepEqual(same.errors, []);
  const diff = auditSources(design(), [
    { file: "index.html", text: page("") },
    { file: "tokens.css", text: ":root{--ember-500:oklch(0.68 0.175 5)}" },
  ], CONFIG);
  assert.deepEqual(errorTypes(diff), ["token-mismatch:ember-500"]);
});

test("deleting a required colour variable and using a variable the page cannot see are hard errors", () => {
  const other = { file: "group.html", text: "<style>:root{--teal:#015e5c}</style>" };
  const r = audit(`<style>:root{--max:1180px} .btn{background:var(--teal);color:var(--nope, red)}</style>`, [other]);
  assert.deepEqual(errorTypes(r).sort(), ["missing-token:teal", "undefined-var:teal"]);
});

test("conditional or attribute-scoped :root redefinitions of colour tokens are hard errors", () => {
  const media = audit(page(`@media (max-width:559px){:root{--teal:red}}`));
  assert.deepEqual(errorTypes(media), ["conditional-token-override:teal"]);
  const themed = audit(page(`:root[data-theme="dark"]{--teal:#000}`));
  assert.deepEqual(errorTypes(themed), ["conditional-token-override:teal"]);
});

test("spacing aliases are compared against CSS variables", () => {
  const r = audit(`<style>:root{--teal:#015e5c;--max:900px}</style>`);
  assert.deepEqual(errorTypes(r), ["token-mismatch:page-max"]);
});

test("undocumented colour tokens: hard in the primary page, ratcheted in tokens.css", () => {
  const html = audit(page(`:root{--sun:#f5e578;--pad:clamp(22px,4vw,48px);--serif:Georgia,serif}`));
  assert.deepEqual(errorTypes(html), ["undocumented-token:sun"]);
  const css = auditSources(design(), [
    { file: "index.html", text: page("") },
    { file: "tokens.css", text: `${TOKENS_OK}:root{--moss-900:oklch(0.22 0.06 150)}` },
  ], CONFIG);
  assert.deepEqual(css.errors, []);
  assert.deepEqual(Object.keys(css.deviations["undocumented-token"]), ["tokens.css:::root::--moss-900::oklch(0.22 0.06 150)"]);
});

test("other pages: token/alias drift and undefined variables are ratcheted, not hard errors", () => {
  const r = audit(page(""), [
    { file: "group.html", text: "<style>:root{--teal:#015e5c;--mint:#e6f2e7;--max:1120px} .c{accent-color:var(--moss-600)}</style>" },
  ]);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(Object.keys(r.deviations["page-token-mismatch"]).sort(), [
    "group.html:::root::--max::1120px",
    "group.html:::root::--mint::#e6f2e7",
  ]);
  assert.deepEqual(Object.keys(r.deviations["undefined-var"]), ["group.html::.c::accent-color::--moss-600"]);
  assert.equal(r.pageTotals["group.html"], 3);
});

test("fingerprints ignore selector and at-rule formatting, declaration order and rule order", () => {
  const a = audit(page(`.btn-kakao,.btn-copy{background:#fee500;color:#191600} @media (max-width:559px){.x > .y{border-radius:3px}} p:hover{font-size:13px}`));
  const b = audit(page(`\n\n@media (max-width: 559px) {\n  .x>.y { border-radius: 3px }\n}\np:hover{font-size:13px}\n.btn-copy , .btn-kakao {\n  color: #191600;\n  background: #FEE500;\n}`));
  assert.deepEqual(a.errors, []);
  assert.deepEqual(b.deviations, a.deviations);
  assert.ok(Object.keys(a.deviations["color-literal"]).includes("index.html::.btn-copy,.btn-kakao::color::#191600"));
});

test("selector normalisation leaves attribute values, strings and letter case untouched", () => {
  const spaced = audit(page(`[data-label="A + B"]{font-size:90rem}`));
  const tight = audit(page(`[data-label="A+B"]{font-size:90rem}`));
  assert.deepEqual(Object.keys(spaced.deviations["font-size"]), ['index.html::[data-label="A + B"]::font-size::90rem']);
  const { regressions, improvements } = compareToBaseline(tight.deviations, spaced.deviations);
  assert.equal(regressions.length, 1);
  assert.equal(improvements.length, 1);
  const upper = audit(page(`@container Farm (min-width:400px){.Card{font-size:90rem}}`));
  const lower = audit(page(`@container farm (min-width:400px){.card{font-size:90rem}}`));
  assert.notDeepEqual(Object.keys(upper.deviations["font-size"]), Object.keys(lower.deviations["font-size"]));
  assert.deepEqual(Object.keys(upper.deviations["font-size"]), ["index.html::@container Farm(min-width:400px) > .Card::font-size::90rem"]);
});

test("type selector case does not change fingerprints, class and id case does", () => {
  const lower = audit(page(`input[type=text], div > p:hover{border-radius:3px}`));
  const upper = audit(page(`INPUT[type=text], DIV > P:hover{border-radius:3px}`));
  assert.deepEqual(upper.deviations, lower.deviations);
  assert.deepEqual(Object.keys(lower.deviations.radius), ["index.html::div>p:hover,input[type=text]::border-radius::3px"]);
  const cls = audit(page(`.Card #Main{border-radius:3px}`));
  assert.deepEqual(Object.keys(cls.deviations.radius), ["index.html::.Card #Main::border-radius::3px"]);
});

test("named colours count as colour values for new custom properties", () => {
  const html = audit(page(`:root{--new:red}`));
  assert.deepEqual(errorTypes(html), ["undocumented-token:new"]);
  const css = auditSources(design(), [
    { file: "index.html", text: page("") },
    { file: "tokens.css", text: `${TOKENS_OK}:root{--new:red}` },
  ], CONFIG);
  assert.deepEqual(css.errors, []);
  assert.deepEqual(Object.keys(css.deviations["undocumented-token"]), ["tokens.css:::root::--new::red"]);
});

test("font-size also records rem and em sizes, including font shorthand and clamp() bounds", () => {
  const r = audit(page(`a{font-size:90rem} b{font:700 2em/1.2 serif} c{font-size:clamp(1rem,2vw,48px)} d{font-size:50%}`));
  assert.deepEqual(values(r.deviations, "font-size").sort(), [["1rem", 1], ["2em", 1], ["48px", 1], ["90rem", 1]]);
});

test("delay compares transition/animation delays with motion token delays", () => {
  const r = audit(
    page(
      `a{transition:opacity .16s ease .5s} b{transition-delay:9s} c{transition:opacity .16s ease 0ms} d{animation-delay:0s,250ms}` +
        `e{transition:opacity .16s ease}`,
    ),
  );
  assert.deepEqual(values(r.deviations, "delay").sort(), [["250ms", 1], ["500ms", 1], ["9000ms", 1]]);
  assert.deepEqual(values(r.deviations, "duration"), []);
});

test("compareToBaseline works on occurrence fingerprints, so moving a violation is a regression", () => {
  const baseline = { "font-size": { "index.html::.a::font-size::14px": 1, "index.html::.b::font-size::13px": 2 } };
  const current = { "font-size": { "index.html::.c::font-size::14px": 1, "index.html::.b::font-size::13px": 1 } };
  const { regressions, improvements } = compareToBaseline(current, baseline);
  assert.deepEqual(regressions, [{ category: "font-size", fingerprint: "index.html::.c::font-size::14px", count: 1, baseline: 0 }]);
  assert.deepEqual(improvements, [
    { category: "font-size", fingerprint: "index.html::.a::font-size::14px", count: 0, baseline: 1 },
    { category: "font-size", fingerprint: "index.html::.b::font-size::13px", count: 1, baseline: 2 },
  ]);
});

test("validateBaseline rejects non-integer or negative counts and unknown categories", () => {
  assert.deepEqual(validateBaseline({ deviations: { radius: { a: 1 } } }), []);
  assert.equal(validateBaseline({ deviations: { radius: { a: "typo" } } }).length, 1);
  assert.equal(validateBaseline({ deviations: { radius: { a: -1 } } }).length, 1);
  assert.equal(validateBaseline({ deviations: { radius: { a: 1.5 } } }).length, 1);
  assert.equal(validateBaseline({ deviations: { bogus: {} } }).length, 1);
  assert.equal(validateBaseline({}).length, 1);
});

test("parseArgs supports repeated --css, --replace and --against, and rejects unknown flags", () => {
  const args = parseArgs(["--css", "a.html", "--css=b.css", "--json", "--update-baseline", "--replace", "index.html=/tmp/x.html", "--against", "origin/main"]);
  assert.deepEqual(args.css, ["a.html", "b.css"]);
  assert.deepEqual(args.replace, { "index.html": "/tmp/x.html" });
  assert.equal(args.against, "origin/main");
  assert.equal(args.json, true);
  assert.equal(args.updateBaseline, true);
  assert.throws(() => parseArgs(["--nope"]), /Unknown option/);
  assert.throws(() => parseArgs(["--css"]), /requires a value/);
  assert.throws(() => parseArgs(["--replace", "x"]), /name=path/);
});

// ---------- real process runs in a throwaway git repository ----------

function fixtureRepo(indexHtml = page("a{font-size:14px}")) {
  const dir = mkdtempSync(join(tmpdir(), "design-audit-"));
  mkdirSync(join(dir, "design"));
  writeFileSync(join(dir, "DESIGN.md"), DESIGN);
  writeFileSync(join(dir, "design/audit-config.json"), JSON.stringify(CONFIG));
  writeFileSync(join(dir, "index.html"), indexHtml);
  writeFileSync(join(dir, "tokens.css"), TOKENS_OK);
  git(dir, "init", "-q");
  commitAll(dir, "fixture");
  return dir;
}
function git(dir, ...args) {
  return execFileSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", ...args], { cwd: dir, encoding: "utf8" });
}
function commitAll(dir, message) {
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "--allow-empty", "-m", message);
}
function cli(dir, ...args) {
  const r = spawnSync(process.execPath, [TOOL, ...args], { cwd: dir, encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

test("CLI: missing baseline fails, --update-baseline creates it, clean run exits 0, unknown flag exits 2", () => {
  const dir = fixtureRepo();
  const missing = cli(dir);
  assert.equal(missing.code, 1);
  assert.match(missing.out, /not found/);
  assert.equal(cli(dir, "--update-baseline").code, 0);
  const saved = JSON.parse(readFileSync(join(dir, "design/audit-baseline.json"), "utf8"));
  assert.deepEqual(Object.values(saved.deviations["font-size"]), [1]);
  const ok = cli(dir);
  assert.equal(ok.code, 0, ok.out);
  assert.equal(cli(dir, "--bogus").code, 2);
});

test("CLI: new deviation exits 1; improvement without tightening is stale-baseline until updated", () => {
  const dir = fixtureRepo();
  cli(dir, "--update-baseline");
  writeFileSync(join(dir, "index.html"), page("a{font-size:14px} b{font-size:13px}"));
  const worse = cli(dir, "--json");
  assert.equal(worse.code, 1);
  assert.equal(JSON.parse(worse.out).regressions[0].fingerprint, "index.html::b::font-size::13px");

  writeFileSync(join(dir, "index.html"), page(""));
  const better = cli(dir);
  assert.equal(better.code, 1);
  assert.match(better.out, /stale-baseline/);
  assert.equal(cli(dir, "--update-baseline").code, 0);
  assert.equal(cli(dir).code, 0);
});

test("CLI: a corrupt baseline count is a hard error", () => {
  const dir = fixtureRepo();
  cli(dir, "--update-baseline");
  const path = join(dir, "design/audit-baseline.json");
  const saved = JSON.parse(readFileSync(path, "utf8"));
  const fp = Object.keys(saved.deviations["font-size"])[0];
  saved.deviations["font-size"][fp] = "typo";
  writeFileSync(path, JSON.stringify(saved));
  const r = cli(dir);
  assert.equal(r.code, 1);
  assert.match(r.out, /baseline-invalid/);
});

test("CLI: hard errors refuse to write a baseline", () => {
  const dir = fixtureRepo(`<style>:root{--teal:#000000;--max:1180px}</style>`);
  const r = cli(dir, "--update-baseline");
  assert.equal(r.code, 1);
  assert.match(r.out, /token-mismatch/);
  assert.equal(existsSync(join(dir, "design/audit-baseline.json")), false);
});

test("CLI: --against fails on git errors, and on a schema change unless --allow-schema-migration", () => {
  const plain = mkdtempSync(join(tmpdir(), "design-audit-nogit-"));
  mkdirSync(join(plain, "design"));
  writeFileSync(join(plain, "DESIGN.md"), DESIGN);
  writeFileSync(join(plain, "design/audit-config.json"), JSON.stringify(CONFIG));
  writeFileSync(join(plain, "index.html"), page(""));
  writeFileSync(join(plain, "tokens.css"), TOKENS_OK);
  assert.equal(cli(plain, "--css", "index.html", "--css", "tokens.css", "--update-baseline").code, 0);
  const noGit = cli(plain, "--css", "index.html", "--css", "tokens.css", "--against", "HEAD");
  assert.equal(noGit.code, 1);
  assert.match(noGit.out, /git/);

  const dir = fixtureRepo();
  cli(dir, "--update-baseline");
  const path = join(dir, "design/audit-baseline.json");
  const current = JSON.parse(readFileSync(path, "utf8"));
  writeFileSync(path, JSON.stringify({ ...current, schemaVersion: 2 }));
  commitAll(dir, "old schema baseline");
  writeFileSync(path, JSON.stringify(current));
  const mismatch = cli(dir, "--against", "HEAD");
  assert.equal(mismatch.code, 1);
  assert.match(mismatch.out, /baseline-schema-mismatch/);
  assert.match(mismatch.out, /--allow-schema-migration/);
  const migrated = cli(dir, "--against", "HEAD", "--allow-schema-migration");
  assert.equal(migrated.code, 0, migrated.out);
  assert.match(migrated.out, /형식 이관: 비교 생략/);
});

test("CLI: a baseline written by another schema version must be regenerated", () => {
  const dir = fixtureRepo();
  cli(dir, "--update-baseline");
  const path = join(dir, "design/audit-baseline.json");
  writeFileSync(path, JSON.stringify({ ...JSON.parse(readFileSync(path, "utf8")), schemaVersion: 2 }));
  const r = cli(dir);
  assert.equal(r.code, 1);
  assert.match(r.out, /baseline-schema-mismatch/);
});

test("CLI: --against fails when the baseline was loosened relative to the ref, and skips when the ref has none", () => {
  const dir = fixtureRepo();
  const skipped = cli(dir, "--update-baseline");
  assert.equal(skipped.code, 0);
  const firstRun = cli(dir, "--against", "HEAD");
  assert.equal(firstRun.code, 0, firstRun.out);
  assert.match(firstRun.out, /has no design\/audit-baseline\.json; skipping/);

  commitAll(dir, "baseline");
  writeFileSync(join(dir, "index.html"), page("a{font-size:14px} b{font-size:13px}"));
  cli(dir, "--update-baseline");
  const loosened = cli(dir, "--against", "HEAD");
  assert.equal(loosened.code, 1);
  assert.match(loosened.out, /baseline-loosened/);
  assert.equal(cli(dir, "--against", "no-such-ref").code, 1);
});
