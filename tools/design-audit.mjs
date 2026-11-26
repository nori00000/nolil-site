#!/usr/bin/env node
// Design drift audit: checks the site's CSS against the DESIGN.md front matter.
//
// Hard errors always fail and are never baselined: broken front matter,
// token-mismatch / conditional overrides / undocumented colour tokens in the
// primary page and CSS files, missing required token variables, var() uses with
// no definition anywhere (in the primary page and CSS files; other pages are
// ratcheted), and an invalid baseline file.
//
// Ratcheted deviations are recorded per occurrence fingerprint
// (file::context::property::value) in design/audit-baseline.json. A new or
// more frequent fingerprint fails; a fixed one fails as stale-baseline until the
// baseline is tightened with --update-baseline. --against <ref> also fails when
// the baseline itself was loosened relative to that git ref.
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from "node:fs";
import { dirname } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const CATEGORIES = ["color-literal", "radius", "duration", "easing", "font-size", "undocumented-token", "page-token-mismatch", "undefined-var"];
const REQUIRED_KEYS = ["colors", "typography", "rounded"];
const DEFAULTS = { baseline: "design/audit-baseline.json", design: "DESIGN.md", config: "design/audit-config.json" };
const COLOR_FUNCTIONS = ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color"];
const COLOR_VALUE = new RegExp(`^(#[0-9a-f]{3,8}|(${COLOR_FUNCTIONS.join("|")})\\(.*\\))$`, "i");
const HEX_LITERAL = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;
const TIME = /^(\d*\.?\d+)(ms|s)$/i;
const TIMING_KEYWORDS = new Set(["ease", "linear", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end"]);
const RADIUS_IGNORED = new Set(["0", "0px", "50%", "inherit"]);
const NO_COLOR_PROPS = new Set(["font-family", "font", "content", "animation-name", "transition-property", "will-change", "grid-template-areas", "grid-area", "counter-reset", "counter-increment", "quotes"]);

// CSS Color 4 named colours (excluding transparent/currentcolor keywords).
const NAMED_COLORS = Object.fromEntries(
  ("aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 " +
    "blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 " +
    "chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b " +
    "darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b " +
    "darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 darksalmon e9967a " +
    "darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f darkturquoise 00ced1 " +
    "darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 dodgerblue 1e90ff " +
    "firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 " +
    "goldenrod daa520 gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 hotpink ff69b4 " +
    "indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa lavenderblush fff0f5 lawngreen 7cfc00 " +
    "lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff lightgoldenrodyellow fafad2 lightgray d3d3d3 " +
    "lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 lightsalmon ffa07a lightseagreen 20b2aa lightskyblue 87cefa " +
    "lightslategray 778899 lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 " +
    "linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd mediumorchid ba55d3 " +
    "mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a mediumturquoise 48d1cc " +
    "mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 navajowhite ffdead " +
    "navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 " +
    "palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 " +
    "peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 red ff0000 " +
    "rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 " +
    "seashell fff5ee sienna a0522d silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 " +
    "snow fffafa springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 " +
    "turquoise 40e0d0 violet ee82ee wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32")
    .trim()
    .split(/\s+/)
    .reduce((pairs, word, i, all) => (i % 2 === 0 ? [...pairs, [word, `#${all[i + 1]}`]] : pairs), []),
);

// ---------- normalisation ----------

function normalizeNumber(token) {
  const m = /^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)([a-z%]*)$/i.exec(token);
  return m ? `${Number(m[1])}${m[2].toLowerCase()}` : token.toLowerCase();
}

export function normalizeColor(value) {
  const v = String(value).trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,4})$/.exec(v);
  if (hex) return "#" + [...hex[1]].map((c) => c + c).join("");
  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(v)) return v;
  if (NAMED_COLORS[v]) return NAMED_COLORS[v];
  const fn = /^([a-z-]+)\(([\s\S]*)\)$/.exec(v);
  if (!fn) return v.replace(/\s+/g, " ");
  const name = { rgba: "rgb", hsla: "hsl" }[fn[1]] ?? fn[1];
  const [main, alpha] = fn[2].split("/");
  let parts = main.split(/[\s,]+/).filter(Boolean).map(normalizeNumber);
  let a = alpha === undefined ? undefined : normalizeNumber(alpha.trim());
  if (a === undefined && (name === "rgb" || name === "hsl") && parts.length === 4) {
    a = parts[3];
    parts = parts.slice(0, 3);
  }
  return `${name}(${parts.join(" ")}${a === undefined ? "" : ` / ${a}`})`;
}

