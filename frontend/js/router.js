// js/router.js — Client-side page router

// Per-page <title>/description/canonical — without this every route served
// the exact same tags (all from the one shared index.html), which is weak
// for search since Google then sees identical titles/snippets for every
// page on the site instead of ones that actually describe that page.
const PAGE_SEO = {
  home: {
    title: 'FOSIECON | Forum of State Independent Electoral Commissions of Nigeria',
    description: "FOSIECON brings together Nigeria's 36 State Independent Electoral Commissions under one umbrella for communication, planning, and best-practice sharing on electoral processes, in line with the Constitution and the Electoral Act 2026.",
  },
  about: {
    title: 'About FOSIECON | Forum of State Independent Electoral Commissions of Nigeria',
    description: "FOSIECON was established in 2000 to bring together Nigeria's 36 State Independent Electoral Commissions for easy communication and planning on Local Government electoral processes.",
  },
  services: {
    title: 'Our Services | FOSIECON',
    description: 'Electoral management support, election observation and monitoring, support for sister states, and best-practice sharing across all 36 State Independent Electoral Commissions.',
  },
  team: {
    title: 'Member Commissions | FOSIECON',
    description: "Directory of Nigeria's 36 State Independent Electoral Commissions and the Forum's leadership.",
  },
  news: {
    title: 'News & Communiqués | FOSIECON',
    description: 'Latest news, communiqués, and press releases from the Forum of State Independent Electoral Commissions of Nigeria.',
  },
  gallery: {
    title: 'Photo & Video Gallery | FOSIECON',
    description: 'Photos and videos from FOSIECON events, meetings, and election observation activities.',
  },
  events: {
    title: 'Events & Activities | FOSIECON',
    description: "Upcoming and past events from the Forum of State Independent Electoral Commissions of Nigeria.",
  },
  downloads: {
    title: 'Publications | FOSIECON',
    description: 'Official FOSIECON documents, communiqués, guidelines, and reports.',
  },
  testimonials: {
    title: 'Testimonials | FOSIECON',
    description: "What member commissions and partners say about FOSIECON.",
  },
  faq: {
    title: 'Frequently Asked Questions | FOSIECON',
    description: 'Answers to common questions about FOSIECON, its membership, and its mandate.',
  },
  contact: {
    title: 'Contact FOSIECON',
    description: 'Get in touch with the Forum of State Independent Electoral Commissions of Nigeria.',
  },
  privacy: {
    title: 'Privacy Policy & Terms | FOSIECON',
    description: 'Privacy policy and terms of use for the FOSIECON website.',
  },
};
// Pages that exist in this same index.html but are never meant to appear in
// search results (behind login, or just not public content).
const NOINDEX_PAGES = new Set(['admin', 'dashboard']);

function updatePageSeo(pageId) {
  const meta = PAGE_SEO[pageId];
  if (meta) {
    document.title = meta.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', meta.description);
  }

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = pageId === 'home' ? 'https://fosieconng.org/' : `https://fosieconng.org/${pageId}`;

  let robotsTag = document.querySelector('meta[name="robots"]');
  if (!robotsTag) {
    robotsTag = document.createElement('meta');
    robotsTag.name = 'robots';
    document.head.appendChild(robotsTag);
  }
  robotsTag.setAttribute('content', NOINDEX_PAGES.has(pageId) ? 'noindex, nofollow' : 'index, follow');
}

