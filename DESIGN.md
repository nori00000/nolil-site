---
version: alpha
name: Nolil Site
description: >-
  Farm-first community site for Nolil (PLAY WORK GROW). Deep teal and mint
  color fields, serif section headings over a Pretendard body, pill buttons.
  Document v04, issued 2026-11-26. Values are the computed styles measured in
  Chromium at 1280x800, 768x1024 and 375x812 by
  tests/design/design-contract.spec.mjs.
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
  transparent: "transparent"
  band-dark: "#062c2a"
  nav-text: "rgba(255,255,255,.86)"
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
  title-card:
    fontFamily: Pretendard
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.45
  body-card:
    fontFamily: Pretendard
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.72
  label-eyebrow:
    fontFamily: Georgia
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.8
    letterSpacing: 0.24em
  label-button:
    fontFamily: Pretendard
    fontSize: 17px
    fontWeight: 800
    lineHeight: 1.8
  label-button-hero:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: 800
    lineHeight: 1.35
  label-button-consent:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: 800
    lineHeight: 1.8
  label-button-bar:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: 800
    lineHeight: 1.8
  label-nav:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: 800
    lineHeight: 1.8
    letterSpacing: 0.02em
  label-nav-sm:
    fontFamily: Pretendard
    fontSize: 12px
    fontWeight: 800
    lineHeight: 1.8
    letterSpacing: 0.02em
  headline-display:
    fontFamily: Pretendard
    fontSize: 76px
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: 0.02em
  headline-display-md:
    fontFamily: Pretendard
    fontSize: 53.76px
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: 0.02em
  headline-display-sm:
    fontFamily: Pretendard
    fontSize: 40px
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: 0.02em
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
  control: 14px
  md: 16px
  lg: 22px
  full: 999px
spacing:
  page-max: 1180px
  narrow-max: 820px
  hero-min: 620px
  hero-min-sm: 0px
  control-height: 56px
  control-height-hero: 58px
  control-height-consent: 46px
  page-pad-sm: 22px
  page-pad-md: 30.72px
  page-pad-lg: 48px
motion:
  state-change:
    duration: 160ms
    delay: 0ms
    timingFunction: ease
  state-change-emphasis:
    duration: 160ms
    delay: 0ms
    timingFunction: ease-out
  reveal:
    duration: 720ms
    delay: 0ms
    timingFunction: ease