export function normalizeDuration(value) {
  const m = TIME.exec(String(value).trim());
  if (!m) throw new Error(`Not a duration: ${value}`);
  const ms = m[2].toLowerCase() === "s" ? Number(m[1]) * 1000 : Number(m[1]);
  return `${Number(ms.toFixed(3))}ms`;
}

function normalizeLength(value) {
  return normalizeNumber(String(value).trim());
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
  if (!data || typeof data !== "object" || Array.isArray(data)) return fail("DESIGN.md front matter is not a mapping");
  const errors = REQUIRED_KEYS.filter((k) => !data[k] || typeof data[k] !== "object" || Array.isArray(data[k])).map((k) => ({
    type: "design-front-matter",
    message: `DESIGN.md front matter is missing required key "${k}"`,
  }));
  if (errors.length) return { design: null, errors };

  const resolve = (group, name, seen = []) => {
    const raw = data[group]?.[name];
    if (raw === undefined || raw === null || typeof raw === "object") throw new Error(`${group}.${name} is not a scalar value`);
    const ref = /^\{([a-z]+)\.([^}]+)\}$/.exec(String(raw).trim());
    if (!ref) return String(raw);
    if (seen.includes(`${ref[1]}.${ref[2]}`)) throw new Error(`${group}.${name} has a circular reference ${raw}`);
    return resolve(ref[1], ref[2], [...seen, `${group}.${name}`]);
  };
  const colors = {};
  const spacing = {};
  for (const [group, target] of [["colors", colors], ["spacing", spacing]]) {
    for (const name of Object.keys(data[group] || {})) {
      try {
        target[name] = resolve(group, name);
      } catch (err) {
        errors.push({ type: "design-front-matter", message: err.message });
      }
    }
  }
  if (errors.length) return { design: null, errors };

  const uniq = (arr) => [...new Set(arr)];
  const motion = Object.values(data.motion && typeof data.motion === "object" ? data.motion : {}).filter((t) => t && t.duration !== undefined);
  const design = {
    colors,
    spacing,
    colorValues: new Set(Object.values(colors).map(normalizeColor)),
    rounded: uniq(Object.values(data.rounded).map(normalizeLength)),
    fontSizes: uniq(Object.values(data.typography).filter((t) => t && t.fontSize !== undefined).map((t) => normalizeLength(t.fontSize))),
    durations: uniq(motion.map((t) => normalizeDuration(t.duration))),
    motionPairs: new Set(motion.map((t) => `${normalizeDuration(t.duration)} ${String(t.timingFunction ?? "ease").trim()}`)),
  };
  return { design, errors: [] };
}

// ---------- CSS extraction ----------

