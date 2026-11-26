---
version: alpha
name: Nolil Site
description: >-
  Farm-first community site for Nolil (PLAY WORK GROW). Deep teal and mint
  color fields, serif section headings over a Pretendard body, pill buttons.
  Document v02, issued 2026-11-26. Token values observed in index.html and
  tokens.css at commit 195a1ed.
colors:
  primary: "{colors.teal}"
  teal: "#015e5c"
  teal-deep: "#014140"
  mint: "#eef6ef"
  mint-strong: "#dcefe0"
  yellow: "#f5e578"
  coral: "#a9432e"
  text: "#173535"
  body: "#4e5c54"
  soft: "#6e827a"
  line: "rgba(59,74,54,.16)"
  photo-veil: "rgba(1,65,64,.54)"
  white: "#ffffff"
  hero-base: "#062c2a"
  ember-500: "oklch(0.68 0.17 55)"
  ember-100: "oklch(0.94 0.05 70)"
  cream: "oklch(0.97 0.013 85)"
  moss-100: "oklch(0.94 0.025 140)"
  ink: "oklch(0.20 0.025 145)"
typography:
  body-md:
    fontFamily: Pretendard
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.8
  body-lg:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.8
  body-sm:
    fontFamily: Pretendard
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.65
  title-md:
    fontFamily: Georgia
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.35
  label-eyebrow:
    fontFamily: Georgia
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.24em
  label-button:
    fontFamily: Pretendard
    fontSize: 17px
    fontWeight: 800
    lineHeight: 1.8
  headline-display:
    fontFamily: Pretendard
    fontSize: 84px
    fontWeight: 900
    lineHeight: 0.96
  headline-display-sm:
    fontFamily: Pretendard
    fontSize: 40px
    fontWeight: 900
    lineHeight: 1.08
  headline-lg:
    fontFamily: Georgia
    fontSize: 56px
    fontWeight: 400
    lineHeight: 1.3
  headline-lg-sm:
    fontFamily: Georgia
    fontSize: 34px
    fontWeight: 400
    lineHeight: 1.3
rounded:
  sm: 8px
  md: 16px
  lg: 22px
  full: 999px
spacing:
  page-max: 1180px
  narrow-max: 820px
  hero-min: 620px
  control-height: 56px
  page-pad-sm: 22px
  page-pad-lg: 48px
motion:
  state-change:
    duration: 160ms
    delay: 0ms
    timingFunction: ease-out
  surface-shift:
    duration: 240ms
    delay: 0ms
    timingFunction: ease
  reveal:
    duration: 720ms
    delay: 0ms
    timingFunction: ease
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.white}"
    typography: "{typography.label-button}"
    rounded: "{rounded.full}"
    height: "{spacing.control-height}"
    padding: 14px
  button-primary-hover:
    backgroundColor: "{colors.teal-deep}"
    textColor: "{colors.white}"
  button-hero:
    backgroundColor: "{colors.ember-500}"
    textColor: "{colors.white}"
    rounded: "{rounded.full}"
  button-line:
    backgroundColor: "{colors.white}"
    textColor: "{colors.teal}"
    rounded: "{rounded.full}"
  button-deck:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
  nav-cta:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.white}"
    rounded: "{rounded.full}"
  eyebrow:
    textColor: "{colors.teal}"
    typography: "{typography.label-eyebrow}"
  section-heading:
    textColor: "{colors.text}"
    typography: "{typography.headline-lg}"
  card-title:
    textColor: "{colors.text}"
    typography: "{typography.title-md}"
  hero:
    backgroundColor: "{colors.hero-base}"
    textColor: "{colors.white}"
    typography: "{typography.headline-display}"
  body-copy:
    backgroundColor: "{colors.white}"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
---

# Nolil Site Design System

Document version v02, issued 2026-11-26. This file follows the Google Labs
DESIGN.md format (spec version `alpha`). The YAML front matter is the normative
token set; `npm run design:lint` validates it and `npm run design:audit` checks
that `index.html` and `tokens.css` still agree with it. The pinned linter
(0.4.0) does not yet read the `motion` key that the current spec defines, so it
reports that key as ignored; the audit reads it directly.

## Overview

Nolil should feel like a people-and-content community that happens through a
farm space: open, bright, botanical, and easy to enter. The signature is
`PLAY WORK GROW` as the first-view slogan, followed by a visitor-map rhythm: a
large atmospheric farm backdrop, generous white breathing room, soft mint and
deep teal color bands, compact uppercase section labels, and directory cards
that feel like ways people gather and make content rather than a facilities
brochure.

The audience includes visitors in their fifties and sixties, so Korean body
text stays large and line spacing stays open.

## Colors

- **Teal (`teal`, `teal-deep`)** is the primary color: deep destination bands,
  primary buttons, links, and eyebrow labels. `teal-deep` is the hover and
  dark-band step.
- **Mint (`mint`, `mint-strong`)** fills soft section backgrounds and the
  program map.
- **Yellow (`yellow`)** is a warm, low-volume highlight band and the deck
  button.
- **Coral (`coral`)** marks small emphasis and warnings in text.
- **Ember (`ember-500`, `ember-100`)** is inherited from `tokens.css` and is the
  campfire signature. It is used for the hero call to action and highlights
  only, never as a dominant background.
- **Text (`text`, `body`, `soft`)** are the three ink steps for headings, body
  copy, and supporting copy. `line` is the hairline border color.
- **Surface** is plain white. `hero-base` sits under the hero photograph and
  `photo-veil` is the overlay that keeps text readable over photos.

Rules:

- Large color fields are allowed, but ember remains a call-to-action and
  highlight color.
