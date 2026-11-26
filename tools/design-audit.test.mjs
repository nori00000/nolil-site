import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeColor,
  normalizeDuration,
  parseCss,
  parseDesign,
  extractStyleBlocks,
  auditSources,
  compareToBaseline,
  parseArgs,
} from "./design-audit.mjs";

const DESIGN = `---
name: Test
colors:
  primary: "{colors.teal}"
  teal: "#015e5c"
  white: "#ffffff"
  line: "rgba(59,74,54,.16)"
  ember-500: "oklch(0.68 0.17 55)"
typography:
  body-md:
    fontFamily: Pretendard
    fontSize: 17px
  title-md:
    fontSize: 24px
rounded:
  sm: 8px
  full: 999px
motion:
  state-change:
    duration: 160ms
  reveal:
    duration: 720ms
---

# Body
`;

const design = () => {
  const result = parseDesign(DESIGN);
  assert.deepEqual(result.errors, []);
  return result.design;
};

const css = (text, file = "index.html", kind = "html") => [{ file, kind, css: text }];

test("normalizeColor lowercases, strips whitespace and expands short hex", () => {
  assert.equal(normalizeColor("#FFF"), "#ffffff");
  assert.equal(normalizeColor("#fff"), normalizeColor("#ffffff"));
  assert.equal(normalizeColor("#AbCd"), "#aabbccdd");
  assert.equal(normalizeColor(" rgba(59, 74, 54, .16) "), "rgba(59,74,54,.16)");
  assert.equal(normalizeColor("oklch(0.68 0.17 55)"), "oklch(0.680.1755)");
  assert.equal(normalizeColor("OKLCH(0.68  0.17 55)"), normalizeColor("oklch(0.68 0.17 55)"));
  assert.notEqual(normalizeColor("rgba(59,74,54,0.16)"), normalizeColor("rgba(59,74,54,.16)"));
});

test("normalizeDuration converts seconds to milliseconds", () => {
  assert.equal(normalizeDuration(".16s"), "160ms");
  assert.equal(normalizeDuration("1.5s"), "1500ms");
  assert.equal(normalizeDuration("240ms"), "240ms");
  assert.equal(normalizeDuration("0.0005s"), "0.5ms");
});

test("parseDesign resolves colour references and reports missing keys", () => {
  const d = design();
  assert.equal(d.colors.primary, "#015e5c");
  assert.deepEqual(d.rounded, ["8px", "999px"]);
  assert.deepEqual(d.durations, ["160ms", "720ms"]);
  assert.deepEqual(d.fontSizes, ["17px", "24px"]);

  const missing = parseDesign("---\ncolors:\n  a: '#000'\n---\n");
  assert.deepEqual(
    missing.errors.map((e) => e.type),
    ["design-front-matter", "design-front-matter"],
  );
  assert.match(missing.errors[0].message, /typography/);

  assert.equal(parseDesign("# no front matter").errors[0].type, "design-front-matter");
  assert.equal(parseDesign("---\ncolors: [\n---\n").errors[0].type, "design-front-matter");
});

test("extractStyleBlocks returns only <style> contents", () => {
  const html = `<html><style>a{color:#fff}</style><p>#123456</p><style media="x">b{color:#000}</style>`;
  assert.equal(extractStyleBlocks(html), "a{color:#fff}\nb{color:#000}");
});

test("parseCss separates :root blocks from other rules, including nested at-rules", () => {
  const rules = parseCss(`
    /* :root{--x:#000} */
    :root{--teal:#015e5c;--pad:clamp(22px,4vw,48px)}
    a{color:#123;background:url("x.svg#y")}
    @media (max-width:500px){ :root{--teal:#000} b{border-radius:3px} }
    @keyframes k{ from{opacity:0} to{opacity:1} }
  `);
  const roots = rules.filter((r) => r.isRoot);
  assert.equal(roots.length, 2);
  assert.equal(roots[0].topLevel, true);
  assert.equal(roots[1].topLevel, false);
  assert.deepEqual(roots[0].declarations, [
    { prop: "--teal", value: "#015e5c" },
    { prop: "--pad", value: "clamp(22px,4vw,48px)" },
  ]);
  const other = rules.filter((r) => !r.isRoot).map((r) => r.selector);
  assert.deepEqual(other, ["a", "b", "from", "to"]);
});

