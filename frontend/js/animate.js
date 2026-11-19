// js/animate.js — scroll-reveal + stat count-up.
// Self-contained: binds itself to any matching element already on the page
// and to anything injected later (news/member/team/gallery cards etc. are
// all rendered client-side after a fetch), via a MutationObserver watching
// the whole document. No other script needs to call into this one.

(function () {
  const REVEAL_SELECTOR = [
    '.section-header', '.service-card', '.news-card', '.member-card',
    '.team-card', '.event-card', '.gallery-item', '.testimonial-card',
    '.faq-item', '.chairman-card', '.chairman-full-card',
  ].join(',');

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealObserver = prefersReducedMotion ? null : new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // A short, staggered delay per card within its own grid/list reads as
  // intentional rather than random — reset every ~6 items so a long list
  // doesn't end with absurdly long waits near the bottom.
  function bindReveal(root) {
    if (prefersReducedMotion) return;
    const els = root.querySelectorAll ? root.querySelectorAll(REVEAL_SELECTOR) : [];
    els.forEach((el, i) => {
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 6) * 0.07}s`;
      revealObserver.observe(el);
    });
  }

  function animateCount(el) {
    const target = parseInt((el.textContent || '').replace(/[^\d]/g, ''), 10);
    if (!target || el.dataset.counted) return;
    el.dataset.counted = '1';
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  function bindStatCounters(root) {
    if (prefersReducedMotion) return;
    const nums = root.querySelectorAll ? root.querySelectorAll('.stat-num') : [];
    nums.forEach((el) => {
      if (el.dataset.countBound) return;
      el.dataset.countBound = '1';
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  function scan(root) {
    bindReveal(root);
    bindStatCounters(root);
  }

  scan(document);

  // Catches every page's dynamically-rendered content (router page switches,
  // async fetch-then-render card grids) without needing a call from each
  // individual render function.
  let scanTimer = null;
  const mutationObserver = new MutationObserver(() => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => scan(document), 50);
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
})();
