---
version: alpha
name: Billyjo Storefront — AI Product Card
description: >-
  Design system for the PUBLIC storefront AI product-analysis card
  ("📊 빌리조 제품분석") injected into billyjo.co.kr product pages via inject.js,
  plus the inject.js header/layout patches. This is the CUSTOMER-FACING surface —
  separate from the admin console (admin2_frontend/DESIGN.md). The exhaustive,
  authoritative rulebook is CLAUDE.md (570 lines of absolute rules); this file is
  the design-token + visual SSOT that summarizes it in design.md format. When the
  two disagree, CLAUDE.md wins. Tokens below are the live :root values from
  scripts/template-base.html.
colors:
  # Brand + surfaces
  info: "#0838F8"            # Billyjo storefront brand blue (accent, scores, links)
  text-primary: "#2a2a2a"
  text-secondary: "#6a6a6a"  # labels / captions
  text-tertiary: "#999"      # pill-off, meta, 평가없음
  bg-primary: "#ffffff"      # card background
  bg-secondary: "#f7f7f7"    # spec grid / gift box fill
  bg-info: "#e8edff"         # pill-on / chip fill (accent wash)
  border-tertiary: "#dfdfdf" # hairline dividers / borders
  # Grade palette (score → letter → 한글 label), 9 fixed hues
  grade-s: "#0838F8"         # S  최고
  grade-aplus: "#1a87ac"     # A+ 적극추천
  grade-a: "#16a34a"         # A  추천
  grade-bplus: "#4ec727"     # B+ 우수
  grade-b: "#84cc16"         # B  좋음
  grade-cplus: "#c2ce15"     # C+ 적합
  grade-c: "#facc15"         # C  보통 (uses #5d4d00 text on yellow)
  grade-none: "#999"         # 평가 없음 (never the letter "D")
typography:
  product-name:
    fontFamily: Pretendard
    fontSize: 15px
    fontWeight: 500
  meta:
    fontFamily: Pretendard
    fontSize: 11.5px
    fontWeight: 400
  section-title:
    fontFamily: Pretendard
    fontSize: 13px
    fontWeight: 700
  spec-label:
    fontFamily: Pretendard
    fontSize: 11px
    fontWeight: 700
  spec-value:
    fontFamily: Pretendard
    fontSize: 13px
    fontWeight: 700
  body:
    fontFamily: Pretendard
    fontSize: 11.5px
    fontWeight: 400
  emphasis:
    fontFamily: Pretendard
    fontSize: 11.5px
    fontWeight: 700
  gauge-letter:
    fontFamily: Pretendard
    fontSize: 26px
    fontWeight: 700
rounded:
  sm: 4px       # feat-btn
  chip: 6px     # strength-chip, gift-tag
  md: 8px       # spec grid, gift box, pills-area
  lg: 12px      # the card itself
  full: 999px   # pills, hq-btn
spacing:
  xs: 4px
  sm: 6px
  md: 12px
  lg: 22px      # card padding
components:
  card:
    backgroundColor: "{colors.bg-primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 22px
  ai-card-tag:
    backgroundColor: "{colors.info}"
    textColor: "#ffffff"
    rounded: 5px
    typography: "{typography.emphasis}"
    padding: 3px 9px
  specs-grid:
    backgroundColor: "{colors.bg-secondary}"
    rounded: "{rounded.md}"
    padding: 12px 6px
  pill:
    textColor: "{colors.text-tertiary}"
    rounded: "{rounded.full}"
    padding: 3px 9px
  pill-on:
    backgroundColor: "{colors.bg-info}"
    textColor: "{colors.info}"
  hq-btn:
    backgroundColor: "{colors.info}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    typography: "{typography.emphasis}"
    padding: 3px 9px
  strength-chip:
    backgroundColor: "{colors.bg-info}"
    textColor: "{colors.info}"
    rounded: "{rounded.chip}"
    padding: 5px 10px
  feat-btn:
    backgroundColor: "#ffffff"
    textColor: "{colors.info}"
    rounded: "{rounded.sm}"
    padding: 3px 7px
  step-number:
    backgroundColor: "{colors.info}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    size: 18px
  gift-box:
    backgroundColor: "{colors.bg-secondary}"
    rounded: "{rounded.md}"
    padding: 10px 14px
  # --- Adjacent storefront components (own palettes, NOT the card token set) ---
  reco-card:                 # 추천제품 grid card (3-up)
    backgroundColor: "#ffffff"
    textColor: "#1A1F36"     # reco navy (not card text-primary)
    rounded: 18px
    padding: 14px
    border: "1px solid #E5E9F2"
  reco-card-best:            # current product's strongest alternative
    border: "1px solid #0838F8"
    boxShadow: "0 0 0 2px rgba(8,56,248,.08)"
  reco-top-card:             # 최고 인기 (topPick) hero card — warm-orange accent
    background: "linear-gradient(135deg,#FFF7ED 0%,#FFFBF5 50%,#FFFFFF 100%)"
    border: "2px solid #FB923C"
    rounded: 18px
    padding: 18px
  reco-price:
    textColor: "#0838F8"
    fontSize: 17px
    fontWeight: 800
  bottom-bar:                # #billyjo-bottom-bar sticky purchase bar
    backgroundColor: "#ffffff"
    borderTop: "1px solid #e0e0e0"
    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)"
  bottom-bar-rent-btn:       # primary action: 렌탈+사은품 신청
    backgroundColor: "{colors.info}"
    textColor: "#ffffff"
    rounded: 8px
  bottom-bar-cart-btn:       # secondary outline action
    backgroundColor: "#ffffff"
    textColor: "{colors.info}"
    border: "2px solid {colors.info}"
    rounded: 8px
