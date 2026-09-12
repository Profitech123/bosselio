/* ===========================================================================
   BOSSELIO — behaviour
   Nothing here is load-bearing: with JS off the page reads in full, and with
   prefers-reduced-motion every composition arrives at its final state.
   ========================================================================= */
(() => {
  'use strict';

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* -----------------------------------------------------------------------
     I. The Aperture — once per session, 1.6s, dismissed by any input
     --------------------------------------------------------------------- */
  const overture = $('#overture');
  const seen = (() => {
    try { return sessionStorage.getItem('bosselio.overture') === 'done'; }
    catch { return false; }
  })();

  function closeOverture() {
    if (!overture || overture.classList.contains('is-done')) return;
    overture.classList.add('is-done');
    try { sessionStorage.setItem('bosselio.overture', 'done'); } catch { /* private mode */ }
    document.documentElement.classList.add('is-ready');
    window.setTimeout(() => overture.remove(), calm ? 0 : 1200);
  }

  if (!overture || seen || calm) {
    overture?.remove();
    document.documentElement.classList.add('is-ready');
  } else {
    window.setTimeout(closeOverture, 1600);
    $('[data-skip]', overture)?.addEventListener('click', closeOverture);
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t =>
      window.addEventListener(t, closeOverture, { once: true, passive: true }));
  }

  /* -----------------------------------------------------------------------
     Reveals — rise + fade. Rules draw from their origin.
     --------------------------------------------------------------------- */
  const revealable = $$('.reveal, .rule, .plate');

  if (calm || !('IntersectionObserver' in window)) {
    revealable.forEach(el => el.classList.add('is-seen'));
    $$('[data-count]').forEach(el => { el.textContent = el.dataset.count; });
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-seen');
        io.unobserve(entry.target);
        $$('[data-count]', entry.target).forEach(settle);
        if (entry.target.matches('[data-count]')) settle(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    revealable.forEach(el => io.observe(el));
  }

  /* Numerals settle into place: decelerating, with a quiet hold at the end */
  function settle(el) {
    if (el.dataset.settled) return;
    el.dataset.settled = '1';
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const t0 = performance.now(), dur = 900;
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);      // decelerate, never overshoot
      el.textContent = Math.round(target * eased).toString();
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toString();
    };
    requestAnimationFrame(tick);
  }

  /* -----------------------------------------------------------------------
     III. The Position — indicative only, and it argues back.

     Two ceilings apply to every UAE file. The LTV cap is set by Central Bank
     of the UAE regulation and varies with residency, price and whether it is
     a first property. Separately, total monthly debt may not exceed 50% of
     income. Whichever bites first is the one worth talking about.
     --------------------------------------------------------------------- */
  const RATE = 0.0410;        // indicative, illustration only
  const DSR_CAP = 0.50;       // Central Bank of the UAE debt burden ceiling
  const FEES = {
    dldTransfer: 0.04,        // Dubai Land Department transfer
    mortgageReg: 0.0025,      // + a fixed admin charge
    mortgageRegFixed: 290,
    arrangement: 0.01,        // bank arrangement, typically 0.5–1%
    valuation: 3000
  };

  /* Indicative LTV ceilings. Non-resident bands are lender policy rather
     than regulation, so they are stated conservatively. */
  function ltvCap(status, order, value) {
    if (order === 'second') {
      if (status === 'national') return 0.65;
      if (status === 'resident') return 0.60;
      return 0.50;
    }
    if (status === 'national')  return value <= 5_000_000 ? 0.85 : 0.75;
    if (status === 'resident')  return value <= 5_000_000 ? 0.80 : 0.70;
    return 0.60;                                   // non-resident, first
  }

  const monthlyRate = RATE / 12;

  /* Annuity payment for a given principal */
  function payment(loan, years) {
    const n = years * 12;
    if (loan <= 0) return 0;
    return loan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n));
  }

  /* Principal supportable by a given monthly payment — the DSR ceiling */
  function principalFrom(pmt, years) {
    const n = years * 12;
    if (pmt <= 0) return 0;
    return pmt * (1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate;
  }

  const aed = (n) => 'AED ' + Math.round(n).toLocaleString('en-AE');
  const pct = (n) => (n * 100).toFixed(1) + '%';

  const position = {
    el: $('#position'),
    value:  $('#p-value'),
    income: $('#p-income'),
    debt:   $('#p-debt'),
    tenor:  $('#p-tenor'),
    status: 'resident',
    order:  'first'
  };

  function compute() {
    const value  = Number(position.value.value);
    const income = Number(position.income.value);
    const debt   = Number(position.debt.value);
    const years  = Number(position.tenor.value);

    const cap = ltvCap(position.status, position.order, value);
    const byLtv = value * cap;

    const headroom = Math.max(income * DSR_CAP - debt, 0);
    const byDsr = principalFrom(headroom, years);

    const loan = Math.max(Math.min(byLtv, byDsr), 0);
    const pmt  = payment(loan, years);
    const down = value - loan;
    const fees = value * FEES.dldTransfer
               + loan * FEES.mortgageReg + FEES.mortgageRegFixed
               + loan * FEES.arrangement
               + FEES.valuation;

    /* Which ceiling binds — and one sentence of plain language on it */
    let bind;
    if (headroom <= 0) {
      bind = `<b>Your existing commitments bind this file.</b> They already
        absorb the 50% of income a lender is allowed to count, so there is no
        room for a mortgage payment until something is cleared. This is a
        solvable problem and usually the first thing we work on.`;
    } else if (byDsr < byLtv * 0.995) {
      bind = `<b>Your income, not the loan-to-value cap, is what limits this
        file.</b> Regulation would allow you to borrow ${aed(byLtv)} against a
        property at this price, but the 50% debt burden ceiling stops you at
        roughly ${aed(byDsr)}. A larger down payment does not move this
        &mdash; a longer tenor, a second applicant, or income a lender will
        count differently does.`;
    } else if (byLtv < byDsr * 0.995) {
      bind = `<b>The loan-to-value cap binds, not your income.</b> You could
        service more than this, but at ${pct(cap)}
        ${position.status === 'non-resident'
          ? 'on a non-resident file '
          : (position.order === 'second' ? 'on a second property ' : '')}the
        ceiling is ${aed(byLtv)}. The constraint here is cash at transfer, not
        affordability &mdash; so the conversation is about the
        ${aed(down)} down payment and the ${aed(fees)} of costs on top of it.`;
    } else {
      bind = `<b>Both ceilings land in the same place.</b> Your income and the
        ${pct(cap)} loan-to-value cap allow almost exactly the same loan, which
        is an unusually efficient position &mdash; and a fragile one. Any rate
        rise at renewal tightens it, so we would want the longer fix here.`;
    }

    $('[data-figure]', position.el).textContent = Math.round(pmt).toLocaleString('en-AE');
    $('[data-loan]', position.el).textContent = aed(loan);
    $('[data-down]', position.el).textContent = aed(down);
    $('[data-ltv]',  position.el).textContent = value ? pct(loan / value) : '—';
    $('[data-fees]', position.el).textContent = aed(fees) + ' at transfer';
    $('#p-bind').innerHTML = bind;

    $('#p-value-out').textContent  = aed(value);
    $('#p-income-out').textContent = aed(income);
    $('#p-debt-out').textContent   = aed(debt);
    $('#p-tenor-out').textContent  = years + (years === 1 ? ' year' : ' years');
  }

  if (position.el) {
    [position.value, position.income, position.debt, position.tenor]
      .forEach(input => input.addEventListener('input', compute));

    /* Segmented controls: aria-pressed is the state, styling follows it */
    const bindSegments = (id, key) => {
      const group = $(id);
      if (!group) return;
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        $$('button', group).forEach(b =>
          b.setAttribute('aria-pressed', String(b === btn)));
        position[key] = btn.dataset[key];
        compute();
      });
    };
    bindSegments('#p-status', 'status');
    bindSegments('#p-order', 'order');

    compute();
  }

  /* -----------------------------------------------------------------------
     V. The Counsel Card — the seal draws; there is no spinner
     --------------------------------------------------------------------- */
  const form = $('#counsel-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = $$('[required]', form);
    const missing = required.filter(f => !f.value.trim());
    missing.forEach(f => { f.style.borderBottomColor = 'var(--caution)'; });
    if (missing.length) { missing[0].focus(); return; }

    /* Wire to the practice's intake endpoint here. Until then the card
       completes locally rather than pretending to have sent anything. */
    const sent = $('#counsel-sent');
    form.hidden = true;
    sent.hidden = false;
    sent.setAttribute('role', 'status');
    sent.querySelector('.display')?.focus?.();
  });

  $$('[required]', form || document).forEach(f =>
    f.addEventListener('input', () => { f.style.borderBottomColor = ''; }));
})();