export function extractHtml(html) {
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  const css = [...cleaned.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map((m) => m[1]).join("\n");
  const body = cleaned.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "");
  const inline = [];
  for (const tag of body.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    const attrs = tag[2];
    const style = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
    if (!style) continue;
    const id = /\sid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const cls = /\sclass\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const context = `${tag[1].toLowerCase()}${id ? `#${id[1]}` : ""}${cls ? `.${cls[1].trim().split(/\s+/).join(".")}` : ""}[style]`;
    inline.push({ context, css: style[1] ?? style[2] });
  }
  return { css, inline };
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

function splitTopLevel(text, separator) {
  const out = [];
  let i = 0;
  while (i <= text.length) {
    let end = scanTo(text, i, separator);
    if (end === -1) end = text.length;
    out.push(text.slice(i, end));
    i = end + 1;
  }
  return out;
}

function nestSelector(parent, child) {
  const parents = splitTopLevel(parent, ",").map((s) => s.trim());
  const children = splitTopLevel(child, ",").map((s) => s.trim());
  return parents.flatMap((p) => children.map((c) => (c.includes("&") ? c.replaceAll("&", p) : `${p} ${c}`))).join(", ");
}

function pushDeclaration(segment, ctx, out) {
  const colon = segment.indexOf(":");
  if (colon <= 0) return;
  const prop = segment.slice(0, colon).trim();
  const value = segment.slice(colon + 1).replace(/!\s*important\s*$/i, "").trim();
  if (!prop || /\s/.test(prop)) return;
  out.push({ selector: ctx.selector, atRules: ctx.atRules, prop: prop.startsWith("--") ? prop : prop.toLowerCase(), value });
}

// Flat list of declarations {selector, atRules, prop, value}, following native
// nesting and at-rules nested inside style rules.
export function collectDeclarations(css, ctx = { selector: null, atRules: [] }, out = []) {
  const text = ctx.selector === null && ctx.atRules.length === 0 ? css.replace(/\/\*[\s\S]*?\*\//g, "") : css;
  let i = 0;
  while (i < text.length) {
    const stop = scanTo(text, i, "{;}");
    if (stop === -1) {
      if (ctx.selector) pushDeclaration(text.slice(i), ctx, out);
      break;
    }
    if (text[stop] === ";") {
      if (ctx.selector) pushDeclaration(text.slice(i, stop), ctx, out);
      i = stop + 1;
      continue;
    }
    if (text[stop] === "}") {
      i = stop + 1;
      continue;
    }
    const prelude = text.slice(i, stop).trim();
    const close = matchingBrace(text, stop);
    const body = text.slice(stop + 1, close);
    if (prelude.startsWith("@")) {
      const atRules = [...ctx.atRules, prelude.replace(/\s+/g, " ")];
      if (/^@(-webkit-)?keyframes\b/i.test(prelude)) collectDeclarations(body, { selector: null, atRules }, out);
      else if (ctx.selector) collectDeclarations(body, { selector: ctx.selector, atRules }, out);
      else if (body.includes("{")) collectDeclarations(body, { selector: null, atRules }, out);
      else collectDeclarations(body, { selector: prelude, atRules: ctx.atRules }, out);
    } else {
      const selector = ctx.selector ? nestSelector(ctx.selector, prelude) : prelude.replace(/\s+/g, " ");
      collectDeclarations(body, { selector, atRules: ctx.atRules }, out);
    }
    i = close + 1;
  }
  return out;
}

const ROOT_PART = /^:root((\[[^\]]*\])|(:not\([^)]*\)))*$/;
function rootKind(selector) {
  const parts = splitTopLevel(selector, ",").map((s) => s.trim());
  if (parts.every((p) => p === ":root")) return "exact";
  if (parts.every((p) => ROOT_PART.test(p))) return "scoped";
  return null;
}

// ---------- value scanners ----------

function stripUrlsAndStrings(value) {
  return value.replace(/url\([^)]*\)/gi, " ").replace(/"[^"]*"|'[^']*'/g, " ");
}

function colorLiterals(value) {
  let rest = stripUrlsAndStrings(value);
  const found = [];
  const fnPattern = new RegExp(`(?<![\\w-])(${COLOR_FUNCTIONS.join("|")})\\(`, "gi");
  let m;
  while ((m = fnPattern.exec(rest))) {
    const start = m.index;
    let depth = 0;
    let end = start;
    for (let i = start + m[1].length; i < rest.length; i++) {
      if (rest[i] === "(") depth++;
      if (rest[i] === ")" && --depth === 0) {
        end = i;
        break;
      }
    }
    found.push(normalizeColor(rest.slice(start, end + 1)));
    rest = rest.slice(0, start) + " ".repeat(end + 1 - start) + rest.slice(end + 1);
    fnPattern.lastIndex = start;
  }
  for (const h of rest.matchAll(HEX_LITERAL)) found.push(normalizeColor(h[0]));
  rest = rest.replace(HEX_LITERAL, " ");
  for (const w of rest.matchAll(/(?<![\w-])([a-z]+)(?![\w-])/gi)) {
    if (NAMED_COLORS[w[1].toLowerCase()]) found.push(w[1].toLowerCase());
  }
  return found;
}

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

function pxSizes(token) {
  const t = token.trim().toLowerCase();
  if (/^\d*\.?\d+px$/.test(t)) return [normalizeLength(t)];
  const fn = /^(clamp|min|max)\((.*)\)$/.exec(t);
  if (fn) return splitTopLevel(fn[2], ",").map((s) => s.trim()).filter((s) => /^\d*\.?\d+px$/.test(s)).map(normalizeLength);
  return [];
}

