#!/usr/bin/env node
/**
 * Display leading check — does any glyph ink collide?
 *
 * Tight leading on a high-contrast serif is decided by one thing: whether a
 * descender on one line touches an ascender on the next. Eyeballing that is
 * unreliable, and a screenshot only ever shows one viewport width, so this
 * measures it directly.
 *
 * For every 20px of viewport width it walks each character of the target
 * element, takes its real ink extents from canvas TextMetrics, groups the
 * characters into visual lines, and reports any pair on adjacent lines whose
 * horizontal ranges overlap and whose ink would touch.
 *
 * Optional dev tool — the site itself has no dependencies. Needs Playwright
 * and a server on the page you are testing:
 *
 *   python3 -m http.server 8000
 *   npx playwright@latest install chromium      # first run only
 *   node tools/leading-check.js 0.92
 *   node tools/leading-check.js 0.92 "#hero-h" http://localhost:8000
 *
 * Set CHROMIUM_PATH to point at a specific Chromium build if needed.
 *
 * Exits non-zero if anything collides, so it can gate a deploy.
 */
const { chromium } = require('playwright');

const LINE_HEIGHT = Number(process.argv[2] || 0.92);
const TARGET      = process.argv[3] || '#hero-h';
const ORIGIN      = process.argv[4] || 'http://localhost:8000';
const MIN = 360, MAX = 1600, STEP = 20;

/* Runs in the page. Returns the worst ink clearance between adjacent lines. */
async function probe({ selector, lineHeight }) {
  await document.fonts.ready;
  const el = document.querySelector(selector);
  if (!el) return { error: `no element matching ${selector}` };

  const style = document.getElementById('leading-probe')
    || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'leading-probe' }));
  style.textContent = lineHeight
    ? `${selector} { line-height: ${lineHeight} !important; }` : '';
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const ctx = document.createElement('canvas').getContext('2d');
  const glyphs = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walk.nextNode())) {
    const cs = getComputedStyle(node.parentElement);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize)}px ${cs.fontFamily}`;
    for (let i = 0; i < node.length; i++) {
      const ch = node.data[i];
      if (!ch.trim()) continue;
      const range = document.createRange();
      range.setStart(node, i); range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (!rect.width) continue;
      const m = ctx.measureText(ch);
      glyphs.push({
        ch, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        inkAsc: m.actualBoundingBoxAscent, inkDesc: m.actualBoundingBoxDescent
      });
    }
  }
  if (!glyphs.length) return { error: 'no rendered text' };

  // Group into visual lines, then place each line's baseline from its tallest glyph.
  const byLine = new Map();
  for (const g of glyphs) {
    const key = Math.round(g.top / 4);
    if (!byLine.has(key)) byLine.set(key, []);
    byLine.get(key).push(g);
  }
  const lines = [...byLine.values()].sort((a, b) => a[0].top - b[0].top);
  for (const gs of lines) {
    const ref = gs.reduce((a, g) => (g.inkAsc > a.inkAsc ? g : a), gs[0]);
    const baseline = ref.top + (ref.bottom - ref.top) / 2 + (ref.inkAsc - ref.inkDesc) / 2;
    for (const g of gs) g.baseline = baseline;
  }

  let worst = Infinity, pair = '';
  for (let i = 1; i < lines.length; i++) {
    for (const above of lines[i - 1]) {
      for (const below of lines[i]) {
        if (above.right <= below.left || below.right <= above.left) continue;  // no x overlap
        const clearance = (below.baseline - below.inkAsc) - (above.baseline + above.inkDesc);
        if (clearance < worst) { worst = clearance; pair = `${above.ch}/${below.ch}`; }
      }
    }
  }
  return { lines: lines.length, worst: worst === Infinity ? null : +worst.toFixed(2), pair };
}

(async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
  const page = await browser.newPage({ viewport: { width: MAX, height: 900 } });
  await page.goto(`${ORIGIN}/index.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('.reveal, .rule, .plate').forEach(e => e.classList.add('is-seen'));
    document.getElementById('overture')?.remove();
  });

  const collisions = [];
  let tightest = { worst: Infinity };
  for (let w = MIN; w <= MAX; w += STEP) {
    await page.setViewportSize({ width: w, height: 900 });
    const r = await page.evaluate(probe, { selector: TARGET, lineHeight: LINE_HEIGHT });
    if (r.error) { console.error(r.error); process.exit(2); }
    if (r.worst !== null && r.worst < tightest.worst) tightest = { ...r, w };
    if (r.worst !== null && r.worst < 0) collisions.push(`  ${w}px  ${r.worst}px  (${r.pair})  ${r.lines} lines`);
  }
  await browser.close();

  console.log(`${TARGET} at line-height ${LINE_HEIGHT}`);
  if (tightest.worst !== Infinity) {
    console.log(`  tightest clearance: ${tightest.worst}px at ${tightest.w}px (${tightest.pair})`);
  }
  if (collisions.length) {
    console.log(`\n  INK COLLIDES at ${collisions.length} widths:`);
    collisions.forEach(c => console.log(c));
    process.exit(1);
  }
  console.log('  no collisions between 360px and 1600px');
})();
