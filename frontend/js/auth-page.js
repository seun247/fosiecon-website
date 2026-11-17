// js/auth-page.js — standalone logic for login.html (not part of the main SPA)

function esc(s) { return (s || '').toString().replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }

async function initAuthPage() {
  // Already logged in — no reason to show the login form, send them straight in.
  if (Auth.isLoggedIn()) {
    window.location.href = Auth.isAdmin() ? '/admin' : '/dashboard';
    return;
  }

  try {
    const { data: members } = await api.members.getAll();
    const select = document.getElementById('reg-commission');
    if (select) select.innerHTML = '<option value="">— Select —</option>' + members.map((m) => `<option value="${m._id}">${esc(m.state)} — ${esc(m.commissionName)}</option>`).join('');
  } catch (err) { /* optional field — fine if it stays empty */ }
}

window.toggleAuthForm = function () {
  const login = document.getElementById('login-form');
  const register = document.getElementById('register-form');
  const isLogin = login.style.display !== 'none';
  login.style.display = isLogin ? 'none' : '';
  register.style.display = isLogin ? '' : 'none';
  setText('auth-heading', isLogin ? 'Create Your Account' : 'Welcome Back');
  setText('auth-subtext', isLogin ? 'Register as a member-state representative.' : 'Sign in to access your FOSIECON member account.');
};

window.handleLogin = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';
  try {
    const user = await Auth.login(document.getElementById('login-email').value, document.getElementById('login-password').value);
    window.location.href = ['super_admin', 'admin', 'staff'].includes(user.role) ? '/admin' : '/dashboard';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
};

window.handleRegister = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('register-error');
  errorEl.style.display = 'none';
  try {
    await Auth.register({
      fullName: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      phone: document.getElementById('reg-phone').value,
      memberCommission: document.getElementById('reg-commission').value || undefined,
      password: document.getElementById('reg-password').value,
    });
    window.location.href = '/dashboard';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
};

document.addEventListener('DOMContentLoaded', initAuthPage);
