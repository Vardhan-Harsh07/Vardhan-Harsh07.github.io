const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduced ? 0 : ms));
const root = document.documentElement;
const EMAIL = 'vardhanharsh806@gmail.com';
const NOW = 'Learning the ins and outs of Meta ads.';

/* ---------- Latent field: skills as points in an embedding space ---------- */

const CLUSTERS = [
  { x: 0.14, y: 0.86, terms: ['LangGraph', 'RAG', 'Planner', 'Reflection', 'Serper.dev', 'GPT-4o', 'Claude API', 'Prompting'] },
  { x: 0.50, y: 0.90, terms: ['CNN', 'TensorRT', 'Ensemble', '38 classes', 'TensorFlow', 'Keras'] },
  { x: 0.88, y: 0.80, terms: ['Scoring engine', 'XGBoost', 'LightGBM', 'Calibration', 'Signals'] },
  { x: 0.90, y: 0.14, terms: ['Enterprise', 'Onboarding', 'SOPs', 'Support', 'Debugging'] },
  { x: 0.62, y: 0.06, terms: ['Springer', 'ICICC-2026', 'Health ML'] },
  { x: 0.38, y: 0.05, terms: ['Next.js', 'pgvector', 'Trigger.dev', 'Briefings', 'Reddit'] },
  { x: 0.67, y: 0.56, terms: ['Python', 'SQL', 'C++', 'Flask', 'Streamlit', 'Zephyr-7B', 'Hugging Face', 'LSTM'] },
];

function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ON_BLUE = () => ({ dot: '255, 255, 255', lit: '255, 228, 92' });

