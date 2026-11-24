// js/auth-page.js — standalone logic for login.html (not part of the main SPA)

async function initAuthPage() {
  // Already logged in — no reason to show the login form, send them straight in.
  if (Auth.isLoggedIn()) {
    window.location.href = Auth.isAdmin() ? '/admin' : '/dashboard';
  }
}

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

document.addEventListener('DOMContentLoaded', initAuthPage);
