const aura = document.querySelector('.aura');
const toast = document.querySelector('.toast');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

// The aura leans gently toward the cursor
if (!calm.matches) {
  let frame = 0;
  addEventListener('pointermove', (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const x = (e.clientX / innerWidth - 0.5) * 60;
      const y = (e.clientY / innerHeight - 0.5) * 40;
      aura.style.setProperty('--ax', `${x}px`);
      aura.style.setProperty('--ay', `${y}px`);
    });
  });
}

let toastTimer = 0;
function say(message) {
  toast.textContent = message;
  toast.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('on'), 2200);
}

document.querySelector('[data-copy]').addEventListener('click', async (e) => {
  try {
    await navigator.clipboard.writeText(e.currentTarget.dataset.copy);
    say('Email copied');
  } catch {
    say('Copy failed. Select the address above instead.');
  }
});
