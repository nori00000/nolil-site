# Nolil Site Design System

## 0. Research Log

- Live URL reference: `https://solsofarm.com/` viewed at 1280px and 375px with Playwright screenshots `solso-1280.png`, `solso-375.png`.
- Runtime extraction: `solso-token-clusters.json` and `solso-computed-1280.json` captured rendered color, type, spacing, headings, sections, and assets with `getComputedStyle`.
- Direction picked: Solso-inspired farm directory language, adapted to Nolil. Copy, logo, illustrations, and proprietary assets are not copied.

## 1. Atmosphere & Identity

Nolil should feel like a people-and-content community that happens through a farm space: open, bright, botanical, and easy to enter. The signature is `PLAY WORK GROW` as the first-view slogan, followed by a visitor-map rhythm: a large atmospheric farm backdrop, generous white breathing room, soft green and deep teal color bands, compact uppercase section labels, and directory cards that feel like ways people gather and make content rather than a facilities brochure.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Farm deep | `--solso-teal` | `#005e5c` | Deep destination bands, dark sections |
| Farm mint | `--solso-mint` | `#e6f2e7` | Program map and soft section backgrounds |
| Farm yellow | `--solso-sun` | `#f5e578` | Warm highlight bands and low-volume accents |
| Nolil moss | `--moss-900` | existing | Text, brand anchor |
| Nolil ember | `--ember-500` | existing | Primary CTA only |
| Paper | `--paper` | existing | Main background |
| Cream | `--cream` | existing | Dark-band text |

Rules:
- Solso-like large color fields are allowed, but ember remains a CTA/highlight color, not a dominant background.
- No purple, blue-purple gradient, stock-like dark crop, or one-note moss-only palette.
- Existing accessibility contrast wins over source-reference small text.

## 3. Typography

| Level | Size | Weight | Line Height | Tracking | Usage |
|---|---:|---:|---:|---:|---|
| Display | `clamp(40px, 7vw, 76px)` | 800 | 1.08 | 0 | Hero |
| Section title | `clamp(28px, 4vw, 42px)` | 800 | 1.18 | 0 | Section headings |
| Card title | `19px` | 800 | 1.35 | 0 | Program and link cards |
| Body | `17px` | 400 | 1.8 | 0 | Default Korean body |
| Small | `15px` | 400 | 1.65 | 0 | Card supporting copy |
| Label | `12px` | 800 | 1.2 | `0.18em` | English/section labels |

Font stack remains Pretendard for Korean readability. The Solso reference uses Montserrat/Noto Sans JP with very small body text; Nolil keeps larger Korean body text for the 5060 audience.

## 4. Spacing & Layout

Base unit: 4px.

| Token | Value | Usage |
|---|---:|---|
| `--site-pad` | `20px` mobile, `32px` desktop | Page edge |
| `--section-y` | `72px` mobile, `108px` desktop | Section rhythm |
| `--hero-min` | `620px` desktop, `560px` mobile | Farm-first opening |
| `--content-max` | `960px` | Main content width |
| `--narrow-max` | `680px` | Text measure |

Rules:
- Hero and color bands are full-width; content is constrained inside.
- Directory groups use simple grids that collapse to one column on mobile.
- Cards are not nested. Cards are for individual program/link items only.

## 5. Components

### Site Nav
- Structure: brand link left, short anchor links right.
- States: hover/focus shifts text color to ember or deep teal; visible focus outline.
- Accessibility: anchors remain real links; no icon-only navigation.

### Hero
- Structure: full-bleed farm photo with soft light overlay, `PLAY WORK GROW` as the H1, and one constrained Korean explanation below.
- States: primary/secondary CTA states inherited from Button.
- Accessibility: text contrast over image must stay readable without depending on image details. The hero image is atmosphere; the message centers people and content.

### Button
- Variants: primary ember fill, light outline, dark outline.
- States: hover filter/translate, active pressed, focus outline.
- Accessibility: minimum 56px height.

### Program Card
- Structure: title, description, tag; optional link.
- States: linked cards lift by 2px and switch border/ink color on hover/focus.
- Accessibility: entire linked card is a real anchor.

### Connection Asset Card
- Structure: external asset name and one-line description.
- States: hover/focus color and border shift.
- Accessibility: `target="_blank"` links keep `rel="noopener"`.

## 6. Motion & Interaction

- Micro interactions use 160ms ease-out.
- Only `transform`, `opacity`, and color/filter transitions are used.
- Reduced motion should keep all content visible with no required animation.

## 7. Depth & Surface

Strategy: mixed tonal-shift plus light borders. The Solso reference is largely flat illustration and color fields; Nolil uses subtle borders only for readable directory cards.

## 8. Accessibility Constraints & Accepted Debt

- Target: WCAG 2.2 AA for body text and interactive controls.
- Body text remains 17px minimum despite the Solso reference using 10-12px text.
- Accepted debt: real farm photography is still limited. The current hero uses existing `hero.jpg`; when actual space photos arrive, they should replace broad CSS atmosphere rather than adding decorative stock imagery.
