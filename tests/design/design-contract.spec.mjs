import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import YAML from "yaml";

// DESIGN.md component contract, checked against the browser's computed styles.
// Every DESIGN.md component and motion token must have an entry in the maps
// below; the coverage test fails otherwise, so a token cannot silently go
// unchecked. Component property mapping:
//   backgroundColor -> background-color, textColor -> color,
//   typography -> font-family (first family), font-size, font-weight,
//                 line-height, letter-spacing (only the keys the token sets),
//   rounded -> all four border radii, padding -> padding (four sides, or
//   left/right when paddingAxis is "inline"), height -> min-height,
//   width -> max-width.
// Colours are compared by letting the same page compute the token value on a
// probe element, so rgb()/oklch() serialisation differences do not matter.
//
// Every target is an element that exists in the real markup (hidden elements
// such as the analytics consent buttons still get computed styles). No probe
// markup is injected.
//
// Linked pages (group.html, program/index.html) differ from DESIGN.md already;
// their current computed values are frozen in design/page-contracts.json so
// that they cannot drift further unnoticed.
//
// DESIGN_CONTRACT_REPLACE="index.html=/abs/copy.html;group.html=/abs/other.html"
// serves those files in place of the named pages, so a tampered copy can be
// checked without editing the real page.

const DESIGN = parseFrontMatter(readFileSync(new URL("../../DESIGN.md", import.meta.url), "utf8"));
const PAGE_CONTRACTS = JSON.parse(readFileSync(new URL("../../design/page-contracts.json", import.meta.url), "utf8"));

const VIEWPORTS = {
  "desktop-1280": { width: 1280, height: 800 },
  "tablet-768": { width: 768, height: 1024 },
  "mobile-375": { width: 375, height: 812 },
};
const ALL = Object.keys(VIEWPORTS);
const DESKTOP = ["desktop-1280"];
const TABLET = ["tablet-768"];
const MOBILE = ["mobile-375"];
const WIDE = ["desktop-1280", "tablet-768"];
const NARROW = ["tablet-768", "mobile-375"];

const COMPONENT_TARGETS = {
  "body-copy": { viewports: ALL, selector: "body" },
  "section-lead": { viewports: ALL, selector: "#farm-rules .section-head p" },
  "card-title": { viewports: ALL, selector: "#farm-rules .person-card strong" },
  "card-text": { viewports: ALL, selector: "#farm-rules .person-card p" },
  hero: { viewports: WIDE, selector: "header.hero" },
  "hero-mobile": { viewports: MOBILE, selector: "header.hero" },
  "hero-title": { viewports: DESKTOP, selector: ".hero h1" },
  "hero-title-tablet": { viewports: TABLET, selector: ".hero h1" },
  "hero-title-mobile": { viewports: MOBILE, selector: ".hero h1" },
  "section-heading": { viewports: DESKTOP, selector: "#farm-rules h2" },
  "section-heading-mobile": { viewports: NARROW, selector: "#farm-rules h2" },
  "section-heading-on-dark": { viewports: DESKTOP, selector: "#group-inquiry h2" },
  "section-heading-on-dark-mobile": { viewports: NARROW, selector: "#group-inquiry h2" },
  eyebrow: { viewports: ALL, selector: "#farm-rules .eyebrow" },
  "eyebrow-on-dark": { viewports: ALL, selector: "#group-inquiry .eyebrow" },
  "band-dark": { viewports: ALL, selector: "#group-inquiry" },
  "button-primary": { viewports: ALL, selector: "#group-inquiry .btn-primary" },
  "button-primary-hover": { viewports: DESKTOP, selector: "#group-inquiry .btn-primary", state: "hover" },
  "button-contact": { viewports: ALL, selector: "#officialPhone" },
  "button-consent": { viewports: ALL, selector: "#analyticsAccept" },
  "button-consent-line": { viewports: ALL, selector: "#analyticsReject" },
  "button-hero": { viewports: MOBILE, selector: "#mobileCtaBar .btn-hero" },
  "button-hero-primary": { viewports: ALL, selector: ".hero .btn-primary" },
  "nav-link": { viewports: WIDE, selector: ".site-links a:nth-child(2)" },
  "nav-cta": { viewports: MOBILE, selector: ".site-links a:first-child" },
  "page-container": { viewports: DESKTOP, selector: "#farm-rules > .wrap", paddingAxis: "inline" },
  "page-container-tablet": { viewports: TABLET, selector: "#farm-rules > .wrap", paddingAxis: "inline" },
  "page-container-mobile": { viewports: MOBILE, selector: "#farm-rules > .wrap", paddingAxis: "inline" },
};

const MOTION_TARGETS = {
  "state-change": { viewports: ALL, selector: "#group-inquiry .btn-primary" },
  "state-change-emphasis": { viewports: ALL, selector: ".hero .btn-primary" },
  reveal: { viewports: ALL, selector: "#farm-rules" },
};

function parseFrontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!m) throw new Error("DESIGN.md has no YAML front matter");
  return YAML.parse(m[1]);
}

