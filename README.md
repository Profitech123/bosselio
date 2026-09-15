# Bosselio

Reference implementation of the **Bosselio** identity — a private mortgage
office in the UAE.

- **[BRAND.md](BRAND.md)** — the creative direction: strategy, identity, colour, type, imagery, composition, atmosphere, the five signature moments, and the anti-brief
- **[ROADMAP.md](ROADMAP.md)** — priorities, phases, user stories, acceptance criteria, risks, testing checklist

## Run it

No build step, no dependencies.

```sh
python3 -m http.server 8000
# http://localhost:8000
```

## Structure

```
index.html              one page, semantic, works without JavaScript
assets/css/fonts.css    @font-face layer, subsetted by unicode-range
assets/css/tokens.css   the single source of truth — colour, type, space, motion
assets/css/bosselio.css composition and components
assets/js/bosselio.js   the overture, reveals, the Position, the seal
assets/fonts/           the three typefaces, self-hosted, with their licences
tools/leading-check.js  optional: proves display leading never collides
```

Typefaces are **self-hosted** (Cormorant Garamond, Inter, Noto Kufi Arabic —
all SIL Open Font License 1.1, licences included). No CDN, so the identity
cannot be broken by a third party being unreachable and no visitor's arrival is
announced to one. Subsets carry their `unicode-range`: a reader who never
touches Arabic never downloads it, and a typical visit pulls ~130 KB of font.

**Change colour, scale, rhythm or easing in `tokens.css` only.** No hard-coded
colour or duration lives anywhere else, which is what keeps the system from
drifting as pages are added.

## Checking display leading

The hero sets at `line-height: 0.92` — the tightest value at which no glyph ink
collides at any width from 360px to 1600px. That limit is a measurement, not a
preference, and a copy change can move it. To re-check:

```sh
python3 -m http.server 8000
npx playwright@latest install chromium     # first run only
node tools/leading-check.js 0.92
```

It exits non-zero if any descender would strike the ascender below it, so it
can gate a deploy. The site itself still has no dependencies — this is a
dev-only tool.

## What is deliberate

Restraint is the design, not an unfinished state. Before adding anything, read
the anti-brief in BRAND.md §10 — it is the review gate. In particular there is
no gold gradient, no badge row, no testimonial carousel, no sticky call-to-action,
no chat bubble, no cookie wall, and no third face.

There is also no stock photography. The compositions are drawn as layered
hairline geometry so that nothing on this page can appear on a competitor's
site. Commissioned photography replaces them at Phase 4, to the brief in
BRAND.md §5.

## Verified

No horizontal overflow at 360–1600px · 33/33 text styles pass WCAG AA · all
five faces load and take effect, with figures lining and tabular · no display
leading collision at any width · complete
with scripting disabled · honours `prefers-reduced-motion` · RTL mirrors
wholesale.

Not yet done, and listed in ROADMAP.md: the enquiry form has no backend, ledger
rates are illustrative and hard-coded, and Arabic is a scaffold rather than a
translation.

## Figures on this page

Every rate, fee and ceiling shown is **illustrative and dated**, and is labelled
as such in the interface. LTV ceilings and the 50% debt-burden cap follow
Central Bank of the UAE rules; re-verify them against current regulation before
launch, and again whenever the Ledger is edited. Nothing here is an offer of
finance.
