// Runs before the page paints: refuse to be framed by another site, restore the theme, decide on the intro
// Browsers often block a framed page from breaking out, so it also hides itself
if (window.top !== window.self) {
  document.documentElement.style.display = 'none';
  try {
    window.top.location.replace(window.location.href);
  } catch {}
}
try {
  if (localStorage.getItem('theme') === 'purple') document.documentElement.dataset.theme = 'purple';
} catch {}
// White is the main look; the dark mode is the switch-on mode
if (document.documentElement.dataset.theme !== 'purple') document.documentElement.dataset.theme = 'white';
try {
  // The intro plays once per visit, never for people who prefer less motion
  if (!sessionStorage.getItem('intro') && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('intro-on');
} catch {}