---

## Overview

This is the **public storefront** design system: the AI product-analysis card
("📊 빌리조 제품분석") that appears on billyjo.co.kr product detail pages, plus the
`inject.js` patches that fix the site header/layout. It is what **customers** see —
deliberately separate from the internal admin console.

**How it reaches the page (delivery model).** A single `<script src=".../inject.js">`
tag is added to the billyjo site template, right after the upstream `billyjo-inject`
script. `inject.js` runs **client-side on the live site** (triggered via
DOMContentLoaded + staged `setTimeout` + a `MutationObserver`), and it:
1. patches the header / responsive layout (injects `<style>`, re-tags inject DOM);
2. **mounts the pre-generated AI card** into the page if one exists for that product.

The card **content** is pre-generated static HTML (`cards/<prodNo>.html`, built nightly
by `scripts/daily-sync.js`). **AI runs once at generation time only** — the live page
never calls AI, it just renders cached markup (CLAUDE.md rule #11). So the pipeline is:
*nightly generation → static card HTML → inject.js mounts it on page load.*

**Placement.** The card sits **just above the 상품정보 (detail-image) section**, full-width
aligned to the `.prod_view_top` image+price box — never at the very top. It must appear
right before the purchase decision, not as a hero.

> **Authority.** `CLAUDE.md` (the 570-line rulebook) is the exhaustive source of truth
> for structure and behavior. This DESIGN.md is the **token + visual** SSOT. If they
> conflict, follow CLAUDE.md.

> **Boundary with the admin.** The admin console uses brand blue `#1d3fd4`, Pretendard
> 400/500 only, and lucide icons. This storefront card uses `#0838F8`, **allows
> Pretendard 700**, Tabler icons, and an SVG grade gauge. Do not cross the two systems.

## Colors

- **Brand `info` `#0838F8`** — the single accent: scores, model numbers, links, pill-on,
  chips, section emphasis. Exposed as `var(--color-text-info)`.
- **Text ladder** — `text-primary #2a2a2a` (content) → `text-secondary #6a6a6a`
  (labels) → `text-tertiary #999` (meta, pill-off, 평가없음).
- **Surfaces** — `bg-primary #ffffff` (card) · `bg-secondary #f7f7f7` (spec grid, gift
  box) · `bg-info #e8edff` (accent wash for pill-on, chips). Borders are a single
  `border-tertiary #dfdfdf` hairline (drawn at 0.5px).

### Grade palette (score → letter → 한글 label)

Scores are **never shown as numbers**; they map to a letter + Korean label with a fixed
hue. This palette is sacred (CLAUDE.md #13):

| Score | Letter | 한글 (per-metric) | Token |
|------:|--------|------------------|-------|
| 90–100 | **S** | 최고 | `grade-s` `#0838F8` |
| 85–89 | **A+** | 적극추천 | `grade-aplus` `#1a87ac` |
| 80–84 | **A** | 추천 | `grade-a` `#16a34a` |
| 70–79 | **B+** | 우수 | `grade-bplus` `#4ec727` |
| 60–69 | **B** | 좋음 | `grade-b` `#84cc16` |
| 50–59 | **C+** | 적합 | `grade-cplus` `#c2ce15` |
| 40–49 | **C** | 보통 | `grade-c` `#facc15` (text `#5d4d00`) |
| <40 / conf<0.7 | **평가 없음** | (gray badge, never "D") | `grade-none` `#999` |

Overall score shows the **letter only**; individual metrics lead with the **Korean
label**, letter as a small secondary.

## Typography

- **Pretendard** for the entire card body (overriding the site's Open Sans / NanumSquare),
  single family.
- **Weight 700 is allowed and meaningful here** (unlike the admin) — it carries emphasis:
  `<strong>` highlights, model numbers, grade badges, spec labels/values, section titles,
  hq buttons, chips, persona names, the gauge letter. Body text is 400; product name is 500.
- **Small, dense scale** — product name 15px/500, meta 11.5px, section titles 13px/700,
  spec values 13px/700, body 11.5px, gauge letter 26px/700.
- `<strong>` inside step summaries gets a **highlighter underline**:
  `linear-gradient(transparent 62%, var(--color-background-info) 62%)`.

## Layout

The card is a single column of **8 fixed slots** (CLAUDE.md #1 — order/count are
immutable):

1. **Header** — name + model + one-line meta *(can move to the hero area)*
2. **Gauge + 4 metrics** — 270° SVG + 4 evaluation axes *(can move to hero)*
3. **Spec summary** — 6–8 cell grid
4. **Basic info + strength chips + rental terms**
5. **추천 페르소나 Top 3** — exactly 3 persona cards
6. **상세 스펙 Step 1–3** — with `<!-- step-N-start/end -->` anchors
7. **예상 최대 지원금ㆍ빌리조 혜택** — 3 rows (지원금 / 빌리조 단독 / 제조사 프로모션)
8. **약정·카드 할인가 (LPT)** — `#ai-card-lpt-section`, auto-mounted by inject.js

Full-width, aligned to `.prod_view_top`; `width:100%; margin:0; padding:0` (the card's
own 22px padding handles inset). `clear:both` to avoid floating beside images.

## Elevation & Depth

Flat. Depth comes from the `bg-secondary` inset panels (spec grid, gift box) and 0.5px
`border-tertiary` hairlines — **no drop shadows**. The card itself is a `0.5px solid`
bordered white panel. Section breaks are thin solid dividers, never dashed (dashed reads
as a "cut line").

## Shapes

`sm 4px` (feat buttons) · `chip 6px` (strength chips, gift tags) · `md 8px` (spec grid,
gift box) · `lg 12px` (the card) · `full 999px` (pills, hq buttons). Pills are fully
rounded; everything else is gently rounded.

## Components

### Card root (`#ai-card-root .card`)
White panel, `border:0.5px solid border-tertiary`, `rounded-lg` (12px), `padding:22px 22px 18px`.
All card styles are namespaced under `#ai-card-root` to avoid leaking into the host site.

### Card tag (`.ai-card-tag`)
Identity badge, top-left, `top:-1px; left:34px`. `bg info`, white, 11px/700,
`padding:3px 9px`, `border-radius:5px`. Text is **exactly `📊 빌리조 제품분석`** (emoji via
`::before`). Never expose internal terms like "AI 자동생성".

### Score gauge (SVG)
`viewBox="0 0 100 100"`, 270° arc, `stroke-dasharray="{score×1.65} 165"`, `stroke-linecap:round`.
Background arc = `border-tertiary`; value arc = `info`. **Center shows two lines only**:
"종합 평가" (9px) + the **letter** (26px/700, grade color). No decimals, no helper text.

### Metric row (`.m` / `.ml` + grade badge)
4 axes, each = label (`.ml`, 11.5px secondary) + a **grade badge** (`bg` = grade color,
white text, 700). Desktop = column; **mobile (≤600px) = single row** (label left, badge right).

### Spec grid (`.specs`)
`display:grid; grid-template-columns:1fr 1fr 1fr` (mobile 2-col), `bg-secondary`,
`rounded-md`, `padding:12px 6px`. Cells: label `.sl` (11px/700 secondary, centered) +
value `.sv` (13px/700 **info**). 6 tech specs + up to 2 ops/contract = 6–8 cells. Pro
terms get a native `<details class="help">` ⓘ tooltip.

### Pill (`.pill` / `.pill.on`)
`font-size:11px; padding:3px 9px; rounded-full; border:0.5px border-tertiary; color
text-tertiary; bg transparent`. **On** = `info` text on `bg-info`. Active/inactive by
**color only** — no ✓ icons. Trust-differentiators (본사관리·방문관리) use `.hq-btn`
instead (solid `info` fill + 🏢, 700).

### Strength chip (`.strength-chip`)
`bg-info` fill, `info` text, 700, `rounded:6px`, `padding:5px 10px`, Tabler icon + text.
4–6 per card in the basic-info area.

### Persona card (Top 3) — `.p`
Exactly 3. Each = Tabler icon (18px info) · **recommendation-strength label**
(`.rec-p-level-1/2/3` = grade-s / grade-aplus / grade-bplus fill) · name
(`.rec-p-title` 12px/700) · one-line `.p-d` (11px secondary) · 3 feature buttons
(`.feat-btn`: white bg, info text/border, `rounded:4px`). Composition % is DB-only,
never on the card surface.

### Step header (`.step-h` / `.step-n` / `.step-sum`)
Step 1–3. Number circle `.step-n` = 18px, `info` fill, white, `rounded:50%`. Title +
grade badge visible; full pill list hidden in `<details class="step-details">`
("자세히 보기"). `.step-sum` `<strong>` gets the highlighter underline.

### Gift box (`.gift`)
SLOT 7. `bg-secondary`, `rounded-md`, `padding:10px 14px`. **3 separate rows** kept
distinct (예상 최대 지원금 / 빌리조 단독 / 제조사 프로모션) — never merged. Labels are
button-style `.gift-tag` (`info` on `bg-info`, `rounded:6px`); key figures `<strong>` 700 `info`.

### LPT section (`.ai-card-lpt-section`)
SLOT 8, auto-mounted by inject.js `mountLptIntoCard()` when live-price data exists.
3 columns (약정 / 월렌탈료 / 카드할인가) if a card discount exists, else 2. Hides the page's
own `#livePriceTable` on success.

### inject.js header/layout patches (host site, not the card)
Separate concern from the card: `inject.js` also fixes the billyjo header at 3 breakpoints
(≤1280 / ≤1024 / ≤768px), re-tags the inject-built rows (`bj-inj-row` / `bj-inj-left` /
`bj-inj-right`), forces the mobile header to stay visible (`header.new-header.new-header`
specificity trick), and adds product-thumbnail borders. These are defensive overrides of
the upstream `billyjo-inject` script — see CLAUDE.md #20–#21 for the full spec.

**Delivery model (unified file).** inject.js is one file (`billyjo-appsilon/billyjo-inject`)
= **Module A (global, all pages)** + **Module B (`/prod_view/` only)** concatenated as two
IIFEs. It reaches the live site via a logscript `<script>` tag pinned to a commit SHA
(jsDelivr). The AI card / recommendation / LPT live in Module B; site-wide reskin (header,
colors, mobile aside, category bar) lives in Module A.

**Brand color unification (Module A, site-wide).** All inline-styled orange/red accents
(`#dd5119`, `#ff7a4c`, `#ff6325`, `#ff9752`, `#ff1818`, `#e8601a` …) are forced to brand
blue `#0838F8` via `[style*="<hex>"]` overrides — including the "이벤트 / 고객센터" link
(was `#ff1818`). Native orange UI (event buttons, cart badge, hover, slider dots, filter
icons) is likewise re-tinted to `#0838F8`.

**Logo cross-fade (host header + mobile aside).** The site logo gets the same 2s KO↔EN
cross-fade as the admin (`billyjo-ko.png` / `billyjo-en.png` hosted on admin2), but via
**JS `setInterval(2000)` + opacity toggle** instead of CSS keyframes: the original `<img>`
becomes KO, an absolute `width/height:100%; object-fit:contain` clone is the EN overlay.
Applied to the header logo (`.logo > img`, Module B) and the **mobile slide-out menu logo**
(`.aside__top .top__logo img`, Module A — it appears on every page, shrunk to `width:92px`
on ≤768px). See CLAUDE.md #30. **Gotcha:** never restyle a cross-fade host with
`position: static !important` — the cross-fade sets the host `position: relative` inline
(non-`!important`), and a `static !important` override unhooks the absolute EN overlay so it
flies to the nearest positioned ancestor (it once landed over the hamburger). Use
`position: relative` when left-aligning the logo.

**Header layout must be patched in Module A (global), not Module B.** The PC/mobile header
redesign runs in Module A on *every* page, so its overlap protection must live there too —
not only on `/prod_view/`. Two rules (CLAUDE.md #21e):
- **PC** — tag `bj-inj-row` / `bj-inj-left` / `bj-inj-right` on the rebuilt row at creation,
  and ship the `≤1500px` flex-wrap + `≤1024px` row-split CSS in Module A. `flex-wrap` only
  wraps on real overflow, so wide screens stay single-row; without it, `.gnb__right`
  (고객센터·장바구니) paints over the categories on home/list pages.
- **Mobile** — the header is a left-aligned `[햄버거][로고]` group: the logo is **in-flow**
  immediately right of the hamburger (not absolute-centered), with utility icons pushed
  right by `margin-left:auto`. If a page's `.header__top` logo slot is empty, JS relocates
  `a.logo` to just after the hamburger (no-op if absent).

**Mobile category bar (`.category__wrap`).** The Module-A header-redesign category strip
is a centered/left wrap with **tight spacing** (`gap: 6px 9px`, `padding: 8px 10px`); the
cloned fixed scroll-header bar (`.bj-sh-cat`) matches. Active item + the promo entry
(`.bj-newlywed-cat` 💍) use brand blue. (Distinct from the Module-B `.mobile__gnb` swipe
bar in CLAUDE.md #20.)

### Injected overlays — modal / popup (`#bj-consult-modal`, `.help-pop`)
inject.js builds its own overlays (the 상담신청 consult modal, the ⓘ help-pop). Two
invariants (CLAUDE.md #31):
- **Always scope `box-sizing: border-box` to all descendants + the container**, and put
  `overflow-x: hidden` on the scroll container. A `width:100%` button or `flex:1` cell with
  padding/border but no border-box overflows the card → its `overflow-y:auto` makes
  `overflow-x` compute to `auto` → a horizontal scrollbar, and the overflow also throws off
  centered content. The single box-sizing fix removes the scrollbar *and* re-centers the CTA.
- The consult modal is `position:fixed; inset:0; padding:16px`; the card is
  `max-width:420px; width:100%; max-height:92vh; border-radius:18px`. The primary CTA
  (`.bj-cta`, brand-blue fill, phone SVG, "지금 ○○○님과 통화") is `display:flex;
  align-items:center; justify-content:center` so icon+label center as one unit. A 4-digit
  auto-sent code box sits above it.

## Adjacent storefront components

These ship in the same `inject.js` and on the same product pages as the AI card, but they
are **separate visual systems** with their own palettes — do not force them onto the
card's `#ai-card-root` token set.

### 추천제품 — similar-product recommendation (`.bj-reco-*`)
Module B, all `/prod_view/{id}` pages. A "이런 제품은 어때요?" block placed after the card;
**all entries come from the backend reco API** (no static data). Selection follows the
3 principles in CLAUDE.md / memory: feature ≥ original, price ≤ or ≈ (±20%), clear
customer merit + higher head-office incentive.

- **Palette (own, not the card tokens):** navy text `#1A1F36`, slate `#475569` / `#94A3B8`,
  hairline `#E5E9F2`, brand blue `#0838F8` for price + accents, and a **warm-orange**
  family (`#FB923C` / `#DC2626` / `#FFF7ED`) reserved for the top-pick hero.
- **Grid card (`.bj-reco-card`)** — white, `border 1px #E5E9F2`, `rounded 18px`, `padding 14px`,
  column flex. Hover lifts (`translateY(-3px)` + soft shadow + blue border). The strongest
  match gets `.is-best` (blue border + 2px blue ring) and a top-left `.bj-reco-badge` pill.
  Inside: 4:3 thumbnail (lazy-fetched from the product's `og:image`), brand caption,
  2-line clamped name, model, a top-bordered price row (`#0838F8` 17px/800 + ↓green/↕slate
  diff vs current), strength chips (`.is-grade` = blue wash), an orange persona-match strip
  (`#FFF1EC`/`#B43E22`), and a CTA that fills blue on card hover. **Mobile (≤600px):** grid
  collapses to a horizontal `110px img | body` row layout, CTA hidden.
- **Top-pick hero (`.bj-reco-top-card`)** — the single most popular alternative, rendered
  large: warm-orange gradient bg, `2px #FB923C` border, `130px img | body | CTA` grid, a
  gradient "🔥 최고 인기" badge, red price (`#DC2626` 22px/800) and a red CTA. Orange here is
  intentional emphasis — the one place the storefront leaves brand blue. **Mobile:** drops
  to `90px img | body`, CTA hidden.

### 하단 sticky 구매 바 (`#billyjo-bottom-bar`)
A fixed bottom purchase bar (the productized successor to the `.bb-inner` handle widget in
CLAUDE.md #25). `position:fixed; bottom:0`, white, `border-top 1px #e0e0e0`,
`box-shadow 0 -4px 20px rgba(0,0,0,.08)`, `z-index 9999`; slides up via
`transform: translateY(100%) → 0` on `.show` (revealed once the card scrolls fully past).
Body gets `padding-bottom` so it never covers the last content.

- **Layout** — `max-width 1200px` inner. **Left:** product name + a horizontally
  scrollable row of month pills (`.bb-month-pill`: period + price, active = blue fill +
  shadow). **Right:** an option `<select>` + two buttons over a right-aligned price row
  (`.bb-price`, `#0838F8` 22px/800 when a selection exists, else gray).
- **Buttons** — `.bb-btn-cart` = white + 2px blue outline (secondary); `.bb-btn-rent` =
  solid blue fill, white, with a gift SVG — labelled **"렌탈+사은품 신청"** (never bare
  "렌탈 신청", never a phone icon — CLAUDE.md #25).
- **Mobile (≤767px)** — inner stacks to a column, left block gets a bottom divider, buttons
  go `flex:1` full-width, month pills shrink (`min-width 80px`), price 18px. The legacy
  `.prod_fix_wrap` sticky bars are hidden. Floating quick-call / go-top buttons auto-lift
  above the bar via `:has()` (CLAUDE.md #29).

## Do's and Don'ts

**Do**
- Use the design-token CSS variables (`var(--color-text-info)`, `var(--g-1)` …) — the
  card defines its own scoped `:root`-style variable set under `#ai-card-root`.
- Keep the **8-slot order and count** exactly; every product (F01–F14) uses the same skeleton.
- Show grades as **letter + 한글 label**, never raw scores.
- Use Pretendard 700 for emphasis (this is the storefront — bold is on-brand here).
- Namespace all new CSS under `#ai-card-root`; mount above 상품정보, full-width.
- Pre-generate everything; the live page renders cached HTML only.
- Force every native orange/red site accent to brand blue `#0838F8`; keep the storefront
  monochrome-blue except the one sanctioned warm-orange surface (the reco top-pick hero).
- Label the purchase action **"렌탈+사은품 신청"** with the gift icon — never bare "렌탈
  신청", never a phone icon.
- Put header layout patches + overlap protection in Module A (global), since the redesign
  runs on every page; keep the mobile header a left-aligned `[햄버거][로고]` group.
- Scope `box-sizing: border-box` + `overflow-x: hidden` on every injected modal/popup.

**Don't**
- Don't call AI at page load — generation-time only (rule #11).
- Don't show composition %, raw scores, decimals on the gauge, or the letter "D" for 평가없음.
- Don't reorder/merge slots, or merge the 3 gift rows into one.
- Don't use drop shadows or dashed section dividers.
- Don't import admin rules (`#1d3fd4`, weight-400/500-only, lucide) — wrong system.
- Don't leak card styles to the host site, or expose internal terms ("AI 자동생성").
- Don't let inject.js patches regress the mobile header-visibility guard.
- Don't pull the **추천제품** widget (`.bj-reco-*`, navy/slate + warm-orange) or the
  **sticky bottom bar** (`#billyjo-bottom-bar`) into the `#ai-card-root` token set — they
  are adjacent systems with their own palettes by design.
- Don't apply the logo cross-fade to the original rentalshop logo file directly — always
  swap to the admin2-hosted `billyjo-ko/en.png` first (CLAUDE.md #30).
- Don't set `position: static !important` on a cross-fade host (e.g. `a.logo`) — it unhooks
  the absolute EN overlay's anchor; use `position: relative` (CLAUDE.md #30).
- Don't leave header overlap protection in Module B only — non-product pages then regress
  (rightGroup over categories). Tag `bj-inj-*` + breakpoint CSS in Module A (CLAUDE.md #21e).
- Don't ship an injected overlay without scoped `box-sizing: border-box` — it causes a
  horizontal scrollbar and off-center content (CLAUDE.md #31).
