// ── THEME — CoproSync ──────────────────────────────────────────

const _themeMQ = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  // Met à jour le meta theme-color (barre système iOS/Android)
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#111110' : '#f5f4f1';

  // Accessibilité : label du bouton
  const btn = document.getElementById('theme-btn');
  if (btn) btn.title = theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre';
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next   = isDark ? 'light' : 'dark';

  // View Transitions API : crossfade natif sans lib
  if (document.startViewTransition) {
    document.startViewTransition(() => applyTheme(next));
  } else {
    applyTheme(next);
  }

  localStorage.setItem('coprosync-theme', next);
}

function initTheme() {
  const saved = localStorage.getItem('coprosync-theme');
  const theme = saved ?? (_themeMQ.matches ? 'dark' : 'light');
  applyTheme(theme);

  // Suit les changements OS en temps réel,
  // seulement si l'utilisateur n'a pas de préférence explicite sauvegardée
  _themeMQ.addEventListener('change', e => {
    if (!localStorage.getItem('coprosync-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}