function createField(canvas, { dotsPerCluster = 22, labelAlpha = 0.34, origin = null, colors = ON_BLUE, constellation = false } = {}) {
  const ctx = canvas.getContext('2d');
  const rand = seeded(11);
  const spread = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const points = [];
  for (const cluster of CLUSTERS) {
    for (const label of cluster.terms) {
      points.push({ x: cluster.x + spread() * 0.1, y: cluster.y + spread() * 0.09, z: 0.55 + rand() * 0.45, phase: rand() * 6.28, label });
    }
    for (let i = 0; i < dotsPerCluster; i += 1) {
      points.push({ x: cluster.x + spread() * 0.16, y: cluster.y + spread() * 0.14, z: 0.3 + rand() * 0.7, phase: rand() * 6.28 });
    }
  }

  let width = 0;
  let height = 0;
  let lit = new Set();
  let strength = 0;
  let target = 0;
  let mouseX = 0;
  let mouseY = 0;
  let visible = true;
  let frame = 0;
  let palette = colors();

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spaceLabels();
    draw(performance.now());
  }

  // Nudge labels apart so neighbouring terms in a cluster don't overprint.
  function spaceLabels() {
    ctx.font = '400 11px "Geist Mono", monospace';
    const labelled = points.filter((p) => p.label);
    for (const p of labelled) {
      p.ox = 0;
      p.oy = 0;
      p.w = ctx.measureText(p.label).width + 14;
    }
    for (let pass = 0; pass < 40; pass += 1) {
      for (let i = 0; i < labelled.length; i += 1) {
        for (let j = i + 1; j < labelled.length; j += 1) {
          const a = labelled[i];
          const b = labelled[j];
          const ax = a.x * width + a.ox;
          const bx = b.x * width + b.ox;
          const ay = a.y * height + a.oy;
          const by = b.y * height + b.oy;
          const overlapX = Math.min(ax + a.w, bx + b.w) - Math.max(ax, bx);
          const overlapY = 18 - Math.abs(ay - by);
          if (overlapX > 0 && overlapY > 0) {
            const push = overlapY / 2 + 0.5;
            const dir = ay <= by ? -1 : 1;
            a.oy += dir * push;
            b.oy -= dir * push;
          }
        }
      }
    }
  }

  function draw(time) {
    strength += (target - strength) * (reduced ? 1 : 0.07);
    ctx.clearRect(0, 0, width, height);
    const from = origin?.();
    const t = reduced ? 0 : time;
    const litPoints = [];

    for (const p of points) {
      const drift = p.label ? 0.3 : 1;
      const px = (p.x + (Math.sin(t * 0.00018 * p.z + p.phase) * 0.008 + mouseX * 0.012 * p.z) * drift) * width + (p.ox ?? 0);
      const py = (p.y + (Math.cos(t * 0.00015 * p.z + p.phase) * 0.01 + mouseY * 0.012 * p.z) * drift) * height + (p.oy ?? 0);
      const on = p.label && lit.has(p.label);

      if (on && from && strength > 0.01) {
        ctx.strokeStyle = `rgba(${palette.lit}, ${0.55 * strength})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      if (on) litPoints.push([px, py]);

      if (p.label) {
        ctx.fillStyle = on ? `rgba(${palette.lit}, ${0.35 + 0.65 * strength})` : `rgba(${palette.dot}, ${labelAlpha * p.z})`;
        ctx.beginPath();
        ctx.arc(px, py, on ? 3.5 : 2.2, 0, Math.PI * 2);
        ctx.fill();
        if (on || width > 760) {
          ctx.font = `${on ? 500 : 400} ${on ? 13 : 11}px "Geist Mono", monospace`;
          ctx.fillText(p.label, px + 7, py + 4);
        }
      } else {
        ctx.fillStyle = `rgba(${palette.dot}, ${0.22 * p.z})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.3 * p.z, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (constellation && litPoints.length > 1 && strength > 0.01) {
      ctx.strokeStyle = `rgba(${palette.lit}, ${0.4 * strength})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      litPoints.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function loop(time) {
    frame = 0;
    if (!visible) return;
    draw(time);
    if (!reduced) frame = requestAnimationFrame(loop);
  }

  function kick() {
    if (!frame && visible) frame = requestAnimationFrame(loop);
  }

  new ResizeObserver(resize).observe(canvas);
  document.fonts?.ready.then(resize);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) kick();
  }).observe(canvas);

  if (!reduced) {
    canvas.parentElement.addEventListener('pointermove', (event) => {
      const box = canvas.getBoundingClientRect();
      mouseX = (event.clientX - box.left) / box.width - 0.5;
      mouseY = (event.clientY - box.top) / box.height - 0.5;
    });
  }

  return {
    focus(labels) {
      lit = new Set(labels);
      target = labels.length ? 1 : 0;
      if (reduced) draw(0);
      else kick();
    },
    clear() {
      target = 0;
      if (reduced) draw(0);
    },
    refreshColors() {
      palette = colors();
      draw(performance.now());
    },
  };
}

/* ---------- Shared helpers ---------- */

const toastEl = document.querySelector('.toast');
let toastTimer = 0;
function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

async function copyEmail() {
  const status = document.querySelector('.copy-status');
  try {
    await navigator.clipboard.writeText(EMAIL);
    status.textContent = 'Copied to your clipboard.';
    toast('Email address copied.');
  } catch {
    status.textContent = "Couldn't copy automatically. Select the address and copy it.";
  }
}

function jumpTo(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  target.classList.remove('flash');
  void target.offsetWidth;
  target.classList.add('flash');
}

function isEditable(element) {
  return element?.matches?.('input, textarea, select, [contenteditable="true"]');
}

/* ---------- Theme ---------- */

const themeSwitch = document.querySelector('.theme-switch');
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.theme ?? (systemDark.matches ? 'dark' : 'light')) === 'dark';
const cssColor = (name) => getComputedStyle(root).getPropertyValue(name).trim();

const deskField = createField(document.querySelector('.desk-field'), {
  dotsPerCluster: 16,
  labelAlpha: 0.3,
  constellation: true,
  colors: () => ({ dot: cssColor('--field-dot'), lit: cssColor('--field-lit') }),
});

function syncTheme() {
  themeSwitch.setAttribute('aria-checked', String(isDark()));
  deskField.refreshColors();
}

function setTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {}
  syncTheme();
  toast(`Switched to the ${theme} theme.`);
}

const toggleTheme = () => setTheme(isDark() ? 'light' : 'dark');
themeSwitch.addEventListener('click', toggleTheme);
systemDark.addEventListener('change', syncTheme);
syncTheme();

/* ---------- The agent ---------- */

const SOURCES = {
  1: ['inboxkit', 'InboxKit'],
  2: ['arcflip', 'Arcflip'],
  3: ['redditmind', 'RedditMind'],
  4: ['assistant', 'Research Assistant'],
  5: ['krishi', 'Krishi Saahayak'],
  6: ['papers', 'ICICC paper'],
  7: ['papers', 'Springer 2025'],
  8: ['talentscout', 'TalentScout'],
  9: ['bennett', 'Bennett'],
};
const SOURCE_COUNT = Object.keys(SOURCES).length;

const ANSWERS = [
  {
    ask: 'Who is Harsh Vardhan Chauhan?',
    match: /\b(who|about|intro|yourself|summary)\b/i,
    keys: ['who', 'about', 'introduction', 'summary', 'background', 'harsh', 'profile'],
    parts: 3,
    terms: ['Enterprise', 'LangGraph', 'Ensemble', 'Scoring engine', 'Reddit', 'Springer'],
    text: "Harsh is a Forward Deployed Engineer at InboxKit, where he's the engineer enterprise customers work with when something breaks [1]. He built a Perplexity-style multi-agent research system [4], a crop-disease model with 99.55% accuracy that became a Springer paper [5] [6], and the scoring engine behind Arcflip's career matching [2]. Right now he's building RedditMind [3].",
  },
  {
    ask: 'What has he shipped?',
    match: /\b(ship|shipped|built|build|projects?|made|portfolio)\b/i,
    keys: ['shipped', 'built', 'projects', 'portfolio', 'made', 'products', 'work', 'krishi', 'talentscout', 'arcflip'],
    parts: 2,
    terms: ['LangGraph', 'RAG', 'CNN', 'TensorRT', 'Zephyr-7B', 'Scoring engine'],
    text: "A multi-agent deep-research system that plans, searches, checks its own claims and writes cited reports [4]. Krishi Saahayak, which spots 38 crop diseases from a leaf photo at 99.55% accuracy and runs in real time on TensorRT [5]. TalentScout, a screening bot that writes interview questions for each candidate's stack [8]. And at Arcflip, the scoring engine that ranks candidates for career matching [2].",
  },
  {
    ask: 'Can he work with customers?',
    match: /\b(customers?|clients?|fde|forward|deployed|inboxkit|support|enterprise|communicat\w*)\b/i,
    keys: ['customer', 'customers', 'client', 'clients', 'enterprise', 'support', 'inboxkit', 'communication', 'deployed', 'onboarding'],
    parts: 2,
    terms: ['Enterprise', 'Onboarding', 'SOPs', 'Support', 'Debugging'],
    text: "That's his day job. As Forward Deployed Engineer at InboxKit he's the engineer enterprise customers work with when something breaks, tracing problems across support, engineering and product until they're fixed [1]. He also runs customer onboarding and turns what customers ask for into product changes [1].",
  },
  {
    ask: "What's he building now?",
    match: /\b(now|currently|current|building|next|reddit\w*|side)\b/i,
    keys: ['now', 'currently', 'building', 'next', 'reddit', 'redditmind', 'latest', 'today', 'recent'],
    parts: 1,
    terms: ['Next.js', 'pgvector', 'Trigger.dev', 'Briefings', 'Reddit', 'Claude API'],
    text: "RedditMind [3]. It's an agent that reads your subreddits overnight and writes a short morning briefing, learning what you care about from what you read. It's still being built, on Next.js, Trigger.dev, the Claude API and Postgres with pgvector [3]. On the side, he's learning the ins and outs of Meta ads.",
  },
  {
    ask: 'Where is his research?',
    match: /\b(research|papers?|publications?|published|springer|icicc|academic|study|studied|university|degree|cgpa|education)\b/i,
    keys: ['research', 'paper', 'papers', 'publication', 'springer', 'academic', 'university', 'degree', 'education', 'college', 'bennett', 'cgpa', 'gpa'],
    parts: 2,
    terms: ['Springer', 'ICICC-2026', 'Health ML', 'CNN', 'Ensemble'],
    text: "Two co-authored Springer papers: crop-disease detection with deep learning, accepted at ICICC-2026 [6], and behavioral health assessment from everyday device data, published in 2025 [7]. The first grew out of his Krishi Saahayak model [5]. He studied computer science with a data science major at Bennett University and graduated with a CGPA of 8.95 [9].",
  },
  {
    ask: "What's his stack?",
    match: /\b(stack|skills?|tools?|tech|languages?|python|langgraph|tensorflow|frameworks?)\b/i,
    keys: ['stack', 'skills', 'tools', 'technology', 'languages', 'python', 'langgraph', 'tensorflow', 'frameworks', 'experience', 'knows'],
    parts: 1,
    terms: ['Python', 'LangGraph', 'TensorFlow', 'XGBoost', 'Flask', 'Streamlit', 'SQL', 'C++'],
    text: "Python first. For agents: LangGraph, the OpenAI and Claude APIs, and retrieval-augmented generation [4]. For models: TensorFlow, scikit-learn and XGBoost, optimised with TensorRT [5]. He ships with Flask, Streamlit and React, and also writes C++, SQL and JavaScript.",
  },
  {
    ask: 'How do I hire him?',
    match: /\b(hire|hiring|contact|email|reach|available|job|role|resume|cv)\b/i,
    keys: ['hire', 'hiring', 'contact', 'email', 'reach', 'available', 'job', 'resume', 'recruit', 'interview', 'salary'],
    parts: 1,
    terms: ['Enterprise', 'LangGraph', 'Python'],
    text: "Email him at vardhanharsh806@gmail.com, or print his résumé at the bottom of the page. He's strongest where building the agent and sitting with the customer who uses it are the same job [1] [4].",
  },
];

const FALLBACK = {
  parts: 1,
  terms: [],
  text: "Nothing on this page answers that, so I won't guess. These are the closest questions I can answer, or you can email Harsh at vardhanharsh806@gmail.com.",
};

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

// How close a free-text question is to an answer's topic, tolerating typos.
function closeness(question, answer) {
  const words = question.toLowerCase().match(/[a-z0-9+#.]+/g) ?? [];
  let score = 0;
  for (const word of words) {
    if (word.length < 3) continue;
    for (const key of answer.keys) {
      if (word === key) { score += 2; break; }
      const limit = key.length > 6 ? 2 : 1;
      if ((word.length >= 4 && key.startsWith(word)) || editDistance(word, key) <= limit) { score += 1; break; }
    }
  }
  return score;
}

function route(question) {
  const text = question.trim().toLowerCase();
  const exact = ANSWERS.find((a) => a.ask.toLowerCase() === text);
  if (exact) return { answer: exact };
  const direct = ANSWERS.find((a) => a.match.test(question));
  if (direct) return { answer: direct };
  const ranked = ANSWERS.map((a) => ({ a, score: closeness(question, a) })).sort((x, y) => y.score - x.score);
  if (ranked[0].score > 0) return { answer: ranked[0].a, assumed: true };
  return { answer: FALLBACK };
}

const STEPS = ['plan', 'search', 'read', 'reflect', 'write'];

const form = document.querySelector('.ask');
const input = form.querySelector('textarea');
const trace = document.querySelector('.trace');
const status = trace.querySelector('.trace-status');
const lines = trace.querySelector('.trace-lines');
const answerBox = document.querySelector('.answer');
const followups = document.querySelector('.followups');
const nodes = Object.fromEntries([...document.querySelectorAll('.flow li')].map((li) => [li.dataset.step, li]));
const loop = document.querySelector('.loop');
const heroCanvas = document.querySelector('.console .field');

const heroField = createField(heroCanvas, {
  origin: () => {
    const box = heroCanvas.getBoundingClientRect();
    const field = input.getBoundingClientRect();
    return { x: field.left - box.left + field.width * 0.35, y: field.bottom - box.top };
  },
});
createField(document.querySelector('.contact .field'), { dotsPerCluster: 14, labelAlpha: 0.22 });

let runId = 0;
let current = ANSWERS[0];

function fitInput() {
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
}

function placeLoop() {
  const graph = loop.parentElement.getBoundingClientRect();
  const top = nodes.search.getBoundingClientRect();
  const bottom = nodes.reflect.getBoundingClientRect();
  loop.style.top = `${top.top + top.height / 2 - graph.top}px`;
  loop.style.height = `${bottom.top + bottom.height / 2 - (top.top + top.height / 2)}px`;
}

function citesIn(text) {
  return [...new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])))];
}

function citeLink(n) {
  const [id, name] = SOURCES[n];
  const link = document.createElement('a');
  link.className = 'cite';
  link.href = `#${id}`;
  link.textContent = name;
  return link;
}

function addLine(step, text) {
  const li = document.createElement('li');
  const label = document.createElement('b');
  label.textContent = step;
  li.append(label, document.createTextNode(text));
  lines.append(li);
}

function setStep(step, state) {
  if (state) nodes[step].dataset.state = state;
  else delete nodes[step].dataset.state;
}

function renderFollowups() {
  followups.replaceChildren(
    ...ANSWERS.filter((a) => a !== current).map((a) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = a.ask;
      button.addEventListener('click', () => run(a.ask, { type: true }));
      return button;
    }),
  );
}

async function typeQuestion(text, id) {
  input.value = '';
  for (const char of text) {
    if (id !== runId) return;
    input.value += char;
    fitInput();
    await wait(32);
  }
}

async function stream(text, id, lead) {
  const p = document.createElement('p');
  answerBox.replaceChildren(...(lead ? [lead, p] : [p]));
  for (const token of text.split(/(\[\d+\])/)) {
    const cite = token.match(/^\[(\d+)\]$/);
    if (cite) {
      p.append(citeLink(Number(cite[1])));
      continue;
    }
    for (const word of token.split(/(\s+)/)) {
      if (id !== runId) return;
      p.append(document.createTextNode(word));
      if (word.trim()) await wait(26);
    }
  }
}

async function run(question, { type = false, loopBack = false } = {}) {
  const id = ++runId;
  const { answer, assumed } = route(question);
  const cited = citesIn(answer.text);
  current = answer;

  followups.replaceChildren();
  lines.replaceChildren();
  answerBox.replaceChildren();
  STEPS.forEach((step) => setStep(step, null));
  loop.classList.remove('active');
  heroField.clear();
  trace.classList.add('running');
  trace.open = true;

  if (type) await typeQuestion(question, id);
  if (id !== runId) return;

  const step = async (name, label, text, ms) => {
    setStep(name, 'active');
    status.textContent = label;
    addLine(name, text);
    await wait(ms);
    if (id === runId) setStep(name, 'done');
  };

  const plan = assumed
    ? `No exact match, so reading it as "${answer.ask}"`
    : `Split the question into ${answer.parts} part${answer.parts > 1 ? 's' : ''}`;
  await step('plan', 'Planning', plan, 650);
  if (id !== runId) return;
  heroField.focus(answer.terms);
  await step('search', 'Searching', `Matched ${cited.length} of ${SOURCE_COUNT} sources`, 900);
  if (id !== runId) return;
  const names = cited.map((n) => SOURCES[n][1]).join(', ');
  await step('read', 'Reading', cited.length ? names : 'Nothing relevant on this page', 750);
  if (id !== runId) return;
  await step('reflect', 'Checking claims', 'Checked each claim against its source', 650);
  if (id !== runId) return;

  if (loopBack) {
    loop.classList.add('active');
    setStep('search', 'active');
    status.textContent = 'Going back for one more source';
    addLine('search', 'One claim was thin, so went back for one more source');
    await wait(800);
    if (id !== runId) return;
    loop.classList.remove('active');
    setStep('search', 'done');
  }

  let lead = null;
  if (assumed) {
    lead = document.createElement('p');
    lead.className = 'assumed';
    lead.append('Showing results for ', Object.assign(document.createElement('b'), { textContent: answer.ask }));
  }

  setStep('write', 'active');
  status.textContent = 'Writing';
  await stream(answer.text, id, lead);
  if (id !== runId) return;
  setStep('write', 'done');
  addLine('write', `Wrote ${answer.text.split(/\s+/).length} words with ${cited.length} citation${cited.length === 1 ? '' : 's'}`);

  trace.classList.remove('running');
  trace.open = false;
  status.textContent = cited.length ? `Answered from ${cited.length} of ${SOURCE_COUNT} sources` : 'No matching sources';
  renderFollowups();
}

function askAgent(question) {
  document.querySelector('.console').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  run(question, { type: true });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = input.value.trim();
  if (question) run(question);
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
input.addEventListener('input', fitInput);

answerBox.addEventListener('click', (event) => {
  const link = event.target.closest('.cite');
  if (!link) return;
  event.preventDefault();
  jumpTo(link.getAttribute('href').slice(1));
});

new ResizeObserver(() => { fitInput(); placeLoop(); }).observe(document.querySelector('.stage'));
document.fonts?.ready.then(() => { fitInput(); placeLoop(); });

/* ---------- Exhibits light up the background as they scroll past ---------- */

const EXHIBITS = [
  ['krishi', 'Krishi Saahayak', ['CNN', 'TensorRT', 'Ensemble', '38 classes', 'TensorFlow', 'Keras']],
  ['papers', 'Papers', ['Springer', 'ICICC-2026', 'Health ML']],
  ['arcflip', 'Arcflip scoring engine', ['Scoring engine', 'XGBoost', 'LightGBM', 'Calibration', 'Signals']],
  ['inboxkit', 'InboxKit', ['Enterprise', 'Onboarding', 'SOPs', 'Support', 'Debugging']],
  ['talentscout', 'TalentScout', ['Zephyr-7B', 'Hugging Face', 'Streamlit', 'Prompting']],
  ['redditmind', 'RedditMind', ['Next.js', 'pgvector', 'Trigger.dev', 'Briefings', 'Reddit']],
  ['assistant', 'Research Assistant', ['LangGraph', 'RAG', 'Planner', 'Reflection', 'Serper.dev']],
  ['bennett', 'Bennett University', ['Python', 'SQL', 'C++', 'LSTM']],
];

const exhibitWatcher = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const match = EXHIBITS.find(([id]) => id === entry.target.id);
    if (match) deskField.focus(match[2]);
  }
}, { rootMargin: '-45% 0px -45% 0px' });
for (const [id] of EXHIBITS) exhibitWatcher.observe(document.getElementById(id));

