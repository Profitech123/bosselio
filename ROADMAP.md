# Bosselio — build plan

What exists today is **Phase 0: the reference implementation** — one page that
proves the identity end to end, with no framework, no build step and no
dependencies. It is the design system made executable, and the thing to show a
principal before anyone commissions photography or writes a backend.

---

## Priorities

| # | Outcome | Why it is ranked here |
|---|---|---|
| P0 | The identity is legible and defensible in a browser | Nothing else can be judged until the art direction is real rather than described |
| P1 | An enquiry reaches a human advisor reliably | The Counsel Card is the only conversion path; today it completes locally and sends nothing |
| P2 | Arabic, in full | A UAE private-client brand that is English-only contradicts its own positioning |
| P3 | The Ledger is maintained without a developer | Rates move. If updating them needs a deploy, it silently rots |
| P4 | Commissioned photography replaces the drawn plates | Drawn geometry is a credible interim, not the finished art direction |

---

## Phase 0 — Reference implementation *(done)*

- Tokens as the single source of truth (`assets/css/tokens.css`)
- All five signature moments built: Aperture, Ledger, Position, Chapters, Counsel Card
- Verified: no horizontal overflow at 360–1600px; 33/33 text styles pass WCAG AA;
  works with scripting disabled; honours `prefers-reduced-motion`; RTL mirrors

**Known limits, stated plainly:** the enquiry form has no backend; ledger rates
are hard-coded and illustrative; Arabic is a lockup and a scaffold, not a
translation; webfont rendering was not verifiable in the build sandbox (Google
Fonts is blocked there) so the pairing should be eyeballed once on a real
network.

---

## Phase 1 — Make the enquiry real

**Story.** *As a prospective client, I send my file in three fields and hear
from one named advisor within a working day, once.*

Acceptance criteria
- [ ] Submission persists server-side before the seal is drawn; a failure shows a recoverable error, never a false confirmation
- [ ] The advisor is notified within 60 seconds (email + WhatsApp)
- [ ] Spam is filtered without a CAPTCHA — a CAPTCHA breaks the premise (anti-brief, BRAND.md §10)
- [ ] Rate-limited per IP; no enquiry is silently dropped
- [ ] The success copy names what happens next and remains accurate
- [ ] Data retention and DPA position documented before launch

Dependencies: an intake endpoint, a mailbox, the practice's chosen CRM.

**Story.** *As the practice, I can prove where every enquiry came from without
putting a tracker on the client.*
- [ ] Server-side attribution only; no third-party analytics script
- [ ] Cookie-free by default, so no consent wall is needed

## Phase 2 — Arabic, properly

**Story.** *As an Arabic-first client, the site reads as though it was written
in Arabic, not translated into it.*
- [ ] `/ar` with `dir="rtl"`, full copy translated by a native financial-Arabic writer
- [ ] Latin and Arabic lockups at optical parity; Arabic never subordinate
- [ ] Numerals, currency and dates follow the ar-AE convention
- [ ] Every RTL view re-verified for overflow at 360–1600px
- [ ] `hreflang` pairs; language choice persists

Dependency: translation is the critical path — commission it at Phase 1 start.

## Phase 3 — The Ledger, maintained

**Story.** *As an advisor, I update panel terms myself and the sheet is never
stale or wrong.*
- [ ] Terms move to structured data (CMS or flat file), not markup
- [ ] Each row carries `effective_from`; the sheet renders its own "as at" date
- [ ] The recommended row and its rationale are editable per file
- [ ] A stale sheet (older than 30 days) warns the practice, not the client
- [ ] Client-specific sheets can be generated as PDF in the same art direction

## Phase 4 — Commissioned photography

- [ ] Shoot brief written from BRAND.md §5; material detail at blue hour, no skylines
- [ ] Minimum eight usable frames; graded to the stated recipe
- [ ] AVIF/WebP with correct `sizes`; LCP stays under 2.0s on 4G
- [ ] Drawn plates retained as the fallback and for print

## Phase 5 — The advisory surface

Beyond the brochure: a private client view for a live file — chapter state,
documents outstanding, the sheet as issued. Same identity, authenticated.
Scope after Phase 1 proves enquiry volume.

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Illustrative rates read as an offer | **High** — regulatory exposure | Every figure already labelled indicative and dated; legal review before launch; Phase 3 adds "as at" dates |
| Restraint is mistaken for emptiness by a stakeholder | High | The hero's three proof points and the Ledger carry the substance; resist adding badges — that is the anti-brief |
| Discretion converts more slowly than a lead-gen template | Medium | Measure enquiry *quality* and file value, never raw volume; the premise is fewer, larger files |
| Slow motion reads as slow performance | Medium | Reveals are opacity/transform only; nothing blocks paint; overture is skippable and once-per-session |
| Webfonts fail or are blocked in-region | Medium | Fallback stack is declared; self-host the three faces at Phase 1 to remove the third-party dependency |
| Arabic added late and treated as a translation layer | Medium | Phase 2 commissioned at Phase 1 start, by a native writer |
| Two faces become five as pages are added | Low but corrosive | The anti-brief is the review gate for every new page |

---

## Testing checklist

Run before any deploy.

**Composition**
- [ ] No horizontal scroll at 360, 390, 600, 768, 1024, 1280, 1440, 1600px — verify by rendered page width, not `scrollWidth` (`overflow-x: clip` masks it)
- [ ] Paper passages bleed fully to the viewport edge
- [ ] Ledger reflows to stacked sheets below 760px, with no clipped copy
- [ ] Brass covers under 4% of any viewport; no two accents adjacent

**Type**
- [ ] Exactly two Latin faces load; one serif weight only
- [ ] No rate set larger than the sentence explaining it
- [ ] Numerals tabular and column-aligned in the Ledger
- [ ] Measure stays at or under 66ch

**Accessibility**
- [ ] Every text style meets WCAG AA at its rendered size — re-run the contrast pass after any token change, compositing alpha over the real background
- [ ] Full keyboard traversal; focus visible as a brass outline at every stop
- [ ] `prefers-reduced-motion` delivers the final state, instantly
- [ ] Page is complete and readable with scripting disabled
- [ ] Tap targets 44px minimum

**Behaviour**
- [ ] Overture runs once per session, is skippable by any input, and survives private browsing (the `sessionStorage` access is guarded)
- [ ] The Position names the correct binding constraint in all four cases: DSR-bound, LTV-bound, both equal, and no headroom
- [ ] LTV ceilings match current Central Bank of the UAE rules for each residency and property-order combination
- [ ] Empty enquiry cannot submit; a valid one draws the seal
- [ ] Reveals fire once and do not re-trigger

**Anti-brief**
- [ ] Nothing from BRAND.md §10 has appeared