components:
  body-copy:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
  section-lead:
    textColor: "{colors.body}"
    typography: "{typography.body-lg}"
  card-title:
    textColor: "{colors.text}"
    typography: "{typography.title-card}"
  card-text:
    textColor: "{colors.body}"
    typography: "{typography.body-card}"
  hero:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.cream}"
    height: "{spacing.hero-min}"
  hero-mobile:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.cream}"
    height: "{spacing.hero-min-sm}"
  hero-title:
    textColor: "{colors.cream}"
    typography: "{typography.headline-display}"
  hero-title-tablet:
    textColor: "{colors.cream}"
    typography: "{typography.headline-display-md}"
  hero-title-mobile:
    textColor: "{colors.cream}"
    typography: "{typography.headline-display-sm}"
  section-heading:
    textColor: "{colors.text}"
    typography: "{typography.headline-lg}"
  section-heading-mobile:
    textColor: "{colors.text}"
    typography: "{typography.headline-lg-sm}"
  section-heading-on-dark:
    textColor: "{colors.white}"
    typography: "{typography.headline-lg}"
  section-heading-on-dark-mobile:
    textColor: "{colors.white}"
    typography: "{typography.headline-lg-sm}"
  eyebrow:
    textColor: "{colors.teal}"
    typography: "{typography.label-eyebrow}"
  eyebrow-on-dark:
    textColor: "{colors.yellow}"
    typography: "{typography.label-eyebrow}"
  band-dark:
    backgroundColor: "{colors.band-dark}"
    textColor: "{colors.white}"
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.white}"
    typography: "{typography.label-button}"
    rounded: "{rounded.full}"
    height: "{spacing.control-height}"
    padding: 14px 28px
  button-primary-hover:
    backgroundColor: "{colors.teal-deep}"
    textColor: "{colors.white}"
  button-contact:
    backgroundColor: "{colors.white}"
    textColor: "{colors.teal}"
    typography: "{typography.label-button}"
    rounded: "{rounded.control}"
    height: "{spacing.control-height}"
    padding: 16px 22px
  button-consent:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.white}"
    typography: "{typography.label-button-consent}"
    rounded: "{rounded.full}"
    height: "{spacing.control-height-consent}"
    padding: 10px 16px
  button-consent-line:
    backgroundColor: "{colors.white}"
    textColor: "{colors.teal}"
    typography: "{typography.label-button-consent}"
    rounded: "{rounded.full}"
    height: "{spacing.control-height-consent}"
    padding: 10px 16px
  button-hero:
    backgroundColor: "{colors.ember-500}"
    textColor: "{colors.white}"
    typography: "{typography.label-button-bar}"
    rounded: "{rounded.full}"
    height: "{spacing.control-height}"
    padding: 14px 16px
  button-hero-primary:
    backgroundColor: "{colors.ember-500}"
    textColor: "{colors.white}"
    typography: "{typography.label-button-hero}"
    rounded: "{rounded.full}"
    height: "{spacing.control-height-hero}"
    padding: 14px 20px
  nav-link:
    backgroundColor: "{colors.transparent}"
    textColor: "{colors.nav-text}"
    typography: "{typography.label-nav}"
  nav-cta:
    backgroundColor: "{colors.transparent}"
    textColor: "{colors.yellow}"
    typography: "{typography.label-nav-sm}"
    rounded: "{rounded.full}"
  page-container:
    width: "{spacing.page-max}"
    padding: "{spacing.page-pad-lg}"
  page-container-tablet:
    width: "{spacing.page-max}"
    padding: "{spacing.page-pad-md}"
  page-container-mobile:
    width: "{spacing.page-max}"
    padding: "{spacing.page-pad-sm}"
---

# Nolil Site Design System

Document version v04, issued 2026-11-26. This file follows the Google Labs
DESIGN.md format (spec version `alpha`). The YAML front matter is the normative
token set. Three checks keep it honest:

- `npm run design:lint` validates the format and fails on lint errors or on any
  warning (rule and path) that is not in `design/lint-baseline.json`.
- `npm run test:design-contract` loads `index.html` in Chromium at 1280x800,
  768x1024 and 375x812 and compares every component below with the browser's
  computed styles on a real element of the page (hidden elements such as the
  consent buttons included; nothing is injected). Every component and motion
  token must be mapped to a page target in that spec. In components, `height`
  means `min-height` and `width` means `max-width`; `page-container` padding is
  the left/right padding. Linked pages (`group.html`, `program/index.html`)
  already differ from this file; their current values are frozen separately in
  `design/page-contracts.json`.
- `npm run design:audit` statically checks the CSS of every tracked HTML page
  and `tokens.css` against the tokens and a per-occurrence ratchet baseline.

These checks run on pull requests and pushes, not on a schedule: their result
depends only on the repository contents, so a week without changes cannot
change it.

The pinned linter (0.4.0) does not yet read the `motion` key that the current
spec defines, so it reports that key as ignored; the contract test and the audit
read it directly.

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
- **Yellow (`yellow`)** is a warm, low-volume highlight band, the eyebrow on
  dark bands, and the mobile navigation call to action.
- **Coral (`coral`)** marks small emphasis and warnings in text.
- **Ember (`ember-500`, `ember-100`)** is inherited from `tokens.css` and is the
  campfire signature. It fills the hero call to action and the mobile bottom
  bar call to action, and highlights; it is never a dominant background.
- **Text (`text`, `body`, `soft`)** are the three ink steps for headings, body
  copy, and supporting copy. `line` is the hairline border color.
- **Surface** is plain white. The hero is a `teal` field under the photograph
  with `cream` text; `photo-veil` is the overlay that keeps text readable over
  photos. `band-dark` is the dark group-inquiry band, with white headings and a
  `yellow` eyebrow.