/* ---------- Krishi Saahayak: five models vote ---------- */

const LEAVES = [
  {
    latin: 'Solanum lycopersicum', leaf: '#4E7A3A', spot: '#4A2E16', seed: 3,
    votes: [['Late blight', 97], ['Late blight', 94], ['Early blight', 61], ['Late blight', 96], ['Late blight', 92]],
  },
  {
    latin: 'Malus domestica', leaf: '#5E8A3C', spot: '#3B3A2A', seed: 8,
    votes: [['Apple scab', 95], ['Apple scab', 98], ['Apple scab', 91], ['Black rot', 58], ['Apple scab', 93]],
  },
  {
    latin: 'Zea mays', leaf: '#6C9440', spot: '#A0521D', seed: 21,
    votes: [['Common rust', 99], ['Northern leaf blight', 64], ['Common rust', 96], ['Common rust', 97], ['Common rust', 95]],
  },
];

const krishi = document.querySelector('.ex-krishi');
const leafStage = krishi.querySelector('.leaf-stage');
const leafSvg = krishi.querySelector('.leaf');
const leafPhoto = krishi.querySelector('.leaf-photo');
const spotsGroup = krishi.querySelector('.spots');
const voteList = krishi.querySelector('.vote-list');
const verdict = krishi.querySelector('.verdict strong');
const uploadInput = krishi.querySelector('.upload input');
const uploadNote = krishi.querySelector('.upload-note');
let leafIndex = 0;
let scanId = 0;