function resolveRef(value, seen = []) {
  if (typeof value !== "string") return value;
  const ref = /^\{([a-z]+)\.([^}]+)\}$/.exec(value.trim());
  if (!ref) return value;
  const [, group, name] = ref;
  if (!DESIGN[group] || !(name in DESIGN[group]) || seen.includes(value)) {
    throw new Error(`Unresolvable DESIGN.md reference ${value}`);
  }
  return resolveRef(DESIGN[group][name], [...seen, value]);
}

// Expected values for one component, with every reference resolved.
function expectationsFor(name) {
  const component = DESIGN.components[name];
  const out = {};
  for (const [key, raw] of Object.entries(component)) {
    const value = resolveRef(raw);
    out[key] = key === "typography" ? { ...value } : String(value);
  }
  return out;
}

function replacements() {
  const spec = process.env.DESIGN_CONTRACT_REPLACE;
  if (!spec) return [];
  return spec.split(";").filter(Boolean).map((pair) => {
    const at = pair.indexOf("=");
    if (at <= 0) throw new Error(`DESIGN_CONTRACT_REPLACE entry "${pair}" is not name=path`);
    return { name: pair.slice(0, at), body: readFileSync(pair.slice(at + 1), "utf8") };
  });
}

async function preparePage(page, viewport, path = "index.html") {
  await page.setViewportSize(VIEWPORTS[viewport]);
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());
  for (const { name, body } of replacements()) {
    await page.route(
      (url) => url.pathname === `/${name}`,
      (route) => route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body }),
    );
  }
  await page.goto(`/${path}`, { waitUntil: "load" });
}

function measureMotion(page, targets) {
  return page.evaluate((targets) => {
    const toMs = (t) => (t.endsWith("ms") ? parseFloat(t) : parseFloat(t) * 1000);
    const problems = [];
    for (const { name, selector, duration, delay, timingFunction } of targets) {
      const el = document.querySelector(selector);
      if (!el) {
        problems.push(`${name}: no element for ${selector}`);
        continue;
      }
      const cs = getComputedStyle(el);
      const durations = cs.transitionDuration.split(",").map((s) => toMs(s.trim()));
      const timings = cs.transitionTimingFunction.split(",").map((s) => s.trim());
      const delays = cs.transitionDelay.split(",").map((s) => toMs(s.trim()));
      delays.forEach((d, i) => {
        if (Math.abs(d - toMs(delay)) > 0.01) problems.push(`${name}: ${selector} transition-delay[${i}] is ${d}ms, token ${delay}`);
      });
      durations.forEach((d, i) => {
        if (Math.abs(d - toMs(duration)) > 0.01) problems.push(`${name}: ${selector} transition-duration[${i}] is ${d}ms, token ${duration}`);
      });
      timings.forEach((t, i) => {
        if (t !== timingFunction) problems.push(`${name}: ${selector} transition-timing-function[${i}] is ${t}, token ${timingFunction}`);
      });
    }
    return problems;
  }, targets);
}

function measureComponents(page, checks) {
  return page.evaluate((checks) => {
    const probeColor = (value) => {
      const probe = document.createElement("div");
      probe.style.color = value;
      if (!probe.style.color) return `invalid colour ${value}`;
      document.body.appendChild(probe);
      const computed = getComputedStyle(probe).color;
      probe.remove();
      return computed;
    };
    const px = (v) => (v === "normal" ? 0 : parseFloat(v));
    const close = (a, b) => Math.abs(a - b) < 0.06;
    const expand = (v) => {
      const p = String(v).trim().split(/\s+/);
      return [p[0], p[1] ?? p[0], p[2] ?? p[0], p[3] ?? p[1] ?? p[0]];
    };
    const problems = [];
    for (const { name, selector, expected, paddingAxis } of checks) {
      const el = document.querySelector(selector);
      if (!el) {
        problems.push(`${name}: no element for ${selector}`);
        continue;
      }
      const cs = getComputedStyle(el);
      const report = (prop, actual, want) => problems.push(`${name}: ${selector} ${prop} is ${actual}, DESIGN.md says ${want}`);
      for (const [key, want] of Object.entries(expected)) {
        if (key === "backgroundColor" || key === "textColor") {
          const actual = key === "backgroundColor" ? cs.backgroundColor : cs.color;
          if (actual !== probeColor(want)) report(key, actual, `${want} (= ${probeColor(want)})`);
        } else if (key === "typography") {
          const fontSize = px(cs.fontSize);
          if (want.fontFamily !== undefined) {
            const first = cs.fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
            if (first !== String(want.fontFamily)) report("font-family", first, want.fontFamily);
          }
          if (want.fontSize !== undefined && !close(fontSize, parseFloat(want.fontSize))) report("font-size", cs.fontSize, want.fontSize);
          if (want.fontWeight !== undefined && cs.fontWeight !== String(want.fontWeight)) report("font-weight", cs.fontWeight, want.fontWeight);
          if (want.lineHeight !== undefined) {
            const target = String(want.lineHeight).endsWith("px") ? parseFloat(want.lineHeight) : Number(want.lineHeight) * fontSize;
            if (cs.lineHeight === "normal" || !close(px(cs.lineHeight), target)) report("line-height", cs.lineHeight, `${want.lineHeight} (= ${target.toFixed(2)}px)`);
          }
          if (want.letterSpacing !== undefined) {
            const ls = String(want.letterSpacing);
            const target = ls.endsWith("em") ? parseFloat(ls) * fontSize : parseFloat(ls);
            if (!close(px(cs.letterSpacing), target)) report("letter-spacing", cs.letterSpacing, `${ls} (= ${target.toFixed(2)}px)`);
          }
        } else if (key === "rounded") {
          for (const corner of ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"]) {
            if (cs[corner] !== want) report(corner, cs[corner], want);
          }
        } else if (key === "padding") {
          const sides = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];
          if (paddingAxis === "inline") {
            if (sides[1] !== want || sides[3] !== want) report("padding-inline", `${sides[3]} / ${sides[1]}`, want);
          } else {
            const target = expand(want);
            if (sides.join(" ") !== target.join(" ")) report("padding", sides.join(" "), target.join(" "));
          }
        } else if (key === "height") {
          if (cs.minHeight !== want) report("min-height", cs.minHeight, want);
        } else if (key === "width") {
          if (cs.maxWidth !== want) report("max-width", cs.maxWidth, want);
        } else {
          problems.push(`${name}: DESIGN.md property ${key} has no computed-style mapping in this spec`);
        }
      }
    }
    return problems;
  }, checks);
}