const Router = {
  currentPage: 'home',
  // 'login' is intentionally not in this list — it's a separate static page
  // (login.html), not an SPA section, so it only ever exists when someone
  // actually visits it directly.
  pages: ['home', 'about', 'services', 'gallery', 'news', 'testimonials',
          'faq', 'team', 'events', 'downloads', 'contact', 'dashboard', 'admin', 'privacy'],

  init() {
    const path = window.location.pathname.replace(/^\/|\/$/g, '') || 'home';
    this.navigate(this.pages.includes(path) ? path : 'home', false);

    // Back/forward browser navigation (pushState itself does not fire this).
    window.addEventListener('popstate', () => {
      const path = window.location.pathname.replace(/^\/|\/$/g, '') || 'home';
      if (this.pages.includes(path)) this.navigate(path, false);
    });
  },

  navigate(pageId, updateUrl = true) {
    // Guard admin page
    if (pageId === 'admin' && !Auth.isAdmin()) {
      window.location.href = 'login';
      return;
    }
    // Guard member dashboard
    if (pageId === 'dashboard' && !Auth.isLoggedIn()) {
      window.location.href = 'login';
      return;
    }

    // Close any open modal so it can't get left stuck on top of the next
    // page (also stops any embedded video/audio still playing inside it).
    document.querySelectorAll('.modal-overlay.open, .gallery-modal.open').forEach(m => {
      m.classList.remove('open');
      const iframe = m.querySelector('iframe');
      if (iframe) iframe.src = '';
    });

    // Hide all sections
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));

    const section = document.getElementById('page-' + pageId);
    if (!section) return;

    updatePageSeo(pageId);
    section.classList.add('active');
    // Fade/rise the new page in — two rAFs so the browser commits the
    // "entering" state (opacity 0) before the "active" state is added,
    // otherwise both classes would apply in the same frame and never
    // actually transition.
    section.classList.add('page-enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => section.classList.add('page-enter-active'));
    });
    setTimeout(() => section.classList.remove('page-enter', 'page-enter-active'), 350);
    this.currentPage = pageId;

    // The admin portal is a standalone screen — hide the public site's
    // navbar so it isn't a mix of "public site + admin panel".
    const isAdminPage = pageId === 'admin';
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.style.display = isAdminPage ? 'none' : '';
    document.body.classList.toggle('admin-mode', isAdminPage);

    if (updateUrl) {
      const path = pageId === 'home' ? '/' : '/' + pageId;
      if (window.location.pathname !== path) history.pushState({ page: pageId }, '', path);
    }

    // Update nav active state
    document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.page === pageId);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger page load function if exists
    const loaderFn = window[`load_${pageId}`];
    if (typeof loaderFn === 'function') loaderFn();
  },
};

// js/auth.js — Auth state management
const Auth = {
  TOKEN_KEY: 'fosiecon_token',
  USER_KEY:  'fosiecon_user',

  getToken() { return localStorage.getItem(this.TOKEN_KEY); },
  getUser()  {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY)); }
    catch { return null; }
  },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin()    {
    const u = this.getUser();
    return u && ['super_admin', 'admin', 'staff'].includes(u.role);
  },
  isSuperAdmin() {
    const u = this.getUser();
    return u && u.role === 'super_admin';
  },

  async login(email, password) {
    const res = await api.auth.login({ email, password });
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    return res.user;
  },

  async logout() {
    try { await api.auth.logout(); } catch (e) { /* non-blocking */ }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    Router.navigate('home');
    renderNavForRole();
  },
};

// ── Nav rendering based on login state ──────────────────────
function renderNavForRole() {
  const user = Auth.getUser();
  const adminLink = document.getElementById('nav-admin-link');
  const dashLink  = document.getElementById('nav-dashboard-link');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const loginBtn  = document.getElementById('nav-login-btn');

  if (user && Auth.isAdmin()) {
    if (adminLink)  adminLink.style.display = 'inline-flex';
    if (dashLink)   dashLink.style.display  = 'none';
    if (logoutBtn)  logoutBtn.style.display = 'inline-flex';
    if (loginBtn)   loginBtn.style.display  = 'none';
  } else if (user) {
    if (adminLink)  adminLink.style.display = 'none';
    if (dashLink)   dashLink.style.display  = 'inline-flex';
    if (logoutBtn)  logoutBtn.style.display = 'inline-flex';
    if (loginBtn)   loginBtn.style.display  = 'none';
  } else {
    if (adminLink)  adminLink.style.display = 'none';
    if (dashLink)   dashLink.style.display  = 'none';
    if (logoutBtn)  logoutBtn.style.display = 'none';
    if (loginBtn)   loginBtn.style.display  = 'inline-flex';
  }
}

window.Router = Router;
window.Auth   = Auth;
window.renderNavForRole = renderNavForRole;