function majority(votes) {
  const counts = {};
  for (const [label] of votes) counts[label] = (counts[label] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function setLabel(latin, sample) {
  krishi.querySelector('.latin').textContent = latin;
  krishi.querySelector('.sample').textContent = sample;
}

function paintLeaf(sample) {
  const rand = seeded(sample.seed);
  leafSvg.style.setProperty('--leaf', sample.leaf);
  leafSvg.style.setProperty('--spot', sample.spot);
  const spots = [];
  for (let i = 0; i < 14; i += 1) {
    const y = 50 + rand() * 170;
    const halfWidth = Math.sin(((y - 12) / 236) * Math.PI) * 62;
    const x = 100 + (rand() * 2 - 1) * halfWidth * 0.8;
    const r = 3 + rand() * 7;
    spots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`);
  }
  spotsGroup.innerHTML = spots.join('');
  leafSvg.removeAttribute('hidden');
  leafPhoto.hidden = true;
  setLabel(sample.latin, `Field sample ${LEAVES.indexOf(sample) + 1} of ${LEAVES.length}`);
}

function renderVotes(votes, shown = votes.length) {
  const winner = majority(votes);
  voteList.replaceChildren(
    ...votes.map(([label, conf], i) => {
      const li = document.createElement('li');
      li.hidden = i >= shown;
      if (label !== winner) li.className = 'dissent';
      li.innerHTML = `<span class="who">Model ${'ABCDE'[i]}</span><span class="label"></span><span class="conf">${conf}%</span>`;
      li.querySelector('.label').textContent = label;
      return li;
    }),
  );
  verdict.textContent = shown >= votes.length ? winner : 'Waiting for votes';
}

async function runScan(votes) {
  const id = ++scanId;
  renderVotes(votes, 0);
  leafStage.classList.remove('scanning');
  void leafStage.offsetWidth;
  leafStage.classList.add('scanning');
  await wait(900);
  for (let i = 1; i <= votes.length; i += 1) {
    if (id !== scanId) return;
    renderVotes(votes, i);
    await wait(220);
  }
  if (id === scanId) renderVotes(votes);
}

function scanNext() {
  leafIndex = (leafIndex + 1) % LEAVES.length;
  uploadNote.hidden = true;
  paintLeaf(LEAVES[leafIndex]);
  runScan(LEAVES[leafIndex].votes);
}

// A colour heuristic dressed up as a diagnosis. It's a demo, and says so.
function readLeaf(image) {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, 48, 48);
  const px = ctx.getImageData(0, 0, 48, 48).data;
  let green = 0;
  let brown = 0;
  let yellow = 0;
  let total = 0;
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
    if (r + g + b < 60 || (r > 230 && g > 230 && b > 230)) continue;
    total += 1;
    if (g > r * 1.08 && g > b * 1.08) green += 1;
    else if (r >= g && g > b) {
      if (g > r * 0.82) yellow += 1;
      else brown += 1;
    }
  }
  const share = (n) => (total ? n / total : 0);
  let label = 'Healthy';
  let rival = 'Early leaf spot';
  if (share(green) < 0.25 && share(brown) + share(yellow) < 0.2) {
    label = 'Not sure this is a leaf';
    rival = 'Healthy';
  } else if (share(brown) > 0.04) {
    label = 'Leaf blight';
    rival = 'Leaf spot';
  } else if (share(yellow) > 0.08) {
    label = 'Mosaic virus';
    rival = 'Nutrient deficiency';
  }
  const base = 82 + Math.round(share(green) * 14);
  return [0, 1, 2, 3, 4].map((i) => (i === 2 ? [rival, 51] : [label, Math.min(99, base - i * 2)]));
}

uploadInput.addEventListener('change', async () => {
  const file = uploadInput.files[0];
  if (!file) return;
  if (leafPhoto.src) URL.revokeObjectURL(leafPhoto.src);
  leafPhoto.src = URL.createObjectURL(file);
  try {
    await leafPhoto.decode();
  } catch {
    verdict.textContent = "Couldn't read that image. Try a JPG or PNG.";
    return;
  }
  leafPhoto.hidden = false;
  leafSvg.setAttribute('hidden', '');
  uploadNote.hidden = false;
  setLabel('Your leaf', 'Uploaded just now');
  await runScan(readLeaf(leafPhoto));
  uploadInput.value = '';
});

paintLeaf(LEAVES[0]);
renderVotes(LEAVES[0].votes);
krishi.querySelector('[data-action="scan"]').addEventListener('click', scanNext);

/* ---------- Papers: swap the top sheet ---------- */

document.querySelector('[data-action="shuffle"]').addEventListener('click', () => {
  for (const sheet of document.querySelectorAll('.sheet')) {
    sheet.dataset.order = sheet.dataset.order === '0' ? '1' : '0';
  }
});

/* ---------- Arcflip: a toy scoring engine ---------- */

const SIGNALS = [
  ['skills', 'Skills match', 60],
  ['experience', 'Experience', 40],
  ['growth', 'Growth trajectory', 50],
  ['fit', 'Role fit', 70],
];

const CANDIDATES = [
  { name: 'Backend developer, 4 years', skills: 0.82, experience: 0.7, growth: 0.55, fit: 0.6 },
  { name: 'ML graduate, 1 year', skills: 0.74, experience: 0.2, growth: 0.95, fit: 0.7 },
  { name: 'Data analyst, 3 years', skills: 0.6, experience: 0.55, growth: 0.7, fit: 0.85 },
  { name: 'Career switcher from finance', skills: 0.45, experience: 0.8, growth: 0.85, fit: 0.5 },
  { name: 'Frontend lead, 7 years', skills: 0.55, experience: 0.95, growth: 0.35, fit: 0.45 },
  { name: 'Research intern', skills: 0.7, experience: 0.15, growth: 0.8, fit: 0.9 },
];

const weightsBox = document.querySelector('.weights');
const ranking = document.querySelector('.ranking');
const weights = Object.fromEntries(SIGNALS.map(([key, , value]) => [key, value]));
ranking.setAttribute('aria-live', 'polite');
ranking.setAttribute('aria-label', 'Candidate ranking');

for (const [key, label, value] of SIGNALS) {
  const wrap = document.createElement('div');
  wrap.className = 'weight';
  wrap.innerHTML = `<label for="w-${key}"><span></span><output for="w-${key}">${value}</output></label><input id="w-${key}" type="range" min="0" max="100" value="${value}">`;
  wrap.querySelector('span').textContent = label;
  const slider = wrap.querySelector('input');
  const output = wrap.querySelector('output');
  slider.addEventListener('input', () => {
    weights[key] = Number(slider.value);
    output.textContent = slider.value;
    rank();
  });
  weightsBox.append(wrap);
}

const rows = new Map(
  CANDIDATES.map((candidate) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="rank"></span><span class="who"></span><span class="score"></span><span class="meter"></span>';
    li.querySelector('.who').textContent = candidate.name;
    return [candidate, li];
  }),
);

function rank() {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0) || 1;
  const scored = CANDIDATES.map((c) => ({
    c,
    score: SIGNALS.reduce((sum, [key]) => sum + c[key] * weights[key], 0) / total,
  })).sort((a, b) => b.score - a.score);

  const before = new Map([...rows].map(([c, li]) => [c, li.getBoundingClientRect().top]));
  scored.forEach(({ c, score }, i) => {
    const li = rows.get(c);
    li.querySelector('.rank').textContent = i + 1;
    li.querySelector('.score').textContent = Math.round(score * 100);
    li.querySelector('.meter').style.width = `${score * 100}%`;
    ranking.append(li);
  });

  if (reduced) return;
  for (const [c, li] of rows) {
    const delta = before.get(c) - li.getBoundingClientRect().top;
    if (delta && before.get(c) !== 0) {
      li.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' });
    }
  }
}
rank();

/* ---------- InboxKit: replay the day, then close the ticket ---------- */

const ticket = document.querySelector('.ticket');
const ticketSteps = [...ticket.querySelectorAll('.t-steps li')];
const ticketTimes = ticketSteps.map((li) => li.querySelector('time').textContent);
const ticketClock = ticket.querySelector('.t-clock');
const resolveButton = ticket.querySelector('[data-action="resolve"]');
const toMinutes = (time) => time.split(':').map(Number).reduce((h, m) => h * 60 + m);
const clockText = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
let replayId = 0;

function setTicketClosed(closed) {
  ticket.classList.toggle('closed', closed);
  ticket.querySelector('.t-state').textContent = closed ? 'Resolved' : 'Open';
  resolveButton.textContent = closed ? 'Reopen the ticket' : 'Close the ticket';
}

async function replayTicket() {
  const id = ++replayId;
  setTicketClosed(false);
  ticketSteps.forEach((li) => li.classList.add('pending'));
  let clock = toMinutes(ticketTimes[0]);
  ticketClock.textContent = clockText(clock);
  await wait(300);
  for (const [i, li] of ticketSteps.entries()) {
    const target = toMinutes(ticketTimes[i]);
    while (clock < target) {
      if (id !== replayId) return;
      clock = Math.min(target, clock + Math.max(1, Math.ceil((target - clock) / 8)));
      ticketClock.textContent = clockText(clock);
      await wait(40);
    }
    if (id !== replayId) return;
    li.classList.remove('pending');
    await wait(550);
  }
}

resolveButton.addEventListener('click', () => {
  replayId += 1;
  ticketSteps.forEach((li) => li.classList.remove('pending'));
  ticketClock.textContent = ticketTimes.at(-1);
  setTicketClosed(!ticket.classList.contains('closed'));
});
ticket.querySelector('[data-action="replay"]').addEventListener('click', replayTicket);

if (!reduced) {
  ticketSteps.forEach((li) => li.classList.add('pending'));
  const ticketWatcher = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    ticketWatcher.disconnect();
    replayTicket();
  }, { threshold: 0.4 });
  ticketWatcher.observe(ticket);
}

/* ---------- TalentScout: a screening chat ---------- */

const QUESTIONS = {
  Python: [
    'How would you find a memory leak in a long-running Python service?',
    'When would you choose a generator over building a list?',
  ],
  React: [
    'What makes a component re-render, and how would you stop the unnecessary ones?',
    'Where would you keep state that three distant components all need?',
  ],
  SQL: [
    'How would you find the second-highest salary in each department?',
    'A query got slow after the table hit 50 million rows. Where do you start?',
  ],
  Docker: [
    'Your image is 2 GB. How do you make it smaller?',
    'A container works locally but fails in CI. How do you narrow it down?',
  ],
  LLMs: [
    "How would you stop a RAG system from answering with something that isn't in its sources?",
    'How would you tell whether a prompt change made your agent better or worse?',
  ],
};

const chatLog = document.querySelector('.chat-log');
const asked = {};

function say(text, who) {
  const p = document.createElement('p');
  p.className = `msg ${who}`;
  p.textContent = text;
  chatLog.append(p);
  chatLog.scrollTop = chatLog.scrollHeight;
  return p;
}

for (const button of document.querySelectorAll('.chat-pick button')) {
  button.addEventListener('click', async () => {
    const tech = button.dataset.tech;
    const index = asked[tech] ?? 0;
    asked[tech] = index + 1;
    say(tech, 'me');
    const typing = say('TalentScout is typing…', 'bot typing');
    await wait(700);
    typing.remove();
    say(QUESTIONS[tech][index % QUESTIONS[tech].length], 'bot');
  });
}

/* ---------- Assistant: run the hero again ---------- */

document.querySelector('[data-action="rerun"]').addEventListener('click', () => {
  document.querySelector('.console').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  run(ANSWERS[0].ask, { type: true, loopBack: true });
  input.focus({ preventScroll: true });
});

/* ---------- Résumé: print it, fold it, fly it ---------- */

const printerStage = document.querySelector('.printer-stage');
const resumeLink = document.querySelector('.resume-link');
let printing = false;

async function printResume() {
  if (printing) return;
  if (reduced) {
    resumeLink.click();
    toast('Résumé downloaded. Check your downloads folder.');
    return;
  }
  printing = true;
  const printer = printerStage.querySelector('.printer');
  const printout = printerStage.querySelector('.printout');
  const sheet = printerStage.querySelector('.printout-sheet');
  const sheetLines = [...sheet.querySelectorAll('p')];
  const stamp = sheet.querySelector('.stamp-print');
  const plane = printerStage.querySelector('.plane');
  let skipped = false;
  const running = new Set();

  const play = (el, frames, options) => {
    const animation = el.animate(frames, { fill: 'forwards', ...options, duration: skipped ? 1 : options.duration, delay: skipped ? 0 : options.delay ?? 0 });
    running.add(animation);
    return animation.finished.catch(() => {});
  };
  const pause = (ms) => (skipped ? Promise.resolve() : wait(ms));
  const skip = (event) => {
    if (event.type === 'keydown' && event.key !== 'Escape') return;
    skipped = true;
    for (const animation of running) animation.finish();
  };

  printerStage.hidden = false;
  document.addEventListener('keydown', skip);
  printerStage.addEventListener('click', skip);
  sheetLines.forEach((line) => { line.style.opacity = 0; });

  await play(printerStage, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  await play(printer, [{ transform: 'translateY(-160%)' }, { transform: 'translateY(8%)', offset: 0.75 }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' });

  printer.classList.add('printing');
  const shake = skipped ? null : printer.animate(
    [{ transform: 'none' }, { transform: 'translate(-2px, 1px)' }, { transform: 'translate(2px, -1px)' }, { transform: 'none' }],
    { duration: 110, iterations: Infinity },
  );
  const feed = play(sheet, [{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: 1900, easing: 'steps(22, end)' });
  sheetLines.forEach((line, i) => play(line, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 200 + i * 200 }));
  await feed;
  shake?.cancel();
  printer.classList.remove('printing');

  await play(stamp, [{ opacity: 0, transform: 'rotate(-12deg) scale(2.6)' }, { opacity: 0.9, transform: 'rotate(-12deg) scale(1)' }], { duration: 280, easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)' });
  play(printout, [{ transform: 'none' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 200 });
  await pause(500);

  play(printer, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-170%)', opacity: 0 }], { duration: 420, easing: 'ease-in' });
  await play(printout, [
    { transform: 'none', opacity: 1 },
    { transform: 'translateY(-6%) scaleY(0.45) rotate(-4deg)', opacity: 1, offset: 0.45 },
    { transform: 'translateY(-14%) scale(0.22, 0.12) rotate(-18deg)', opacity: 0 },
  ], { duration: 520, easing: 'ease-in' });

  resumeLink.click();
  await play(plane, [
    { opacity: 0, transform: 'translate(0, 0) rotate(-10deg) scale(0.4)' },
    { opacity: 1, transform: 'translate(0, 0) rotate(-10deg) scale(1)', offset: 0.1 },
    { transform: 'translate(-22vw, -10vh) rotate(-32deg) scale(1.05)', offset: 0.32 },
    { transform: 'translate(-30vw, 6vh) rotate(-200deg) scale(1)', offset: 0.5 },
    { transform: 'translate(-8vw, 14vh) rotate(-330deg) scale(0.95)', offset: 0.66 },
    { opacity: 1, transform: 'translate(75vw, -75vh) rotate(-380deg) scale(0.45)' },
  ], { duration: 1900, easing: 'cubic-bezier(0.45, 0, 0.4, 1)' });

  await play(printerStage, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
  document.removeEventListener('keydown', skip);
  printerStage.removeEventListener('click', skip);
  for (const animation of printerStage.getAnimations({ subtree: true })) animation.cancel();
  sheetLines.forEach((line) => { line.style.opacity = ''; });
  printerStage.hidden = true;
  printing = false;
  toast('Résumé downloaded. Check your downloads folder.');
}

document.querySelector('[data-action="resume"]').addEventListener('click', printResume);

/* ---------- Contact ---------- */

document.querySelector('[data-action="copy"]').addEventListener('click', copyEmail);

document.querySelector('.note').addEventListener('submit', (event) => {
  event.preventDefault();
  const body = document.querySelector('#note-body').value.trim();
  const params = new URLSearchParams({ subject: 'Hello from your portfolio', body });
  location.href = `mailto:${EMAIL}?${params.toString().replace(/\+/g, '%20')}`;
});

/* ---------- Command palette ---------- */

const palette = document.querySelector('.palette');
const paletteInput = palette.querySelector('.palette-input');
const paletteList = palette.querySelector('.palette-list');
let paletteItems = [];
let paletteIndex = 0;
let paletteReturn = null;

function paletteCommands() {
  return [
    ...ANSWERS.map((a) => ({ label: a.ask, group: 'Ask', run: () => askAgent(a.ask) })),
    ...EXHIBITS.map(([id, name]) => ({ label: `Go to ${name}`, group: 'Jump', run: () => jumpTo(id) })),
    { label: 'Go to contact', group: 'Jump', keys: 'email hire', run: () => jumpTo('contact') },
    { label: 'Copy email address', group: 'Action', keys: 'contact mail', run: copyEmail },
    { label: 'Print my résumé', group: 'Action', keys: 'resume cv download pdf', run: printResume },
    { label: `Switch to the ${isDark() ? 'light' : 'dark'} theme`, group: 'Action', keys: 'theme mode dark light', run: toggleTheme },
    { label: 'Open the terminal', group: 'Action', keys: 'shell console cli command', run: openTerminal },
    {
      label: 'Write Harsh a note', group: 'Action', keys: 'message contact hire',
      run: () => { jumpTo('contact'); document.querySelector('#note-body').focus({ preventScroll: true }); },
    },
  ];
}

function fuzzyScore(text, query) {
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  const at = haystack.indexOf(needle);
  if (at >= 0) return 100 - Math.min(at, 90);
  let position = 0;
  for (const char of needle) {
    position = haystack.indexOf(char, position);
    if (position < 0) return 0;
    position += 1;
  }
  return 10;
}

function renderPalette() {
  const query = paletteInput.value.trim();
  let items = paletteCommands();
  if (query) {
    const ranked = items
      .map((item) => ({ item, score: fuzzyScore(`${item.label} ${item.keys ?? ''}`, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    const askItem = { label: `Ask the agent: “${query}”`, group: 'Agent', run: () => askAgent(query) };
    items = ranked.length && ranked[0].score > 10
      ? [...ranked.map(({ item }) => item), askItem]
      : [askItem, ...ranked.map(({ item }) => item)];
  }
  paletteItems = items;
  paletteIndex = 0;
  paletteList.replaceChildren(
    ...items.map((item, i) => {
      const li = document.createElement('li');
      li.id = `palette-option-${i}`;
      li.setAttribute('role', 'option');
      li.innerHTML = '<span class="label"></span><span class="group"></span>';
      li.querySelector('.label').textContent = item.label;
      li.querySelector('.group').textContent = item.group;
      li.addEventListener('click', () => runPaletteItem(i));
      li.addEventListener('pointermove', () => highlightPalette(i));
      return li;
    }),
  );
  highlightPalette(0);
}

function highlightPalette(index) {
  paletteIndex = index;
  [...paletteList.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === index)));
  const active = paletteList.children[index];
  if (active) {
    paletteInput.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  }
}

function openPalette() {
  if (!palette.hidden) return;
  closeTerminal(false);
  paletteReturn = document.activeElement;
  palette.hidden = false;
  paletteInput.value = '';
  renderPalette();
  paletteInput.focus();
}

function closePalette(restore = true) {
  if (palette.hidden) return;
  palette.hidden = true;
  if (restore) paletteReturn?.focus?.();
}

function runPaletteItem(index) {
  const item = paletteItems[index];
  if (!item) return;
  closePalette(false);
  item.run();
}

paletteInput.addEventListener('input', renderPalette);
paletteInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    highlightPalette((paletteIndex + 1) % paletteItems.length);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    highlightPalette((paletteIndex - 1 + paletteItems.length) % paletteItems.length);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    runPaletteItem(paletteIndex);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closePalette();
  } else if (event.key === 'Tab') {
    event.preventDefault();
  }
});
palette.addEventListener('click', (event) => {
  if (event.target === palette) closePalette();
});
document.querySelector('[data-action="palette"]').addEventListener('click', openPalette);

/* ---------- Terminal ---------- */

const terminal = document.querySelector('.terminal');
const termOut = terminal.querySelector('.term-out');
const termForm = terminal.querySelector('.term-line');
const termInput = terminal.querySelector('#term-in');
const termHistory = [];
let historyIndex = 0;
let terminalReturn = null;
let greeted = false;

const FILES = {
  'about.md': 'Harsh Vardhan Chauhan\nForward Deployed Engineer at InboxKit. Builds AI agents and gets them working for real customers.\nKurukshetra, India.',
  'now.md': NOW,
  'inboxkit.md': 'Forward Deployed Engineer, InboxKit (Apr 2026 to now, remote, Dubai)\n- The engineer enterprise customers work with when something breaks\n- Runs onboarding, implementation and the procedures behind them\n- Turns customer requirements into fixes and features',
  'arcflip.md': 'AI Research & Algorithm Intern, Arcflip (Dec 2025 to Feb 2026)\n- Built the core scoring engine for AI career matching\n- Python pipelines that kept data clean across agent workflows\n- Calibrated scores against reference profiles to cut drift',
  'research-assistant.md': 'Agentic AI Research Assistant (2025)\n- LangGraph agents that plan, search, analyse, reflect and write\n- Live web search through Serper.dev for cited reports\n- You used a scripted version of it at the top of this page',
  'krishi.md': 'Krishi Saahayak (2025)\n- CNN from scratch: 91.44%. Five-model ensemble: 99.55%\n- 38 crop disease classes, TensorRT, real-time Flask API\n- Became a paper accepted at ICICC-2026 (Springer)',
  'talentscout.md': 'TalentScout (2025)\n- Zephyr-7B screening bot that writes questions for each candidate\'s stack',
  'redditmind.md': 'RedditMind (building now)\n- Reads your subreddits overnight, writes a short morning briefing\n- Next.js, Trigger.dev, Claude API, Postgres with pgvector',
  'papers.md': '1. Automated Identification of Crop Diseases Using Deep Learning Frameworks. ICICC-2026, Springer. Accepted.\n2. Leveraging Digital Devices for Behavioral Health Assessment via ML. Springer, 2025. Published.',
  'bennett.md': 'B.Tech, Computer Science (Data Science), Bennett University, 2022 to 2026\nCGPA 8.95',
  'contact.md': `Email: ${EMAIL}\nType "copy email" to copy it, or "sudo hire harsh".`,
};

const FILE_EXHIBITS = {
  'inboxkit.md': 'inboxkit', 'arcflip.md': 'arcflip', 'research-assistant.md': 'assistant', 'krishi.md': 'krishi',
  'talentscout.md': 'talentscout', 'redditmind.md': 'redditmind', 'papers.md': 'papers', 'bennett.md': 'bennett', 'contact.md': 'contact',
};

const BANNER = [
  ' ██╗  ██╗██╗   ██╗',
  ' ██║  ██║██║   ██║',
  ' ███████║██║   ██║',
  ' ██╔══██║╚██╗ ██╔╝',
  ' ██║  ██║ ╚████╔╝ ',
  ' ╚═╝  ╚═╝  ╚═══╝  ',
].join('\n');

const HELP = [
  'help                 show this list',
  'ls                   list files',
  'cat <file>           print a file, e.g. cat krishi.md',
  'open <file>          jump to that exhibit on the page',
  'ask <question>       ask the agent, e.g. ask what has he shipped',
  'now                  what Harsh is doing right now',
  'whoami               who you are',
  'copy email           copy Harsh\'s email address',
  'resume               print the résumé',
  'theme light|dark     switch the theme',
  'sudo hire harsh      you know you want to',
  'clear                clear the screen',
  'exit                 close the terminal',
].join('\n');

const COMMANDS = ['help', 'ls', 'cat', 'open', 'ask', 'now', 'whoami', 'copy', 'resume', 'theme', 'sudo', 'clear', 'exit', 'history', 'pwd', 'date', 'echo'];

function print(text, className = '') {
  const block = document.createElement('div');
  if (className) block.className = className;
  block.textContent = text;
  termOut.append(block);
  termOut.scrollTop = termOut.scrollHeight;
}

function execute(raw) {
  const line = raw.trim();
  print(`visitor@harsh ~ % ${line}`, 'cmd');
  if (!line) return;
  termHistory.push(line);
  historyIndex = termHistory.length;
  const [command, ...args] = line.split(/\s+/);
  const rest = args.join(' ');
  const file = (name) => (FILES[name] ? name : FILES[`${name}.md`] ? `${name}.md` : null);

  switch (command.toLowerCase()) {
    case 'help':
      print(HELP);
      break;
    case 'ls':
      print([...Object.keys(FILES), 'resume.pdf'].join('   '));
      break;
    case 'cat': {
      if (!rest) { print('cat: which file? Try "ls".', 'err'); break; }
      if (rest === 'resume.pdf') { print('That one is binary. Try "resume" to print it.', 'dim'); break; }
      const name = file(rest);
      print(name ? FILES[name] : `cat: ${rest}: no such file. Try "ls".`, name ? '' : 'err');
      break;
    }
    case 'open': {
      const name = file(rest);
      if (!name || !FILE_EXHIBITS[name]) { print(`open: nothing on the page for "${rest}". Try "ls".`, 'err'); break; }
      closeTerminal(false);
      jumpTo(FILE_EXHIBITS[name]);
      break;
    }
    case 'ask':
      if (!rest) { print('ask: what should I ask? e.g. ask where is his research', 'err'); break; }
      closeTerminal(false);
      askAgent(rest);
      break;
    case 'now':
      print(NOW);
      break;
    case 'whoami':
      print('visitor. Harsh is in about.md.');
      break;
    case 'pwd':
      print('/home/visitor');
      break;
    case 'date':
      print(new Date().toString());
      break;
    case 'echo':
      print(rest);
      break;
    case 'history':
      print(termHistory.map((h, i) => `${String(i + 1).padStart(3)}  ${h}`).join('\n'));
      break;
    case 'copy':
      if (/^e?mail$/i.test(rest)) { copyEmail(); print(`Copied ${EMAIL}`); } else print('copy: try "copy email".', 'err');
      break;
    case 'resume':
      print('Sending to the printer…', 'dim');
      closeTerminal(false);
      printResume();
      break;
    case 'theme':
      if (rest === 'light' || rest === 'dark') { setTheme(rest); print(`Theme set to ${rest}.`); } else print('theme: use "theme light" or "theme dark".', 'err');
      break;
    case 'sudo':
      if (/^hire\s+harsh$/i.test(rest)) {
        print('[sudo] password for visitor: ********', 'dim');
        print('Access granted. Opening your email app…');
        setTimeout(() => {
          const params = new URLSearchParams({ subject: "Let's talk about a role", body: 'Hi Harsh,\n\n' });
          location.href = `mailto:${EMAIL}?${params.toString().replace(/\+/g, '%20')}`;
        }, reduced ? 0 : 700);
      } else if (/^rm\b/.test(rest)) {
        print('Nice try. This portfolio is read-only.', 'err');
      } else {
        print('visitor is not in the sudoers file. This incident will be reported to Harsh.', 'err');
      }
      break;
    case 'rm':
      print('Nice try. This portfolio is read-only.', 'err');
      break;
    case 'cd':
      print("There's only ~ here.", 'dim');
      break;
    case 'clear':
      termOut.replaceChildren();
      break;
    case 'exit':
      closeTerminal();
      break;
    default:
      print(`command not found: ${command}. Type "help" for the list.`, 'err');
  }
}

function complete() {
  const value = termInput.value;
  const parts = value.split(/\s+/);
  const last = parts.at(-1);
  const pool = parts.length > 1 ? [...Object.keys(FILES), 'resume.pdf'] : COMMANDS;
  const options = pool.filter((option) => option.startsWith(last));
  if (options.length === 1) {
    parts[parts.length - 1] = options[0];
    termInput.value = `${parts.join(' ')}${parts.length === 1 ? ' ' : ''}`;
  } else if (options.length > 1) {
    print(options.join('   '), 'dim');
  }
}

function openTerminal() {
  if (!terminal.hidden) return;
  closePalette(false);
  terminalReturn = document.activeElement;
  terminal.hidden = false;
  if (!greeted) {
    greeted = true;
    print(BANNER, 'art');
    print("Harsh's portfolio, terminal edition. Type \"help\" to see what you can do.", 'dim');
  }
  termInput.focus();
}

function closeTerminal(restore = true) {
  if (terminal.hidden) return;
  terminal.hidden = true;
  if (restore) terminalReturn?.focus?.();
}

termForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = termInput.value;
  termInput.value = '';
  execute(value);
});

termInput.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    complete();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    historyIndex = Math.max(0, historyIndex - 1);
    termInput.value = termHistory[historyIndex] ?? '';
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    historyIndex = Math.min(termHistory.length, historyIndex + 1);
    termInput.value = termHistory[historyIndex] ?? '';
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeTerminal();
  } else if (event.key === 'l' && event.ctrlKey) {
    event.preventDefault();
    termOut.replaceChildren();
  }
});

terminal.querySelector('.term-close').addEventListener('click', () => closeTerminal());
terminal.querySelector('.term-close').addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    termInput.focus();
  }
});
terminal.addEventListener('click', (event) => {
  if (event.target === terminal) closeTerminal();
  else if (!window.getSelection()?.toString() && event.target.closest('.term-out')) termInput.focus();
});

/* ---------- Global shortcuts ---------- */

const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
if (!isMac) {
  document.querySelectorAll('.kbd-hint').forEach((kbd) => { kbd.textContent = 'Ctrl K'; });
}

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (palette.hidden) openPalette();
    else closePalette();
    return;
  }
  if ((event.key === '`' || event.key === '~') && !isEditable(event.target) && palette.hidden && printerStage.hidden) {
    event.preventDefault();
    openTerminal();
  }
});

/* ---------- Start ---------- */

fitInput();
placeLoop();
run(ANSWERS[0].ask, { type: true, loopBack: true });