test("DESIGN.md components and motion tokens are all mapped to page targets", () => {
  const components = Object.keys(DESIGN.components || {});
  expect(components.filter((n) => !(n in COMPONENT_TARGETS)), "DESIGN.md components without a target").toEqual([]);
  expect(Object.keys(COMPONENT_TARGETS).filter((n) => !components.includes(n)), "targets without a DESIGN.md component").toEqual([]);
  const motion = Object.keys(DESIGN.motion || {});
  expect(motion.filter((n) => !(n in MOTION_TARGETS)), "motion tokens without a target").toEqual([]);
  expect(Object.keys(MOTION_TARGETS).filter((n) => !motion.includes(n)), "motion targets without a token").toEqual([]);
});

for (const viewport of ALL) {
  test(`DESIGN.md tokens match computed styles at ${viewport}`, async ({ page }) => {
    await preparePage(page, viewport);
    const problems = [];

    const motionChecks = Object.entries(MOTION_TARGETS)
      .filter(([name, t]) => t.viewports.includes(viewport) && DESIGN.motion?.[name])
      .map(([name, t]) => ({
        name,
        selector: t.selector,
        duration: String(DESIGN.motion[name].duration),
        delay: String(DESIGN.motion[name].delay ?? "0ms"),
        timingFunction: String(DESIGN.motion[name].timingFunction),
      }));
    problems.push(...(await measureMotion(page, motionChecks)));

    // Read settled values: no transitions while hovering or measuring.
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none !important;animation:none !important}" });

    const checks = [];
    const hoverChecks = [];
    for (const [name, target] of Object.entries(COMPONENT_TARGETS)) {
      if (!target.viewports.includes(viewport) || !DESIGN.components?.[name]) continue;
      const check = { name, selector: target.selector, expected: expectationsFor(name), paddingAxis: target.paddingAxis };
      (target.state === "hover" ? hoverChecks : checks).push(check);
    }
    problems.push(...(await measureComponents(page, checks)));
    for (const check of hoverChecks) {
      await page.locator(check.selector).first().scrollIntoViewIfNeeded();
      await page.locator(check.selector).first().hover();
      problems.push(...(await measureComponents(page, [check])));
    }

    expect(problems, `computed styles that disagree with DESIGN.md at ${viewport}`).toEqual([]);
  });
}

// Linked pages: current computed values frozen in design/page-contracts.json.
for (const [path, contract] of Object.entries(PAGE_CONTRACTS.pages)) {
  for (const viewport of contract.viewports) {
    test(`linked page ${path} keeps its frozen computed styles at ${viewport}`, async ({ page }) => {
      await preparePage(page, viewport, path);
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none !important;animation:none !important}" });
      const checks = contract.checks.map((c) => ({ ...c, expected: { ...c.expected, ...(c.byViewport?.[viewport] ?? {}) } }));
      const problems = await page.evaluate((checks) => {
        const out = [];
        for (const { name, selector, expected } of checks) {
          const el = document.querySelector(selector);
          if (!el) {
            out.push(`${name}: no element for ${selector}`);
            continue;
          }
          const cs = getComputedStyle(el);
          for (const [prop, want] of Object.entries(expected)) {
            if (cs[prop] !== want) out.push(`${name}: ${selector} ${prop} is ${cs[prop]}, page-contracts.json says ${want}`);
          }
        }
        return out;
      }, checks);
      expect(problems, `computed styles of ${path} that changed at ${viewport}`).toEqual([]);
    });
  }
}