- **Supporting values**: `nav-text` is the top navigation link colour over the
  hero, and `transparent` records the unfilled navigation links.

Rules:

- Large color fields are allowed, but ember remains a call-to-action and
  highlight color.
- No purple, no blue-purple gradient, no stock-like dark crop, and no one-note
  moss-only palette.
- Accessibility contrast wins over any reference site's small text.

## Typography

Pretendard carries the Korean body and the hero display line. Georgia (with
Times New Roman and AppleMyungjo as fallbacks) carries section headings and
uppercase eyebrow labels.

- **Display (`headline-display`)** is the hero line, uppercase, weight 800,
  line height 0.96 and 0.02em tracking. The applied rule is `.hero h1` with
  `clamp(40px, 7vw, 76px)`: 76px at 1280px (`headline-display`), 53.76px at
  768px (`headline-display-md`, the fluid middle) and 40px at 375px
  (`headline-display-sm`). The generic `h1` rules (84px/900, and
  1.08 line height on mobile) are overridden by `.hero h1` and do not apply to
  the hero.
- **Section heading (`headline-lg`)** is serif at weight 400, fluid between
  34px (`headline-lg-sm`, measured at 768px and 375px) and 56px (1280px).
- **Section lead (`body-lg`)**: the paragraph under a section heading is 18px
  with a 1.8 line height.
- **Card title (`title-card`)**: the person and outcome card titles are
  Pretendard 20px, weight 700, line height 1.45; card text (`body-card`) is
  15px with a 1.72 line height. `title-md` (serif 24px) is the base `h3` style;
  the homepage markup has no static `h3`, so no component uses it.
- **Body (`body-md`)** is 17px with a 1.8 line height. This is a floor, not a
  default to shrink from.
- **Eyebrow (`label-eyebrow`)** is uppercase serif at 15px with 0.24em tracking;
  it inherits the 1.8 body line height.
- **Buttons** use `label-button` (17px/800). Hero buttons use
  `label-button-hero` (18px/800, line height 1.35) and the mobile bottom bar
  uses `label-button-bar` (16px/800). The analytics consent buttons use
  `label-button-consent` (14px/800). Navigation links use `label-nav` (14px)
  and, on mobile, `label-nav-sm` (12px).

## Layout

Hero and color bands are full width; content is constrained to `page-max`
(1180px) with a fluid page edge of `clamp(22px, 4vw, 48px)`, recorded as the
`page-pad-sm`, `page-pad-md` and `page-pad-lg` tokens (22px at 375px, 30.72px
at 768px, 48px at 1280px). Long
text uses `narrow-max` (820px). From 560px up the hero is at least `hero-min`
(620px) tall; below 560px it has no minimum height (`hero-min-sm`, 0px) and the
photo is shown as a full frame above the text.

- Directory groups use simple grids that collapse to one column on mobile.
- Cards are not nested. Cards are for individual program and link items only.
- Interactive controls are at least `control-height` (56px) tall; hero buttons
  are at least `control-height-hero` (58px). The analytics consent buttons are
  the exception at `control-height-consent` (46px).

## Elevation & Depth

Depth comes from tonal shifts between white, mint, and teal bands plus light
`line` borders. Shadows are soft, low-opacity, and tinted teal or black. They
are reserved for the scrolled navigation bar, floating actions, and lifted
cards.

## Shapes

Buttons, chips, and the navigation call to action are full pills
(`rounded.full`). The stacked contact buttons use `rounded.control` (14px).
Cards and photo frames use `rounded.md` (16px). Large feature panels use
`rounded.lg` (22px). Small inline elements use `rounded.sm` (8px).

## Motion

- Button hover and focus feedback uses `state-change` (160ms, ease).
- Hero buttons and the mobile bottom bar use `state-change-emphasis` (160ms,
  ease-out).
- Content revealing on scroll uses `reveal` (720ms, ease).
- All motion tokens have a 0ms delay; the contract test reads
  `transition-delay` and the audit records any other delay.
- The top navigation has no transition in the applied CSS. The `.nav` rule with
  a 240ms transition targets a class the markup does not use, so v02's
  `surface-shift` token was removed.