- No purple, no blue-purple gradient, no stock-like dark crop, and no one-note
  moss-only palette.
- Accessibility contrast wins over any reference site's small text.

## Typography

Pretendard carries the Korean body and the hero display line. Georgia (with
Times New Roman and AppleMyungjo as fallbacks) carries section headings, card
titles, and uppercase eyebrow labels.

- **Display (`headline-display`)** is the hero line. In code it is fluid:
  `clamp(48px, 7vw, 84px)` on desktop and `clamp(32px, 8.6vw, 40px)` on mobile.
  The `headline-display` and `headline-display-sm` tokens record the two ends.
- **Section heading (`headline-lg`)** is serif at weight 400, fluid between
  34px and 56px.
- **Card title (`title-md`)** is serif at 24px.
- **Body (`body-md`)** is 17px with a 1.8 line height. This is a floor, not a
  default to shrink from.
- **Eyebrow (`label-eyebrow`)** is uppercase serif at 15px with 0.24em tracking.

## Layout

Hero and color bands are full width; content is constrained to `page-max`
(1180px) with a fluid page edge of `clamp(22px, 4vw, 48px)`, recorded as the
`page-pad-sm` and `page-pad-lg` tokens. Long text uses `narrow-max` (820px). The hero
is at least `hero-min` tall.

- Directory groups use simple grids that collapse to one column on mobile.
- Cards are not nested. Cards are for individual program and link items only.
- Interactive controls are at least `control-height` (56px) tall.

## Elevation & Depth

Depth comes from tonal shifts between white, mint, and teal bands plus light
`line` borders. Shadows are soft, low-opacity, and tinted teal or black. They
are reserved for the scrolled navigation bar, floating actions, and lifted
cards.

## Shapes

Buttons, chips, and the navigation call to action are full pills
(`rounded.full`). Cards and photo frames use `rounded.md` (16px). Large feature
panels use `rounded.lg` (22px). Small inline elements use `rounded.sm` (8px).

## Motion

- Hover and focus feedback uses `state-change` (160ms, ease-out).
- The navigation bar changing on scroll uses `surface-shift` (240ms).
- Content revealing on scroll uses `reveal` (720ms).
- Only `transform`, `opacity`, color, and filter transition. Reduced motion
  must keep all content visible with no required animation.

## Voice & Content Strategy

Marketing claims and AI-assisted copy use `@marketing-context.md` as the source
of truth. Do not invent testimonials, attendance numbers, schedules, prices, or
location details. The message centers people and content; the farm is the
setting.

## Components

- **Site Nav**: brand link left, short anchor links right. Hover lowers
  opacity; focus shows a visible outline. Anchors remain real links and there
  is no icon-only navigation.
- **Hero**: full-bleed farm photo with a veil overlay, `PLAY WORK GROW` as the
  H1, and one constrained Korean explanation below. Text contrast over the
  image must not depend on image details.
- **Button**: `button-primary` (teal fill), `button-hero` (ember fill, hero
  only), `button-line` (white with teal text), `button-deck` (yellow). Hover
  lifts by 2px. Minimum height is 56px.
- **Program Card**: title, description, tag, optional link. Linked cards lift
  by 2px and switch border and ink color on hover and focus. The entire linked
  card is a real anchor.
- **Connection Asset Card**: external asset name and a one-line description.
  `target="_blank"` links keep `rel="noopener"`.

## Do's and Don'ts

- Do keep body text at 17px or larger.
- Do use real space, people, and infrastructure photographs from
  `images/{space,people,infra}/`. The earlier version pointed to
  `alt텍스트_캡션.md` for alt text and captions; that file is not in this
  repository as of 2026-11-26.
- Do target WCAG 2.2 AA for body text and interactive controls.
- Don't use ember as a section background.
- Don't add a color, corner radius, or transition duration that is not a token
  here. Add the token first, then use it.
- Don't nest cards.

## Known Deviations

`npm run design:audit` records values in `index.html` that are not tokens in
this file. As of 2026-11-26 these exist and are accepted debt, frozen in
`design/audit-baseline.json`. New deviations fail the audit; existing ones
should shrink over time. `button-hero` (white on ember) is below the 4.5:1
contrast ratio the linter checks; it relies on the large-bold-text allowance
and should be reviewed.

## Quality & Marketing Contract

Lighthouse is a technical quality signal, not the homepage acceptance
criterion. UX changes must satisfy the fixed viewport, layout contract,
user-test, and consent-safe behavior rules in
`evidence/nolil-ux-2026-08/quality-gates.md`. The selected marketing skills are
documented in `evidence/nolil-ux-2026-08/marketing-skills-selection.md`; use
them to generate hypotheses and evidence-backed audits, not autonomous
publishing.

## Research Log

- Live URL reference: `https://solsofarm.com/` viewed at 1280px and 375px with
  Playwright screenshots `solso-1280.png`, `solso-375.png`. Copy, logo,
  illustrations, and proprietary assets are not copied.
- Resolved (2026-08): real farm photography replaced the CSS atmosphere and
  every legacy stock or placeholder image.

## Change Log

- v02 (2026-11-26): converted to the DESIGN.md token format and re-anchored on
  the values actually used in `index.html` and `tokens.css`. The earlier table
  listed tokens that no longer exist in code (`--solso-teal`, `--solso-mint`,
  `--solso-sun`, `--site-pad`, `--section-y`, `--content-max`, `--narrow-max`)
  and a 960px content width; the code uses `--teal`, `--mint`, `--yellow`,
  `--pad`, and `--max` at 1180px. Serif headings were undocumented.
- v01 (unversioned at the time): Solso-inspired design system notes.