function fontShorthandSize(value) {
  for (const token of value.split(/\s+/)) {
    const size = token.split("/")[0];
    if (/^\d*\.?\d+px$/i.test(size) || /^(clamp|min|max)\(/i.test(size)) return pxSizes(size);
  }
  return [];
}

function transitionLayers(prop, value) {
  if (/-(duration)$/.test(prop)) return splitTopLevel(value, ",").map((s) => ({ times: [s.trim()].filter((t) => TIME.test(t)), timing: null }));
  if (/-(delay|timing-function|property|name)$/.test(prop) || prop.endsWith("-iteration-count")) return [];
  return splitTopLevel(value, ",").map((layer) => {
    const tokens = topLevelTokens(layer);
    const times = tokens.filter((t) => TIME.test(t));
    const timing = tokens.find((t) => TIMING_KEYWORDS.has(t.toLowerCase()) || /^(cubic-bezier|steps|linear)\(/i.test(t));
    return { times, timing: timing ? timing.toLowerCase().replace(/\s+/g, "") : "ease" };
  });
}

function varUses(value) {
  const out = [];
  for (const m of value.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) out.push({ name: m[1], fallback: Boolean(m[2]) });
  return out;
}

// ---------- audit ----------

export function emptyDeviations() {
  return Object.fromEntries(CATEGORIES.map((c) => [c, {}]));
}

function sortObject(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}

function decodeSource({ file, text }) {
  if (!/\.html?$/i.test(file)) return { file, kind: "css", declarations: collectDeclarations(text) };
  const { css, inline } = extractHtml(text);
  const declarations = collectDeclarations(css);
  for (const { context, css: decls } of inline) collectDeclarations(`${context.replace(/[{}]/g, "")}{${decls}}`, undefined, declarations);
  return { file, kind: "html", declarations };
}

export function auditSources(design, rawSources, config) {
  const errors = [];
  const deviations = emptyDeviations();
  const pageTotals = {};
  const sources = rawSources.map(decodeSource);
  const record = (category, file, context, prop, value) => {
    const fp = `${file}::${context}::${prop}::${String(value).replace(/\s+/g, " ").trim()}`;
    deviations[category][fp] = (deviations[category][fp] || 0) + 1;
    pageTotals[file] = (pageTotals[file] || 0) + 1;
  };
  const roundedSet = new Set(design.rounded);
  const durationSet = new Set(design.durations);
  const fontSizeSet = new Set(design.fontSizes);
  const aliases = Object.entries(config.spacingAliases || {});
  // A page can use its own custom properties and those of the shared CSS files.
  const customProps = (s) => s.declarations.filter((d) => d.prop.startsWith("--")).map((d) => d.prop);
  const sharedProps = sources.filter((s) => s.kind === "css").flatMap(customProps);

  for (const src of sources) {
    pageTotals[src.file] = pageTotals[src.file] || 0;
    const strict = src.kind === "css" || src.file === config.primaryPage;
    const hard = (error) => errors.push({ file: src.file, ...error });
    const drift = (context, prop, value, message) => {
      if (strict) hard(message);
      else record("page-token-mismatch", src.file, context, prop, value);
    };

    const topRoot = new Set();
    const defined = new Set([...customProps(src), ...sharedProps]);
    for (const d of src.declarations) {
      const kind = rootKind(d.selector);
      const context = [...d.atRules, d.selector].join(" > ");
      for (const use of varUses(d.value)) {
        if (!use.fallback && !defined.has(use.name)) {
          if (strict) hard({ type: "undefined-var", variable: use.name.slice(2), message: `${src.file} ${context} { ${d.prop}: ${d.value} } uses ${use.name}, which neither the page nor a shared CSS file defines` });
          else record("undefined-var", src.file, context, d.prop, use.name);
        }
      }
      if (kind) {
        if (!d.prop.startsWith("--")) continue;
        const name = d.prop.slice(2);
        const conditional = kind !== "exact" || d.atRules.length > 0;
        if (!conditional) topRoot.add(name);
        if (Object.hasOwn(design.colors, name)) {
          if (normalizeColor(d.value) !== normalizeColor(design.colors[name])) {
            const type = conditional ? "conditional-token-override" : "token-mismatch";
            drift(context, d.prop, d.value, {
              type,
              token: name,
              cssValue: d.value,
              designValue: design.colors[name],
              message: `${src.file} ${context} sets --${name}: ${d.value} but colors.${name} is "${design.colors[name]}" in DESIGN.md`,
            });
          }
          continue;
        }
        const alias = aliases.find(([, cssName]) => cssName === name);
        if (alias) {
          const want = design.spacing[alias[0]];
          if (want === undefined) {
            hard({ type: "design-front-matter", message: `audit-config spacingAliases names spacing.${alias[0]}, which DESIGN.md does not define` });
          } else if (normalizeLength(d.value) !== normalizeLength(want)) {
            drift(context, d.prop, d.value, {
              type: conditional ? "conditional-token-override" : "token-mismatch",
              token: alias[0],
              cssValue: d.value,
              designValue: want,
              message: `${src.file} ${context} sets --${name}: ${d.value} but spacing.${alias[0]} is "${want}" in DESIGN.md`,
            });
          }
          continue;
        }
        if (COLOR_VALUE.test(d.value.trim())) {
          if (src.file === config.primaryPage) {
            hard({ type: "undocumented-token", token: name, cssValue: d.value, message: `--${name}: ${d.value} in ${src.file} ${context} has no colors.${name} token in DESIGN.md` });
          } else if (src.kind === "css") {
            record("undocumented-token", src.file, context, d.prop, d.value);
          }
        }
        continue;
      }

      if (!NO_COLOR_PROPS.has(d.prop)) {
        for (const color of colorLiterals(d.value)) {
          if (!design.colorValues.has(normalizeColor(color))) record("color-literal", src.file, context, d.prop, color);
        }
      }
      if (/^border(-[a-z]+)*-radius$/.test(d.prop)) {
        for (const token of topLevelTokens(d.value)) {
          if (/^var\(/i.test(token)) continue;
          const v = normalizeLength(token);
          if (RADIUS_IGNORED.has(token.trim().toLowerCase()) || RADIUS_IGNORED.has(v)) continue;
          if (!roundedSet.has(v)) record("radius", src.file, context, d.prop, v);
        }
      }
      if (/^(transition|animation)(-|$)/.test(d.prop)) {
        for (const layer of transitionLayers(d.prop, d.value)) {
          if (!layer.times.length) continue;
          const duration = normalizeDuration(layer.times[0]);
          if (!durationSet.has(duration)) record("duration", src.file, context, d.prop, duration);
          else if (layer.timing && !design.motionPairs.has(`${duration} ${layer.timing}`)) record("easing", src.file, context, d.prop, `${duration} ${layer.timing}`);
        }
      }
      const sizes = d.prop === "font-size" ? pxSizes(d.value) : d.prop === "font" ? fontShorthandSize(d.value) : [];
      for (const size of sizes) if (!fontSizeSet.has(size)) record("font-size", src.file, context, d.prop, size);
    }

    for (const name of (config.requiredColorVars || {})[src.file] || []) {
      if (!topRoot.has(name)) {
        hard({ type: "missing-token", token: name, message: `${src.file} no longer defines --${name} in its top-level :root (required by design/audit-config.json)` });
      }
    }
  }
  for (const cat of CATEGORIES) deviations[cat] = sortObject(deviations[cat]);
  return { errors, deviations, pageTotals: sortObject(pageTotals) };
}

export function compareToBaseline(current, baseline) {
  const regressions = [];
  const improvements = [];
  for (const category of CATEGORIES) {
    const cur = current[category] || {};
    const base = (baseline && baseline[category]) || {};
    for (const fingerprint of Object.keys(cur).sort()) {
      const b = base[fingerprint] || 0;
      if (cur[fingerprint] > b) regressions.push({ category, fingerprint, count: cur[fingerprint], baseline: b });
    }
    for (const fingerprint of Object.keys(base).sort()) {
      const c = cur[fingerprint] || 0;
      if (c < base[fingerprint]) improvements.push({ category, fingerprint, count: c, baseline: base[fingerprint] });
    }
  }
  return { regressions, improvements };
}

export function validateBaseline(baseline) {
  const problems = [];
  if (!baseline || typeof baseline !== "object" || !baseline.deviations || typeof baseline.deviations !== "object" || Array.isArray(baseline.deviations)) {
    return ["baseline has no deviations object"];
  }
  for (const [category, entries] of Object.entries(baseline.deviations)) {
    if (!CATEGORIES.includes(category)) {
      problems.push(`unknown category "${category}"`);
      continue;
    }
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
      problems.push(`category "${category}" is not an object`);
      continue;
    }
    for (const [fp, count] of Object.entries(entries)) {
      if (!Number.isInteger(count) || count < 0) problems.push(`${category} ${fp}: count ${JSON.stringify(count)} is not a non-negative integer`);
    }
  }
  return problems;
}

// ---------- CLI ----------

class UsageError extends Error {}

export function parseArgs(argv) {
  const args = { css: [], replace: {}, ...DEFAULTS, json: false, updateBaseline: false, against: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const eq = argv[i].startsWith("--") ? argv[i].indexOf("=") : -1;
    const flag = eq === -1 ? argv[i] : argv[i].slice(0, eq);
    const inline = eq === -1 ? undefined : argv[i].slice(eq + 1);
    const takeValue = () => {
      if (inline !== undefined) return inline;
      const next = argv[++i];
      if (next === undefined || next.startsWith("--")) throw new UsageError(`Option ${flag} requires a value`);
      return next;
    };
    switch (flag) {
      case "--css": args.css.push(takeValue()); break;
      case "--replace": {
        const spec = takeValue();
        const at = spec.indexOf("=");
        if (at <= 0 || at === spec.length - 1) throw new UsageError(`--replace expects name=path, got "${spec}"`);
        args.replace[spec.slice(0, at)] = spec.slice(at + 1);
        break;
      }
      case "--baseline": args.baseline = takeValue(); break;
      case "--design": args.design = takeValue(); break;
      case "--config": args.config = takeValue(); break;
      case "--against": args.against = takeValue(); break;
      case "--json": args.json = true; break;
      case "--update-baseline": args.updateBaseline = true; break;
      case "--help": case "-h": args.help = true; break;
      default: throw new UsageError(`Unknown option: ${argv[i]}`);
    }
  }
  return args;
}

const USAGE = `Usage: node tools/design-audit.mjs [--css <path>]... [--replace <name>=<path>]... [--baseline <path>] [--design <path>] [--config <path>] [--against <git-ref>] [--json] [--update-baseline]`;

function discoverFiles(config) {
  let listed;
  try {
    listed = execFileSync("git", ["ls-files", "-z", "--", "*.html", "*.htm"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    throw new Error(`cannot list tracked HTML files with git (${err.message.split("\n")[0]}); pass the inputs with --css`);
  }
  const excluded = config.exclude || [];
  const html = listed.split("\0").filter(Boolean).filter((f) => !excluded.some((prefix) => f.startsWith(prefix)));
  return [...html.sort(), ...(config.extraCss || [])];
}

function gitCommit() {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

function totals(deviations) {
  return Object.fromEntries(CATEGORIES.map((c) => [c, Object.values(deviations[c] || {}).reduce((a, b) => a + b, 0)]));
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return undefined;
    throw new Error(`${label} ${path} is unreadable: ${err.message}`);
  }
}

// Baseline at a git ref: undefined when the ref has no baseline file yet.
function baselineAtRef(ref, path) {
  const verify = spawnSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { encoding: "utf8" });
  if (verify.status !== 0) throw new Error(`--against: git ref "${ref}" does not exist`);
  const show = spawnSync("git", ["show", `${ref}:${path}`], { encoding: "utf8" });
  if (show.status !== 0) return undefined;
  try {
    return JSON.parse(show.stdout);
  } catch (err) {
    throw new Error(`--against: ${ref}:${path} is not valid JSON: ${err.message}`);
  }
}

export function run(argv) {
  const args = parseArgs(argv);
  if (args.help) return { code: 0, stdout: USAGE };
  const config = readJson(args.config, "config");
  if (config === undefined) throw new Error(`config ${args.config} not found`);

  const files = args.css.length ? args.css : discoverFiles(config);
  for (const name of Object.keys(args.replace)) {
    if (!files.includes(name)) throw new UsageError(`--replace ${name}: not one of the audited inputs`);
  }
  const notes = [];
  const parsed = parseDesign(readFileSync(args.design, "utf8"));
  let errors = parsed.errors;
  let deviations = emptyDeviations();
  let pageTotals = {};
  if (parsed.design) {
    const sources = files.map((file) => ({ file, text: readFileSync(args.replace[file] ?? file, "utf8") }));
    ({ errors, deviations, pageTotals } = auditSources(parsed.design, sources, config));
  }

  let regressions = [];
  let improvements = [];
  if (args.updateBaseline) {
    if (errors.length) {
      notes.push("Baseline not written: hard errors must be fixed first (they are never baselined).");
    } else {
      const baseline = {
        schemaVersion: 2,
        generatedAt: new Date().toISOString().slice(0, 10),
        commit: gitCommit(),
        cssFiles: files,
        totals: totals(deviations),
        pageTotals,
        deviations,
      };
      mkdirSync(dirname(args.baseline), { recursive: true });
      writeFileSync(args.baseline, JSON.stringify(baseline, null, 2) + "\n");
      notes.push(`Baseline written to ${args.baseline}`);
    }
  } else {
    const baseline = readJson(args.baseline, "baseline");
    if (baseline === undefined) {
      errors.push({ type: "baseline-missing", message: `Baseline ${args.baseline} not found. Create it with: npm run design:audit -- --update-baseline` });
    } else {
      const problems = validateBaseline(baseline);
      for (const p of problems) errors.push({ type: "baseline-invalid", message: `${args.baseline}: ${p}` });
      if (!problems.length) {
        ({ regressions, improvements } = compareToBaseline(deviations, baseline.deviations));
        if (improvements.length) {
          errors.push({
            type: "stale-baseline",
            message: `${improvements.length} baselined deviation(s) were fixed; tighten the baseline with: npm run design:audit -- --update-baseline`,
          });
        }
      }
    }
  }

  if (args.against) {
    const refBaseline = baselineAtRef(args.against, args.baseline);
    if (refBaseline === undefined) {
      notes.push(`--against: ${args.against} has no ${args.baseline}; skipping the baseline-loosening check (first introduction).`);
    } else {
      const refProblems = validateBaseline(refBaseline);
      if (refProblems.length) throw new Error(`--against: ${args.against}:${args.baseline} is invalid: ${refProblems.join("; ")}`);
      const current = readJson(args.baseline, "baseline");
      if (current !== undefined && !validateBaseline(current).length) {
        for (const r of compareToBaseline(current.deviations, refBaseline.deviations).regressions) {
          errors.push({
            type: "baseline-loosened",
            message: `${r.category} ${r.fingerprint}: baseline allows ${r.count}, ${args.against} allowed ${r.baseline}`,
          });
        }
      }
    }
  }

  const failed = errors.length > 0 || regressions.length > 0;
  const summary = { status: failed ? "fail" : "pass", errors: errors.length, regressions: regressions.length, improvements: improvements.length, totals: totals(deviations), pageTotals, inputs: files.length, baseline: args.baseline, notes };

  if (args.json) {
    return { code: failed ? 1 : 0, stdout: JSON.stringify({ errors, deviations, regressions, improvements, summary }, null, 2) };
  }
  const lines = [`Design audit: ${args.design} vs ${files.length} input(s)`];
  lines.push(`Deviation totals: ${CATEGORIES.map((c) => `${c}=${summary.totals[c]}`).join(", ")}`);
  const pages = Object.entries(pageTotals).filter(([, n]) => n > 0);
  lines.push(`Per-input totals (${pages.length} with deviations): ${pages.map(([f, n]) => `${f}=${n}`).join(", ")}`);
  for (const e of errors) lines.push(`ERROR ${e.type}: ${e.message}`);
  for (const r of regressions) lines.push(`REGRESSION ${r.category} ${r.fingerprint}: count ${r.count} > baseline ${r.baseline}`);
  for (const r of improvements) lines.push(`improved ${r.category} ${r.fingerprint}: count ${r.count} < baseline ${r.baseline}`);
  lines.push(...notes);
  lines.push(failed ? `FAIL: ${errors.length} error(s), ${regressions.length} regression(s)` : "PASS: no hard errors and no new deviations");
  return { code: failed ? 1 : 0, stdout: lines.join("\n") };
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
    const { code, stdout } = run(process.argv.slice(2));
    console.log(stdout);
    process.exitCode = code;
  } catch (err) {
    console.error(`design-audit: ${err.message}`);
    if (err instanceof UsageError) console.error(USAGE);
    process.exitCode = err instanceof UsageError ? 2 : 1;
  }
}
