document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const key = 'mindcare-theme';
  const stored = localStorage.getItem(key);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = stored || (prefersDark ? 'dark' : 'light');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(key, theme);
    document.querySelectorAll('[data-theme-label]').forEach(el => {
      el.textContent = theme === 'dark' ? 'Light mode' : 'Night mode';
    });
    document.querySelectorAll('[data-theme-icon]').forEach(el => {
      el.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    });
  }

  applyTheme(initial);

  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .stagger-item').forEach(el => observer.observe(el));
});