test("color-literal counts unknown hex outside :root only", () => {
  const { deviations, errors } = auditSources(
    design(),
    css(`:root{--teal:#015e5c} a{color:#FFF;background:#123} b{color:#112233;border:1px solid #015E5C} c{background:url(x.svg#abc)}`),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(deviations["color-literal"], { "#112233": 2 });
});

test("radius splits shorthand and ignores 0, 50%, inherit and tokens", () => {
  const { deviations } = auditSources(
    design(),
    css(`a{border-radius:8px 14px 0 3px} b{border-radius:50%} c{border-radius:inherit} d{border-radius:14px/20px} e{border-top-left-radius:2px} f{border-radius:var(--r)}`),
  );
  assert.deepEqual(deviations.radius, { "14px": 2, "20px": 1, "2px": 1, "3px": 1 });
});

test("duration normalises transition and animation times against motion tokens", () => {
  const { deviations } = auditSources(
    design(),
    css(`a{transition:transform .16s ease-out,opacity .2s ease} b{animation:spin-2s 1.5s ease infinite} c{transition-duration:720ms} d{animation:none}`),
  );
  assert.deepEqual(deviations.duration, { "1500ms": 1, "200ms": 1 });
});

test("font-size counts px values that are not typography sizes and skips clamp", () => {
  const { deviations } = auditSources(
    design(),
    css(`a{font-size:17px} b{font-size:14.5px} c{font-size:clamp(20px,2vw,30px)} d{font-size:1.2rem} e{font-size:14.5px !important}`),
  );
  assert.deepEqual(deviations["font-size"], { "14.5px": 2 });
});

test("deviations inside :root are not counted", () => {
  const { deviations } = auditSources(design(), css(`:root{--teal:#015e5c;--x:14px}`));
  assert.deepEqual(deviations, { "color-literal": {}, radius: {}, duration: {}, "font-size": {} });
});

test("token-mismatch fires when a :root custom property disagrees with DESIGN.md", () => {
  const ok = auditSources(design(), css(`:root{--teal:#015E5C;--white:#fff;--line:rgba(59, 74, 54, .16)}`));
  assert.deepEqual(ok.errors, []);
  const tokens = auditSources(design(), css(`:root{--ember-500:oklch(0.68 0.17 56)}`, "tokens.css", "css"));
  assert.equal(tokens.errors.length, 1);
  assert.equal(tokens.errors[0].type, "token-mismatch");
  assert.equal(tokens.errors[0].token, "ember-500");
  assert.equal(tokens.errors[0].file, "tokens.css");
});

test("undocumented-token fires only for colour-valued custom properties in HTML :root", () => {
  const html = auditSources(
    design(),
    css(`:root{--teal:#015e5c;--sun:#f5e578;--veil:rgba(0,0,0,.5);--pad:clamp(22px,4vw,48px);--serif:Georgia,serif;--hue:hsl(10 20% 30%);--ok:oklch(0.5 0.1 10)}`),
  );
  assert.deepEqual(
    html.errors.map((e) => [e.type, e.token]),
    [
      ["undocumented-token", "sun"],
      ["undocumented-token", "veil"],
      ["undocumented-token", "hue"],
      ["undocumented-token", "ok"],
    ],
  );
  const tokensCss = auditSources(design(), css(`:root{--moss-900:oklch(0.22 0.06 150)}`, "tokens.css", "css"));
  assert.deepEqual(tokensCss.errors, []);
});

test("compareToBaseline flags new values and increased counts, notes decreases", () => {
  const baseline = { radius: { "14px": 4, "3px": 1 }, "font-size": { "13px": 8 } };
  const current = {
    "color-literal": { "#112233": 1 },
    radius: { "14px": 5, "3px": 1 },
    duration: {},
    "font-size": { "13px": 6 },
  };
  const { regressions, improvements } = compareToBaseline(current, baseline);
  assert.deepEqual(regressions, [
    { category: "color-literal", value: "#112233", count: 1, baseline: 0 },
    { category: "radius", value: "14px", count: 5, baseline: 4 },
  ]);
  assert.deepEqual(improvements, [{ category: "font-size", value: "13px", count: 6, baseline: 8 }]);

  const removed = compareToBaseline({ radius: {} }, { radius: { "3px": 1 } });
  assert.deepEqual(removed.regressions, []);
  assert.deepEqual(removed.improvements, [{ category: "radius", value: "3px", count: 0, baseline: 1 }]);
});

test("parseArgs supports repeated --css and rejects unknown flags", () => {
  const args = parseArgs(["--css", "a.html", "--css=b.css", "--json", "--update-baseline", "--baseline", "x.json"]);
  assert.deepEqual(args.css, ["a.html", "b.css"]);
  assert.equal(args.json, true);
  assert.equal(args.updateBaseline, true);
  assert.equal(args.baseline, "x.json");
  assert.deepEqual(parseArgs([]).css, ["index.html", "tokens.css"]);
  assert.throws(() => parseArgs(["--nope"]), /Unknown option/);
  assert.throws(() => parseArgs(["--css"]), /requires a value/);
});
