const clock = document.querySelector('[data-clock]');
const toast = document.querySelector('.toast');

const time = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' });
function tick() { clock.textContent = time.format(new Date()); }
tick();
setInterval(tick, 15000);

let toastTimer = 0;
function say(message) {
  toast.textContent = message;
  toast.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('on'), 2000);
}

document.querySelector('[data-copy]').addEventListener('click', async (e) => {
  try {
    await navigator.clipboard.writeText(e.currentTarget.dataset.copy);
    say('Email copied');
  } catch {
    say('Copy failed. Select the address instead.');
  }
});