- Only `transform`, `opacity`, color, and filter transition. Reduced motion
  must keep all content visible with no required animation.

## Voice & Content Strategy

Marketing claims and AI-assisted copy use `@marketing-context.md` as the source
of truth. Do not invent testimonials, attendance numbers, schedules, prices, or
location details. The message centers people and content; the farm is the
setting.

## Components

- **Site Nav** (`nav-link`, `nav-cta`): brand link left, short anchor links
  right in `nav-text`; hover and focus turn them `yellow`. Below 560px the
  second and third links are hidden and the first link becomes a
  yellow-outlined pill (`nav-cta`).
  Anchors remain real links and there is no icon-only navigation.
- **Hero** (`hero`, `hero-title`): teal field with the farm photo and a veil
  overlay, a yellow kicker, the H1, and one constrained Korean explanation
  below. Text contrast over the image must not depend on image details.
- **Button**: `button-primary` (teal fill), `button-contact` (white line
  button in the contact list, 14px corners), and the smaller consent pair
  `button-consent` / `button-consent-line` (46px, 10px 16px padding). In the
  hero, `.btn-primary` becomes `button-hero-primary` (ember fill).
  `button-hero` is the ember `.btn-hero` in the mobile bottom bar. Hover lifts
  by 2px. The CSS also styles `.hero .btn-line` and `.hero .btn-deck`, but no
  markup uses them, so they are not components.
- **Cards** (`card-title`, `card-text`): person and outcome cards with a
  Pretendard title over body-coloured text.
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

`npm run design:audit` records values that are not tokens in this file, per
occurrence, in `design/audit-baseline.json`. As of 2026-11-26 these exist and
are accepted debt. New or moved deviations fail the audit, fixed ones must be
removed from the baseline in the same change, and other pages are held to "no
worse than the baseline".

Open accessibility debt: white text on `ember-500` (`button-hero`,
`button-hero-primary`) has a 3.03:1 contrast ratio as computed by the linter,
below the WCAG AA 4.5:1 minimum. The applied text is 18px at weight 800 in the
hero and 16px in the mobile bar, both under the 18.66px bold "large text"
threshold, so no large-text exception applies. This is unresolved; the
colours are a product decision and are not changed here.

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

- v04 (2026-11-26): every component is now measured on a real element of
  `index.html`, and 768x1024 was added. Section lead (`section-lead`, 18px) and
  the card title (`card-title`, Pretendard 20px/700/1.45) replace the injected
  17px paragraph and serif 24px `h3` samples; added `card-text`, the consent
  buttons, `hero-title-tablet` (53.76px), and `page-container-tablet`
  (30.72px padding). Removed `button-line`, `button-hero-line`,
  `button-hero-deck` and `deck-text`, which no markup uses.
- v03 (2026-11-26): re-measured every component from Chromium computed styles
  (1280x800 and 375x812) instead of counting CSS declarations, because later
  rules override earlier ones. Hero is teal with cream text (was `hero-base`
  and white); hero H1 is 76px/800 and 40px/800 at line height 0.96 (was
  84px/900 and 40px/900 at 1.08); eyebrow line height is 1.8 (was 1.2); general
  buttons use 160ms ease and 14px 28px padding. Added the hero, on-dark,
  contact, mobile-bar, and navigation variants that the page actually renders;
  renamed `hero-base` to `band-dark` (it colours the group-inquiry band);
  removed `surface-shift` and replaced the unused `.nav-cta` description with
  the real navigation. Corrected the contrast note on the ember buttons.

- v02 (2026-11-26): converted to the DESIGN.md token format and re-anchored on
  the values actually used in `index.html` and `tokens.css`. The earlier table
  listed tokens that no longer exist in code (`--solso-teal`, `--solso-mint`,
  `--solso-sun`, `--site-pad`, `--section-y`, `--content-max`, `--narrow-max`)
  and a 960px content width; the code uses `--teal`, `--mint`, `--yellow`,
  `--pad`, and `--max` at 1180px. Serif headings were undocumented.
- v01 (unversioned at the time): Solso-inspired design system notes.
