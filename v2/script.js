const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduced ? 0 : ms));
const root = document.documentElement;
const EMAIL = 'vardhanharsh806@gmail.com';
const NOW = 'Learning the ins and outs of Meta ads.';

/* ---------- Latent field: skills as points in an embedding space ---------- */

const CLUSTERS = [
  { x: 0.14, y: 0.86, terms: ['LangGraph', 'RAG', 'Claude API', 'OpenAI API', 'Prompt engineering', 'Agent harnesses', 'Tool use', 'Reflection', 'Serper.dev', 'Hugging Face', 'Zephyr-7B'] },
  { x: 0.50, y: 0.90, terms: ['CNN', 'TensorRT', 'Ensemble', '38 classes', 'TensorFlow', 'Keras', 'scikit-learn', 'Flask', 'Streamlit'] },
  { x: 0.88, y: 0.80, terms: ['Scoring engine', 'XGBoost', 'LightGBM', 'Calibration', 'Signals'] },
  { x: 0.90, y: 0.14, terms: ['Enterprise', 'Onboarding', 'SOPs', 'Support', 'Debugging', 'DNS', 'SPF', 'DMARC'] },
  { x: 0.62, y: 0.06, terms: ['Springer', 'ICICC-2026', 'Health ML', 'Cosmology'] },
  { x: 0.38, y: 0.05, terms: ['Next.js', 'React', 'Tailwind CSS', 'Hono', 'Vercel', 'Trigger.dev', 'pgvector', 'Briefings', 'Reddit'] },
  { x: 0.67, y: 0.56, terms: ['TypeScript', 'Python', 'Node.js', 'JavaScript', 'SQL', 'C++', 'Postgres', 'Drizzle', 'Zod', 'Playwright', 'three.js', 'Chrome extension'] },
];

function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fields = [];

// Fields on the hero and contact panels take their colours from that panel's theme scope
const panelColors = (canvas) => () => {
  const style = getComputedStyle(canvas.parentElement);
  return { dot: style.getPropertyValue('--hero-dot').trim(), lit: style.getPropertyValue('--hero-lit').trim() };
};

// A calm dot grid. Dots near the cursor swell and take the accent colour, and when the
// agent searches, a ring pulses out from the question across the grid.
function createField(canvas, { origin = null, colors = panelColors(canvas), constellation = false } = {}) {
  const ctx = canvas.getContext('2d');
  const GAP = constellation ? 34 : 28;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let palette = colors();
  let pointer = null;
  let pulses = [];
  let frame = 0;
  let visible = true;

  function resize() {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  function draw(now) {
    ctx.clearRect(0, 0, width, height);
    pulses = pulses.filter((p) => now - p.start < p.life);
    const offset = GAP / 2;
    for (let y = offset; y < height; y += GAP) {
      for (let x = offset; x < width; x += GAP) {
        let lift = 0;
        let dx = 0;
        let dy = 0;
        if (pointer) {
          const px = x - pointer.x;
          const py = y - pointer.y;
          const d = Math.hypot(px, py);
          if (d < 150) {
            const k = 1 - d / 150;
            lift = Math.max(lift, k);
            dx = (px / (d || 1)) * k * 6;
            dy = (py / (d || 1)) * k * 6;
          }
        }
        for (const p of pulses) {
          const radius = ((now - p.start) / p.life) * p.reach;
          const band = Math.abs(Math.hypot(x - p.x, y - p.y) - radius);
          if (band < 40) lift = Math.max(lift, (1 - band / 40) * (1 - (now - p.start) / p.life));
        }
        const r = 1 + lift * 2.4;
        ctx.fillStyle = lift > 0.05 ? `rgba(${palette.lit}, ${0.25 + lift * 0.75})` : `rgba(${palette.dot}, ${constellation ? 0.1 : 0.14})`;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, 6.283);
        ctx.fill();
      }
    }
    if (!reduced && visible && (pointer || pulses.length)) frame = requestAnimationFrame(draw);
    else frame = 0;
  }

  const kick = () => { if (!frame && !reduced) frame = requestAnimationFrame(draw); };

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) kick();
  }).observe(canvas);

  if (!reduced) {
    const host = constellation ? window : canvas.parentElement;
    host.addEventListener('pointermove', (event) => {
      const box = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
      kick();
    });
    (constellation ? document : canvas.parentElement).addEventListener('pointerleave', () => { pointer = null; kick(); });
  }

  const field = {
    focus(labels) {
      if (!labels?.length || reduced) return;
      const at = origin ? origin() : { x: width / 2, y: height / 2 };
      pulses.push({ x: at.x, y: at.y, start: performance.now(), life: 1600, reach: Math.hypot(width, height) * 0.9 });
      kick();
    },
    clear() {},
    refreshColors() {
      palette = colors();
      draw(performance.now());
    },
  };
  fields.push(field);
  return field;
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

/* ---------- Theme: purple page with white type, or flipped to white with purple type ---------- */

const themeSwitch = document.querySelector('.theme-switch');
const isWhite = () => root.dataset.theme === 'white';
const cssColor = (name) => getComputedStyle(root).getPropertyValue(name).trim();

const deskField = createField(document.querySelector('.desk-field'), {
  dotsPerCluster: 16,
  labelAlpha: 0.3,
  constellation: true,
  colors: () => ({ dot: cssColor('--field-dot'), lit: cssColor('--field-lit') }),
});

function syncTheme() {
  themeSwitch.setAttribute('aria-checked', String(!isWhite()));
  document.querySelector('meta[name="theme-color"]').content = isWhite() ? '#FFFFFF' : '#0E0F0C';
  fields.forEach((field) => field.refreshColors());
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {}
  syncTheme();
}

// The new colour pours out of the switch in a growing circle
function setTheme(theme) {
  if ((theme === 'white') === isWhite()) return;
  if (reduced || !document.startViewTransition) {
    applyTheme(theme);
    return;
  }
  const box = themeSwitch.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = document.startViewTransition(() => applyTheme(theme));
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 900, easing: 'cubic-bezier(0.65, 0, 0.15, 1)', pseudoElement: '::view-transition-new(root)' },
    );
    root.animate(
      { transform: ['scale(1)', 'scale(0.96)'], filter: ['blur(0)', 'blur(3px)'] },
      { duration: 900, easing: 'cubic-bezier(0.65, 0, 0.15, 1)', pseudoElement: '::view-transition-old(root)' },
    );
  });
}

const toggleTheme = () => setTheme(isWhite() ? 'purple' : 'white');

themeSwitch.addEventListener('click', toggleTheme);
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
  10: ['papers', 'Elsevier 2025'],
  11: ['stamp', 'Stamp'],
  12: ['realcheck', 'RealCheck'],
  13: ['clypso', 'Clypso'],
  14: ['treadle', 'Treadle'],
  15: ['waystub', 'Waystub'],
};
const SOURCE_COUNT = Object.keys(SOURCES).length;

const ANSWERS = [
  {
    ask: 'Who is Harsh Vardhan?',
    match: /\b(who|about|intro|yourself|summary)\b/i,
    keys: ['who', 'about', 'introduction', 'summary', 'background', 'harsh', 'profile'],
    parts: 3,
    terms: ['Enterprise', 'DMARC', 'Chrome extension', 'LangGraph', 'Ensemble', 'Springer'],
    text: "Harsh is a Forward Deployed Engineer at InboxKit, where he's the engineer enterprise customers work with when something breaks [1]. He recently shipped Stamp, a live email deliverability checker [11], and RealCheck, a Chrome extension that grades product reviews [12]. Before that he built a multi-agent research system [4] and a crop-disease model with 99.55% accuracy that became a Springer paper [5] [6]. Right now he's building Clypso [13].",
  },
  {
    ask: 'What has he shipped?',
    match: /\b(ship|shipped|built|build|projects?|made|portfolio|stamp|realcheck|treadle|extension|email|dns)\b/i,
    keys: ['shipped', 'built', 'projects', 'portfolio', 'made', 'products', 'work', 'krishi', 'talentscout', 'arcflip', 'stamp', 'realcheck', 'treadle', 'extension'],
    parts: 3,
    terms: ['DNS', 'SPF', 'DMARC', 'Chrome extension', 'three.js', 'LangGraph', 'CNN', 'TensorRT'],
    text: "Stamp, which runs the DNS checks Gmail and Outlook make and tells you how to fix your domain [11]. RealCheck, a Chrome extension that grades product reviews from A to F, entirely in your browser [12]. Treadle, a UI concept for a foot pedal that runs AI agents [14]. Before those: a multi-agent deep-research system that plans, searches, checks its own claims and writes cited reports [4]. Krishi Saahayak, which spots 38 crop diseases from a leaf photo at 99.55% accuracy and runs in real time on TensorRT [5]. TalentScout, a screening bot that writes interview questions for each candidate's stack [8]. And at Arcflip, the scoring engine that ranks candidates for career matching [2].",
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
    match: /\b(now|currently|current|building|next|reddit\w*|clypso|waystub|youtube|side)\b/i,
    keys: ['now', 'currently', 'building', 'next', 'reddit', 'redditmind', 'clypso', 'waystub', 'youtube', 'latest', 'today', 'recent'],
    parts: 2,
    terms: ['Next.js', 'Hono', 'Claude API', 'pgvector', 'Reddit', 'TypeScript'],
    text: "Clypso [13], which turns a YouTube video into a summary, key points, verified quotes, chapters and social posts from one link or one API call. Its website is up but the product is still being built. Alongside it, RedditMind, an agent that writes you a morning briefing from your subreddits [3], and next in line is Waystub, a trip planner set as a railway timetable [15]. On the side, he's learning the ins and outs of Meta ads.",
  },
  {
    ask: 'Where is his research?',
    match: /\b(research|papers?|publications?|published|springer|elsevier|icicc|cosmology|gravity|astronomy|academic|study|studied|university|degree|cgpa|education)\b/i,
    keys: ['research', 'paper', 'papers', 'publication', 'springer', 'elsevier', 'cosmology', 'academic', 'university', 'degree', 'education', 'college', 'bennett', 'cgpa', 'gpa'],
    parts: 3,
    terms: ['Springer', 'ICICC-2026', 'Health ML', 'Cosmology', 'CNN', 'Ensemble'],
    text: "Three co-authored papers: crop-disease detection with deep learning, accepted at ICICC-2026 [6], behavioral health assessment from everyday device data, published by Springer in 2025 [7], and a cosmology study in a higher-order theory of gravity, published in Elsevier's Astronomy and Computing in 2025 [10]. The first grew out of his Krishi Saahayak model [5]. He studied computer science with a data science major at Bennett University and graduated with a CGPA of 8.95 [9].",
  },
  {
    ask: "What's his stack?",
    match: /\b(stack|skills?|tools?|tech|languages?|python|typescript|javascript|node|react|next\.?js|langgraph|tensorflow|frameworks?|prompt\w*|harness\w*)\b/i,
    keys: ['stack', 'skills', 'tools', 'technology', 'languages', 'python', 'typescript', 'javascript', 'node', 'react', 'nextjs', 'langgraph', 'tensorflow', 'frameworks', 'prompt', 'harness', 'experience', 'knows'],
    parts: 3,
    terms: ['TypeScript', 'Next.js', 'Node.js', 'Postgres', 'Prompt engineering', 'Agent harnesses', 'Python', 'TensorFlow'],
    text: "TypeScript and Python. He ships products in TypeScript on Next.js, React, Node.js and Hono, with Postgres through Drizzle, Zod for validation, Playwright for tests and Vercel for hosting, as in Stamp [11] and Clypso [13]. For AI he works with the Claude and OpenAI APIs, LangGraph and RAG, and on the engineering around them: prompt engineering, tool use and agent harnesses [4] [13]. RealCheck is a Chrome extension in plain JavaScript [12], Treadle is built on three.js [14], and his models use TensorFlow, scikit-learn and XGBoost, optimised with TensorRT [5]. He also writes SQL and C++.",
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

const rack = document.querySelector('.rack-list');
const RACK = [...new Map(Object.entries(SOURCES).map(([n, [id, name]]) => [id, { id, name: id === 'papers' ? 'Papers' : name, nums: [] }])).values()];
for (const [n, [id]] of Object.entries(SOURCES)) RACK.find((r) => r.id === id).nums.push(Number(n));
rack.replaceChildren(...RACK.map((r) => {
  const li = Object.assign(document.createElement('li'), { textContent: r.name });
  li.dataset.id = r.id;
  return li;
}));
const rackItems = (cited) => RACK.filter((r) => r.nums.some((n) => cited.includes(n))).map((r) => rack.querySelector(`[data-id="${r.id}"]`));

/* ---------- Nodes: the projects the agent can read, placed around the hero ---------- */

const NODES = [
  ['treadle', 'Treadle', 0.33, 0.115], ['clypso', 'Clypso', 0.5, 0.105], ['stamp', 'Stamp', 0.68, 0.12],
  ['realcheck', 'RealCheck', 0.655, 0.43], ['arcflip', 'Arcflip', 0.635, 0.58], ['krishi', 'Krishi Saahayak', 0.66, 0.73],
  ['inboxkit', 'InboxKit', 0.775, 0.63], ['papers', 'Papers', 0.865, 0.735], ['assistant', 'Research Assistant', 0.78, 0.84],
  ['talentscout', 'TalentScout', 0.13, 0.94], ['redditmind', 'RedditMind', 0.33, 0.95], ['waystub', 'Waystub', 0.5, 0.94], ['bennett', 'Education', 0.9, 0.93],
];
const LINKS = [['stamp', 'inboxkit'], ['krishi', 'papers'], ['assistant', 'clypso'], ['redditmind', 'clypso']];
const SVG_NS = 'http://www.w3.org/2000/svg';
const nodeLayer = document.querySelector('.nodes');
const nodeEls = {};
const svgEl = (tag, attrs = {}) => { const el = document.createElementNS(SVG_NS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; };
const linkLayer = svgEl('g', { class: 'node-links' });
const wireLayer = svgEl('g', { class: 'node-wires' });
const dotLayer = svgEl('g', { class: 'node-dots' });
nodeLayer.append(linkLayer, wireLayer, dotLayer);
for (const [id, name] of NODES) {
  const g = svgEl('g', { class: 'node', 'data-id': id });
  g.append(svgEl('circle', { class: 'node-pulse', r: 6 }), svgEl('circle', { class: 'node-ring', r: 5.5 }));
  const label = svgEl('text', { class: 'node-label', x: 12, y: 4 });
  label.textContent = name;
  g.append(label);
  g.addEventListener('click', () => jumpTo(id));
  dotLayer.append(g);
  nodeEls[id] = g;
}

function layoutNodes() {
  const hero = nodeLayer.getBoundingClientRect();
  nodeLayer.setAttribute('viewBox', `0 0 ${hero.width} ${hero.height}`);
  // Anything a node must never sit on: the header, the question, the answer, the steps
  const blocks = [...document.querySelectorAll('.bar, .ask, .trace, .answer, .followups, .flow, .graph-title')].map((el) => el.getBoundingClientRect()).filter((r) => r.width);
  const clashes = (x, y, w) => blocks.some((r) => x - 8 < r.right - hero.left && x + w + 8 > r.left - hero.left && y - 12 < r.bottom - hero.top && y + 12 > r.top - hero.top);
  for (const [id, , fx, fy] of NODES) {
    const g = nodeEls[id];
    const w = g.querySelector('text').getComputedTextLength() + 14;
    const x = fx * hero.width;
    let y = fy * hero.height;
    const tries = [0, -0.04, 0.04, -0.08, 0.08].map((d) => y + d * hero.height);
    y = tries.find((ty) => ty > 20 && ty < hero.height - 14 && x + w < hero.width - 8 && !clashes(x, ty, w));
    g.style.display = y === undefined ? 'none' : '';
    if (y !== undefined) { g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); g.dataset.x = x; g.dataset.y = y; }
  }
  // Only short links between neighbours, so no line ever crosses the content
  linkLayer.replaceChildren(...LINKS.filter(([a, b]) => nodeEls[a].style.display !== 'none' && nodeEls[b].style.display !== 'none' && Math.hypot(nodeEls[a].dataset.x - nodeEls[b].dataset.x, nodeEls[a].dataset.y - nodeEls[b].dataset.y) < 340).map(([a, b]) => svgEl('line', { x1: nodeEls[a].dataset.x, y1: nodeEls[a].dataset.y, x2: nodeEls[b].dataset.x, y2: nodeEls[b].dataset.y })));
}
new ResizeObserver(() => requestAnimationFrame(layoutNodes)).observe(document.querySelector('.console'));

const projectNodes = {
  reset() {
    wireLayer.replaceChildren();
    Object.values(nodeEls).forEach((g) => g.classList.remove('hit', 'dim', 'kept'));
  },
  search(ids, runRef) {
    layoutNodes();
    const hero = nodeLayer.getBoundingClientRect();
    const field = input.getBoundingClientRect();
    const ox = field.left - hero.left + Math.min(field.width * 0.45, 360);
    const oy = field.bottom - hero.top + 6;
    ids.filter((id) => nodeEls[id] && nodeEls[id].style.display !== 'none').forEach((id, i) => {
      const g = nodeEls[id];
      const x = Number(g.dataset.x);
      const y = Number(g.dataset.y);
      const cx = (ox + x) / 2 + (y < oy ? -60 : 60);
      const cy = Math.min(oy, y) - Math.abs(x - ox) * 0.18;
      const path = svgEl('path', { d: `M${ox.toFixed(1)} ${oy.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`, class: 'wire' });
      wireLayer.append(path);
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = reduced ? 0 : length;
      setTimeout(() => {
        if (runRef() === false) return;
        path.style.strokeDashoffset = 0;
        if (!reduced) {
          const spark = svgEl('circle', { class: 'spark', r: 3 });
          spark.append(Object.assign(svgEl('animateMotion', { dur: '0.7s', fill: 'freeze', path: path.getAttribute('d') })));
          wireLayer.append(spark);
          spark.querySelector('animateMotion').beginElement();
          setTimeout(() => spark.remove(), 760);
        }
        setTimeout(() => g.classList.add('hit'), reduced ? 0 : 620);
      }, reduced ? 0 : i * 120);
    });
    Object.entries(nodeEls).forEach(([id, g]) => { if (!ids.includes(id)) g.classList.add('dim'); });
  },
  settle() {
    wireLayer.querySelectorAll('.wire').forEach((p) => p.classList.add('fade'));
    Object.values(nodeEls).forEach((g) => { if (g.classList.contains('hit')) g.classList.add('kept'); });
  },
};

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
  rack.querySelectorAll('li').forEach((li) => li.classList.remove('hit', 'read', 'dim'));
  projectNodes.reset();
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
  projectNodes.search([...new Set(cited.map((n) => SOURCES[n][0]))], () => id === runId);
  rackItems(cited).forEach((li, i) => setTimeout(() => { if (id === runId) li.classList.add('hit'); }, reduced ? 0 : 120 + i * 110));
  await step('search', 'Searching', `Matched ${cited.length} of ${SOURCE_COUNT} sources`, 900);
  if (id !== runId) return;
  const names = cited.map((n) => SOURCES[n][1]).join(', ');
  rack.querySelectorAll('li:not(.hit)').forEach((li) => li.classList.add('dim'));
  rackItems(cited).forEach((li) => li.classList.add('read'));
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

  projectNodes.settle();
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
  ['stamp', 'Stamp', ['DNS', 'SPF', 'DMARC', 'Next.js', 'Drizzle', 'Playwright']],
  ['clypso', 'Clypso', ['Claude API', 'Hono', 'Next.js', 'Prompt engineering', 'TypeScript']],
  ['treadle', 'Treadle', ['three.js']],
  ['realcheck', 'RealCheck', ['Chrome extension', 'JavaScript', 'Signals']],
  ['inboxkit', 'InboxKit', ['Enterprise', 'Onboarding', 'SOPs', 'Support', 'Debugging']],
  ['assistant', 'Research Assistant', ['LangGraph', 'RAG', 'Agent harnesses', 'Reflection', 'Serper.dev', 'Tool use']],
  ['arcflip', 'Arcflip scoring engine', ['Scoring engine', 'XGBoost', 'LightGBM', 'Calibration', 'Signals']],
  ['papers', 'Papers', ['Springer', 'ICICC-2026', 'Health ML', 'Cosmology']],
  ['krishi', 'Krishi Saahayak', ['CNN', 'TensorRT', 'Ensemble', '38 classes', 'TensorFlow', 'Keras']],
  ['redditmind', 'RedditMind', ['Next.js', 'pgvector', 'Trigger.dev', 'Briefings', 'Reddit']],
  ['waystub', 'Waystub', ['React', 'TypeScript']],
  ['talentscout', 'TalentScout', ['Zephyr-7B', 'Hugging Face', 'Streamlit', 'Prompt engineering']],
  ['bennett', 'Education', ['Python', 'SQL', 'C++']],
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

/* ---------- Stamp: three live DNS lookups from the browser ---------- */

const stampEx = document.querySelector('#stamp');
const stampInput = stampEx.querySelector('#stamp-domain');
const postmark = stampEx.querySelector('.postmark');
const stampRows = Object.fromEntries([...stampEx.querySelectorAll('[data-row]')].map((li) => [li.dataset.row, li]));
const stampMore = stampEx.querySelector('.stamp-more');
let stampRun = 0;

async function lookup(name, type) {
  const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: 'application/dns-json' } });
  if (!response.ok) throw new Error('lookup failed');
  const data = await response.json();
  const code = type === 'TXT' ? 16 : 15;
  return (data.Answer ?? []).filter((a) => a.type === code).map((a) => a.data.replace(/"\s*"/g, '').replace(/^"|"$/g, ''));
}

function setRow(row, state, text) {
  const li = stampRows[row];
  li.classList.remove('loading');
  li.dataset.state = state;
  li.querySelector('em').textContent = text;
}

function stampPostmark(domain, grade) {
  postmark.querySelector('[data-pm="ring"]').textContent = `${domain.toUpperCase()}  •  STAMP  •  `;
  postmark.querySelector('[data-pm="grade"]').textContent = grade;
  postmark.dataset.grade = grade;
  postmark.classList.remove('thump');
  postmark.getBoundingClientRect();
  postmark.classList.add('thump');
}

async function checkDomain(raw) {
  const domain = raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '').replace(/\.$/, '');
  stampInput.value = domain;
  if (!/^(?=.{3,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(domain)) {
    stampInput.focus();
    toast('That doesn’t look like a domain. Try something like github.com.');
    return;
  }
  const run = ++stampRun;
  for (const li of Object.values(stampRows)) {
    li.classList.add('loading');
    delete li.dataset.state;
    li.querySelector('em').textContent = 'Looking up…';
  }
  try {
    const [txt, dmarcTxt, mx] = await Promise.all([lookup(domain, 'TXT'), lookup(`_dmarc.${domain}`, 'TXT'), lookup(domain, 'MX')]);
    if (run !== stampRun) return;
    let points = 0;
    const spf = txt.find((r) => /^v=spf1\b/i.test(r));
    if (!spf) setRow('spf', 'fail', 'No SPF record. Anyone can claim to send as this domain.');
    else if (/[-~]all\b/i.test(spf)) { points += 2; setRow('spf', 'pass', spf.length > 90 ? `${spf.slice(0, 88)}…` : spf); }
    else { points += 1; setRow('spf', 'warn', `${spf.length > 70 ? `${spf.slice(0, 68)}…` : spf} (ends without a strict all)`); }
    const dmarc = dmarcTxt.find((r) => /^v=DMARC1\b/i.test(r));
    const policy = dmarc?.match(/\bp=(\w+)/i)?.[1]?.toLowerCase();
    if (!dmarc) setRow('dmarc', 'fail', 'No DMARC record. Forged mail goes unchecked.');
    else if (policy === 'reject' || policy === 'quarantine') { points += 2; setRow('dmarc', 'pass', `p=${policy}: forged mail is ${policy === 'reject' ? 'refused' : 'sent to spam'}`); }
    else { points += 1; setRow('dmarc', 'warn', 'p=none: forged mail is only reported, not stopped'); }
    if (mx.length) {
      points += 1;
      const host = mx[0].split(' ').pop().replace(/\.$/, '');
      setRow('mx', 'pass', `${mx.length} mail server${mx.length > 1 ? 's' : ''}, e.g. ${host}`);
    } else setRow('mx', 'fail', 'No MX records. This domain can’t receive mail.');
    stampPostmark(domain, ['F', 'F', 'D', 'C', 'B', 'A'][points]);
    stampMore.querySelector('a').href = `https://stamp-zeta-two.vercel.app/check/${encodeURIComponent(domain)}`;
    stampMore.hidden = false;
  } catch {
    if (run !== stampRun) return;
    for (const row of Object.keys(stampRows)) setRow(row, 'warn', 'The lookup didn’t come back. Try again.');
    stampPostmark(domain, '?');
  }
}

stampEx.querySelector('.stamp-form').addEventListener('submit', (e) => {
  e.preventDefault();
  checkDomain(stampInput.value);
});
stampEx.querySelectorAll('[data-domain]').forEach((button) => button.addEventListener('click', () => checkDomain(button.dataset.domain)));

/* ---------- Clypso: sample extractions stream in ---------- */

const CLIPS = [
  {
    title: 'How a small bakery prices a loaf',
    summary: 'A baker explains how her shop moved from copying a rival’s prices to costing each loaf by flour, labour and oven time, and why the first honest number came as a shock.',
    points: ['Copying a rival’s price hid a loss on every sourdough', 'Oven time was the biggest hidden cost', 'One small price rise paid for a second baker'],
    quote: ['“The first honest number was the scariest thing I’ve baked.”', '04:12'],
    chapters: [['00:00', 'Copying the shop next door'], ['03:40', 'Costing one loaf'], ['09:15', 'The new price list']],
  },
  {
    title: 'Riding the last night bus across the city',
    summary: 'A driver walks through a 2 a.m. route, who rides it and why, and what changed when the city cut it to one bus every forty minutes.',
    points: ['Most riders are shift workers heading home', 'Forty-minute gaps pushed people into long walks', 'A pilot brought back a twenty-minute weekend service'],
    quote: ['“Everyone on this bus is going to or from work.”', '07:31'],
    chapters: [['00:00', 'Leaving the depot'], ['05:02', 'The hospital stop'], ['12:48', 'What the cuts did']],
  },
  {
    title: 'How we review code in under an hour',
    summary: 'An engineering lead shares the rules that cut their team’s review time: small pull requests, a written why, and reviewing for risk before style.',
    points: ['Big pull requests wait three times longer', 'Every pull request opens with a paragraph of why', 'Style comments go to the linter, not the reviewer'],
    quote: ['“Review for what could break, not for how you’d have written it.”', '06:05'],
    chapters: [['00:00', 'The two-day review problem'], ['04:20', 'Small pull requests'], ['10:30', 'Risk first']],
  },
];
const clypsoEx = document.querySelector('#clypso');
const clypOut = clypsoEx.querySelector('.clyp-out');
let clypRun = 0;

function clypCard(label, color, body) {
  const card = document.createElement('section');
  card.className = 'clyp-card';
  card.style.setProperty('--c', color);
  const heading = document.createElement('h4');
  heading.textContent = label;
  card.append(heading, body);
  return card;
}

async function playClip(index) {
  const run = ++clypRun;
  const clip = CLIPS[index];
  clypsoEx.querySelectorAll('[data-clip]').forEach((tab) => tab.setAttribute('aria-selected', String(Number(tab.dataset.clip) === index)));
  clypsoEx.querySelector('[data-clyp="title"]').textContent = clip.title;
  clypOut.replaceChildren();
  const summary = Object.assign(document.createElement('p'), { textContent: clip.summary });
  const points = document.createElement('ul');
  points.append(...clip.points.map((p) => Object.assign(document.createElement('li'), { textContent: p })));
  const quote = document.createElement('p');
  quote.append(clip.quote[0], ' ', Object.assign(document.createElement('span'), { className: 'mono', textContent: clip.quote[1] }));
  const chapters = document.createElement('p');
  chapters.className = 'mono';
  chapters.textContent = clip.chapters.map(([t, c]) => `${t}  ${c}`).join('\n');
  chapters.style.whiteSpace = 'pre-line';
  const cards = [clypCard('Summary', '#F5B83D', summary), clypCard('Key points', '#F97316', points), clypCard('Quotes', '#EC4899', quote)];
  for (const card of cards) {
    await wait(420);
    if (run !== clypRun) return;
    clypOut.append(card);
  }
}

clypsoEx.querySelectorAll('[data-clip]').forEach((tab) => tab.addEventListener('click', () => playClip(Number(tab.dataset.clip))));
new IntersectionObserver((entries, observer) => {
  if (entries.some((entry) => entry.isIntersecting)) {
    observer.disconnect();
    playClip(0);
  }
}, { threshold: 0.3 }).observe(clypsoEx);

/* ---------- Treadle: agents run only while the pedal is held ---------- */

const pedal = document.querySelector('.pedal');
const tape = document.querySelector('.tape');
const floorState = document.querySelector('.floor-state');
const TAPE_LINES = ['agent 1: reading the repository', 'agent 2: running the tests', 'agent 1: 3 files changed', 'agent 3: drafting the release note', 'agent 2: 128 tests passed', 'agent 3: release note ready for review', 'agent 1: opening a pull request'];
let tapeTimer = 0;
let tapeLine = 0;

function printTape(text) {
  tape.append(Object.assign(document.createElement('li'), { textContent: text }));
  while (tape.children.length > 6) tape.firstElementChild.remove();
}

function pedalDown() {
  if (pedal.getAttribute('aria-pressed') === 'true') return;
  pedal.setAttribute('aria-pressed', 'true');
  floorState.textContent = 'Foot down. Agents running.';
  printTape(TAPE_LINES[tapeLine++ % TAPE_LINES.length]);
  tapeTimer = setInterval(() => printTape(TAPE_LINES[tapeLine++ % TAPE_LINES.length]), reduced ? 900 : 480);
}

function pedalUp() {
  if (pedal.getAttribute('aria-pressed') !== 'true') return;
  clearInterval(tapeTimer);
  pedal.setAttribute('aria-pressed', 'false');
  floorState.textContent = 'Foot up. Agents stopped. They have not been told.';
  printTape('— foot up —');
}

pedal.addEventListener('pointerdown', (e) => {
  pedal.setPointerCapture(e.pointerId);
  pedalDown();
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pedal.addEventListener(type, pedalUp);
pedal.addEventListener('keydown', (e) => {
  if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
    e.preventDefault();
    pedalDown();
  }
});
pedal.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') pedalUp(); });
pedal.addEventListener('blur', pedalUp);
pedal.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---------- RealCheck: scan the reviews and grade them ---------- */

const realcheckEx = document.querySelector('#realcheck');
const reviewList = realcheckEx.querySelector('.reviews');
const rcButton = realcheckEx.querySelector('[data-action="realcheck"]');
const rcBadge = realcheckEx.querySelector('.rc-badge');
const rcReport = realcheckEx.querySelector('.rc-report');

async function runRealCheck() {
  const reviews = [...reviewList.children];
  if (rcBadge.classList.contains('graded')) {
    reviews.forEach((li) => li.classList.remove('flagged', 'read-these'));
    rcBadge.classList.remove('graded');
    rcBadge.querySelector('b').textContent = '?';
    rcReport.hidden = true;
  }
  rcButton.disabled = true;
  reviews.forEach((li, i) => li.style.setProperty('--n', i));
  reviewList.classList.add('scanning');
  await wait(900);
  reviewList.classList.remove('scanning');
  for (const li of reviews.filter((r) => r.dataset.flag)) {
    li.classList.add('flagged');
    await wait(260);
  }
  reviews.filter((r) => !r.dataset.flag).forEach((li) => li.classList.add('read-these'));
  rcBadge.querySelector('b').textContent = 'D';
  rcBadge.classList.add('graded');
  rcReport.hidden = false;
  rcButton.textContent = 'Run it again';
  rcButton.disabled = false;
}
rcButton.addEventListener('click', runRealCheck);

/* ---------- Waystub: a timetable whose times follow the stops ---------- */

const WAY_DAYS = [{ name: 'Day 1', weekday: 'Tue' }, { name: 'Day 2', weekday: 'Wed' }, { name: 'Day 3', weekday: 'Thu' }];
const WAY_STOPS = {
  eiffel: { name: 'Eiffel Tower', visit: 90 },
  louvre: { name: 'Louvre', visit: 150, closed: 'Tue' },
  seine: { name: 'Walk along the Seine', visit: 60 },
  orsay: { name: 'Musée d’Orsay', visit: 120 },
  versailles: { name: 'Versailles', visit: 240 },
  montmartre: { name: 'Montmartre', visit: 90 },
  notredame: { name: 'Notre-Dame', visit: 60 },
  marais: { name: 'Le Marais', visit: 120 },
};
const wayPlan = [['eiffel', 'louvre', 'seine'], ['orsay', 'versailles', 'montmartre'], ['notredame', 'marais']];
const WAY_START = 9 * 60;
const WAY_END = 18 * 60;
const WAY_LEG = 25;
const wayEx = document.querySelector('#waystub');
const wayDays = wayEx.querySelector('.tt-days');
const wayWarn = wayEx.querySelector('.tt-warn');
let wayPicked = null;
let wayDragged = null;

const clock = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function moveStop(id, day, index = wayPlan[day].length) {
  const from = wayPlan.findIndex((d) => d.includes(id));
  const at = wayPlan[from].indexOf(id);
  wayPlan[from].splice(at, 1);
  if (from === day && at < index) index -= 1;
  wayPlan[day].splice(index, 0, id);
  wayPicked = null;
  renderWaystub(id);
}

function renderWaystub(focusId) {
  const problems = [];
  wayDays.replaceChildren(...wayPlan.map((stops, d) => {
    const column = document.createElement('div');
    column.className = 'tt-day';
    column.dataset.day = d;
    const heading = document.createElement('h4');
    heading.append(WAY_DAYS[d].name, Object.assign(document.createElement('span'), { textContent: WAY_DAYS[d].weekday }));
    const list = document.createElement('ol');
    list.className = 'tt-stops';
    let t = WAY_START;
    stops.forEach((id, i) => {
      if (i) t += WAY_LEG;
      const stop = WAY_STOPS[id];
      const li = document.createElement('li');
      li.className = 'tt-stop';
      li.draggable = true;
      li.tabIndex = 0;
      li.dataset.id = id;
      li.setAttribute('aria-label', `${stop.name} at ${clock(t)}, ${WAY_DAYS[d].name}. Press Enter to move it.`);
      li.append(Object.assign(document.createElement('time'), { textContent: clock(t) }), Object.assign(document.createElement('span'), { textContent: stop.name }));
      if (stop.closed === WAY_DAYS[d].weekday) {
        li.classList.add('closed');
        problems.push(`${stop.name} is closed on ${WAY_DAYS[d].weekday === 'Tue' ? 'Tuesdays' : WAY_DAYS[d].weekday}. Move it to another day.`);
      }
      if (wayPicked === id) li.classList.add('picked');
      t += stop.visit;
      list.append(li);
    });
    const end = document.createElement('p');
    end.className = 'tt-end';
    end.textContent = stops.length ? `Ends ${clock(t)}` : 'Free day';
    if (t > WAY_END) {
      end.classList.add('late');
      problems.push(`${WAY_DAYS[d].name} runs to ${clock(t)}, past 18:00.`);
    }
    if (wayPicked) column.classList.add('target');
    column.append(heading, list, end);
    return column;
  }));
  wayWarn.classList.toggle('clear', !problems.length);
  wayWarn.textContent = problems.length ? problems.join(' ') : 'All clear. Every stop is open and every day ends by 18:00.';
  if (focusId) wayDays.querySelector(`[data-id="${focusId}"]`)?.focus({ preventScroll: true });
}

wayDays.addEventListener('dragstart', (e) => {
  const li = e.target.closest('.tt-stop');
  if (!li) return;
  wayDragged = li.dataset.id;
  e.dataTransfer.setData('text/plain', wayDragged);
  e.dataTransfer.effectAllowed = 'move';
  requestAnimationFrame(() => li.classList.add('dragging'));
});
wayDays.addEventListener('dragend', () => { wayDragged = null; renderWaystub(); });
wayDays.addEventListener('dragover', (e) => {
  const column = e.target.closest('.tt-day');
  if (!column || !wayDragged) return;
  e.preventDefault();
  wayDays.querySelectorAll('.tt-day').forEach((c) => c.classList.toggle('over', c === column));
});
wayDays.addEventListener('drop', (e) => {
  const column = e.target.closest('.tt-day');
  if (!column || !wayDragged) return;
  e.preventDefault();
  const items = [...column.querySelectorAll('.tt-stop:not(.dragging)')];
  const before = items.findIndex((li) => e.clientY < li.getBoundingClientRect().top + li.offsetHeight / 2);
  const day = Number(column.dataset.day);
  const index = before === -1 ? wayPlan[day].filter((id) => id !== wayDragged).length : wayPlan[day].filter((id) => id !== wayDragged).indexOf(items[before].dataset.id);
  const id = wayDragged;
  wayDragged = null;
  const from = wayPlan.findIndex((d) => d.includes(id));
  wayPlan[from].splice(wayPlan[from].indexOf(id), 1);
  wayPlan[day].splice(index, 0, id);
  renderWaystub(id);
});

// Tap or press Enter on a stop, then on a day, to move it without dragging
wayDays.addEventListener('click', (e) => {
  const li = e.target.closest('.tt-stop');
  if (li) {
    wayPicked = wayPicked === li.dataset.id ? null : li.dataset.id;
    renderWaystub(li.dataset.id);
    if (wayPicked) wayWarn.textContent = `Now tap the day to move ${WAY_STOPS[wayPicked].name} to.`;
    return;
  }
  const column = e.target.closest('.tt-day');
  if (column && wayPicked) moveStop(wayPicked, Number(column.dataset.day));
});
wayDays.addEventListener('keydown', (e) => {
  const li = e.target.closest('.tt-stop');
  if (!li) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    li.click();
  } else if (wayPicked && /^[1-3]$/.test(e.key)) {
    moveStop(wayPicked, Number(e.key) - 1);
  } else if (wayPicked && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    const from = wayPlan.findIndex((d) => d.includes(wayPicked));
    const to = Math.min(2, Math.max(0, from + (e.key === 'ArrowRight' ? 1 : -1)));
    if (to !== from) moveStop(wayPicked, to);
  } else if (e.key === 'Escape') {
    wayPicked = null;
    renderWaystub(li.dataset.id);
  }
});
renderWaystub();

/* ---------- Papers: swap the top sheet ---------- */

document.querySelector('[data-action="shuffle"]').addEventListener('click', () => {
  const sheets = document.querySelectorAll('.sheet');
  for (const sheet of sheets) {
    sheet.dataset.order = String((Number(sheet.dataset.order) + sheets.length - 1) % sheets.length);
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

// The contact box sends straight to Harsh's inbox through FormSubmit, no email app needed
const mailbox = document.querySelector('.mailbox');
const mailStatus = mailbox.querySelector('.mailbox-status');
const sendButton = mailbox.querySelector('.send');

mailbox.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(mailbox));
  if (data._honey) return;
  const checks = { name: data.name.trim().length > 1, email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()), message: data.message.trim().length > 4 };
  let firstBad = null;
  for (const [name, ok] of Object.entries(checks)) {
    const field = mailbox.querySelector(`[name="${name}"]`);
    field.closest('.fld').classList.toggle('bad', !ok);
    if (!ok && !firstBad) firstBad = field;
  }
  if (firstBad) {
    mailStatus.textContent = 'Add your name, a valid email and a short message.';
    firstBad.focus();
    return;
  }
  sendButton.disabled = true;
  sendButton.classList.add('flying');
  mailStatus.textContent = 'Sending…';
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name: data.name.trim(), email: data.email.trim(), message: data.message.trim(), _subject: `Portfolio message from ${data.name.trim()}`, _template: 'box', _captcha: 'false' }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || String(result.success) === 'false') throw new Error('not sent');
    mailbox.classList.add('sent');
    mailStatus.textContent = `Sent. Harsh will reply to ${data.email.trim()}.`;
    sendButton.querySelector('.send-label').textContent = 'Sent';
  } catch {
    sendButton.classList.remove('flying');
    sendButton.disabled = false;
    mailStatus.replaceChildren('That didn’t go through. ', Object.assign(document.createElement('a'), { href: `mailto:${EMAIL}`, textContent: 'Email Harsh directly' }), ' instead.');
  }
});
mailbox.addEventListener('input', (event) => event.target.closest('.fld')?.classList.remove('bad'));

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
    { label: isWhite() ? 'Switch to purple' : 'Switch to white', group: 'Action', keys: 'theme mode dark light colour color purple white invert', run: toggleTheme },
    { label: 'Open the terminal', group: 'Action', keys: 'shell console cli command', run: openTerminal },
    {
      label: 'Write Harsh a note', group: 'Action', keys: 'message contact hire',
      run: () => { jumpTo('contact'); mailbox.querySelector('[name="name"]').focus({ preventScroll: true }); },
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
  'stack.md': 'Languages: TypeScript, JavaScript, Python, SQL, C++\nAI and agents: Claude API, OpenAI API, LangGraph, RAG, prompt engineering, tool use, agent harnesses\nFrontend: Next.js, React, Tailwind CSS, Radix UI, Motion, three.js\nBackend: Node.js, Hono, REST and OpenAPI, Zod, Better Auth, Resend\nData: Postgres (Neon), pgvector, Drizzle, Turso, Upstash Redis\nML: TensorFlow, Keras, scikit-learn, XGBoost, LightGBM, TensorRT, Hugging Face\nShipping: Vercel, Trigger.dev, Chrome extensions, Playwright, Vitest, Git',
  'stamp.md': 'Stamp (2026, live)\nRuns the DNS checks Gmail, Outlook and Yahoo make: SPF, DKIM, DMARC, MX, MTA-STS, BIMI, blocklists. Grades the domain and says what to fix.\nhttps://stamp-zeta-two.vercel.app',
  'realcheck.md': 'RealCheck (2026, Chrome extension, in store review)\nGrades product reviews from A to F on Amazon, Flipkart, Walmart, Myntra and more. Runs entirely in your browser.',
  'clypso.md': 'Clypso (building)\nYouTube video in, summary, key points, quotes, chapters, SEO and social posts out. The website is up; the product is still being built.\nhttps://clypso-eta.vercel.app',
  'treadle.md': 'Treadle (2026, UI concept)\nA product page for a foot pedal that runs AI agents while your foot is down. Concept. No pedal exists.\nhttps://treadle-pedal.vercel.app',
  'waystub.md': 'Waystub (in planning)\nA trip planner set as a railway timetable. Drag a stop and every time and warning follows.',
  'about.md': 'Harsh Vardhan Singh Chauhan\nForward Deployed Engineer at InboxKit. Builds AI agents and gets them working for real customers.\nHaryana, India.',
  'now.md': NOW,
  'inboxkit.md': 'Forward Deployed Engineer, InboxKit (Apr 2026 to now, remote, Dubai)\n- The engineer enterprise customers work with when something breaks\n- Runs onboarding, implementation and the procedures behind them\n- Turns customer requirements into fixes and features',
  'arcflip.md': 'AI Research & Algorithm Intern, Arcflip (Dec 2025 to Feb 2026)\n- Built the core scoring engine for AI career matching\n- Python pipelines that kept data clean across agent workflows\n- Calibrated scores against reference profiles to cut drift',
  'research-assistant.md': 'Agentic AI Research Assistant (2025)\n- LangGraph agents that plan, search, analyse, reflect and write\n- Live web search through Serper.dev for cited reports\n- You used a scripted version of it at the top of this page',
  'krishi.md': 'Krishi Saahayak (2025)\n- CNN from scratch: 91.44%. Five-model ensemble: 99.55%\n- 38 crop disease classes, TensorRT, real-time Flask API\n- Became a paper accepted at ICICC-2026 (Springer)',
  'talentscout.md': 'TalentScout (2025)\n- Zephyr-7B screening bot that writes questions for each candidate\'s stack',
  'redditmind.md': 'RedditMind (building now)\n- Reads your subreddits overnight, writes a short morning briefing\n- Next.js, Trigger.dev, Claude API, Postgres with pgvector',
  'papers.md': '1. Automated Identification of Crop Diseases Using Deep Learning Frameworks. ICICC-2026, Springer. Accepted.\n2. Leveraging Digital Devices for Behavioral Health Assessment via ML. Springer, 2025. Published.\n3. A Cosmological Probe in a Theory of Higher-Order Gravity. Astronomy and Computing, Elsevier, 2025. Published.',
  'bennett.md': 'B.Tech, Computer Science (Data Science), Bennett University, 2022 to 2026\nCGPA 8.95',
  'contact.md': `Email: ${EMAIL}\nType "copy email" to copy it, or "sudo hire harsh".`,
};

const FILE_EXHIBITS = {
  'stamp.md': 'stamp', 'realcheck.md': 'realcheck', 'clypso.md': 'clypso', 'treadle.md': 'treadle', 'waystub.md': 'waystub',
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
  'theme purple|white   flip the colours',
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
      if (rest === 'purple' || rest === 'white') { setTheme(rest); print(`Theme set to ${rest}.`); } else print('theme: use "theme purple" or "theme white".', 'err');
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
/* ---------- The face: eyes that follow you, and miss you when you leave ---------- */

const logo = document.querySelector('.mark .logo');
const pupils = [...logo.querySelectorAll('.pupil')];
const eyes = [...logo.querySelectorAll('[data-eye]')];
const finePointer = matchMedia('(pointer: fine)').matches;

function lookAt(x, y) {
  const box = logo.getBoundingClientRect();
  const dx = x - (box.left + box.width / 2);
  const dy = y - (box.top + box.height * 0.44);
  const reach = Math.min(1, Math.hypot(dx, dy) / 240);
  const angle = Math.atan2(dy, dx);
  const shift = `translate(${(Math.cos(angle) * 3.6 * reach).toFixed(2)}px, ${(Math.sin(angle) * 4.6 * reach).toFixed(2)}px)`;
  pupils.forEach((pupil) => { pupil.style.transform = shift; });
}

function blink() {
  eyes.forEach((eye) => {
    eye.classList.remove('blink');
    eye.getBoundingClientRect();
    eye.classList.add('blink');
  });
}

if (!reduced) {
  let frame = 0;
  addEventListener('pointermove', (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => lookAt(e.clientX, e.clientY));
  });
  (function blinkLater() {
    setTimeout(() => { blink(); blinkLater(); }, 2500 + Math.random() * 3500);
  })();
  // Without a mouse, the eyes glance around on their own
  if (!finePointer) {
    setInterval(() => {
      const box = logo.getBoundingClientRect();
      lookAt(box.left + (Math.random() - 0.5) * 600, box.top + Math.random() * 400);
    }, 2200);
  }
}

const favicon = document.querySelector('#favicon');
const pageTitle = document.title;
const AWAY_TITLES = ['👀 Harsh Vardhan', '👀 Harsh is waiting'];
// Favicon frames: the eyes glance around, and blink now and then
const faceIcon = (dx, dy, shut = false) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#0E0F0C"/>` +
  (shut
    ? `<rect x="13" y="27" width="18" height="3.5" rx="1.75" fill="#fff"/><rect x="33" y="27" width="18" height="3.5" rx="1.75" fill="#fff"/>`
    : `<ellipse cx="22" cy="28" rx="9" ry="11" fill="#fff"/><ellipse cx="42" cy="28" rx="9" ry="11" fill="#fff"/>` +
      `<circle cx="${22 + dx}" cy="${28 + dy}" r="4.6" fill="#0E0F0C"/><circle cx="${42 + dx}" cy="${28 + dy}" r="4.6" fill="#0E0F0C"/>`) +
  `<rect x="21" y="45" width="22" height="5.5" rx="2.75" fill="#B6FF3B"/></svg>`);
const AWAY_ICONS = [faceIcon(-4, 0), faceIcon(-3, -4), faceIcon(4, -3), faceIcon(4, 2), faceIcon(0, 0, true), faceIcon(-2, 3)];
let awayTimer = 0;

document.addEventListener('visibilitychange', () => {
  clearInterval(awayTimer);
  if (document.hidden) {
    let tick = 0;
    const step = () => {
      favicon.href = AWAY_ICONS[tick % AWAY_ICONS.length];
      document.title = AWAY_TITLES[Math.floor(tick / 4) % AWAY_TITLES.length];
      tick += 1;
    };
    step();
    awayTimer = setInterval(step, 1100);
  } else {
    document.title = pageTitle;
    favicon.href = 'logo.svg';
    blink();
  }
});

// The GitHub preview fills in live numbers the first time someone looks at it
const githubPeek = document.querySelector('.peek-github');
let githubLoaded = false;
async function loadGithub() {
  if (githubLoaded) return;
  githubLoaded = true;
  try {
    const [user, repos] = await Promise.all([
      fetch('https://api.github.com/users/Vardhan-Harsh07').then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch('https://api.github.com/users/Vardhan-Harsh07/repos?sort=pushed&per_page=8').then((r) => (r.ok ? r.json() : Promise.reject())),
    ]);
    githubPeek.querySelector('[data-gh="repos"]').textContent = user.public_repos;
    const list = githubPeek.querySelector('[data-gh="recent"]');
    const projects = repos.filter((repo) => !repo.fork && !repo.name.endsWith('.github.io')).slice(0, 3);
    list.replaceChildren(...projects.map((repo) => Object.assign(document.createElement('li'), { textContent: repo.name })));
  } catch {
    // Keep the numbers baked into the page if GitHub is unreachable or rate-limited
  }
}
githubPeek.parentElement.addEventListener('pointerenter', loadGithub, { once: true });
githubPeek.parentElement.addEventListener('focusin', loadGithub, { once: true });

// Profile links lean toward the cursor
if (finePointer && !reduced) {
  document.querySelectorAll('[data-magnet]').forEach((link) => {
    link.addEventListener('pointermove', (e) => {
      const box = link.getBoundingClientRect();
      link.style.transform = `translate(${(e.clientX - box.left - box.width / 2) * 0.25}px, ${(e.clientY - box.top - box.height / 2) * 0.35}px)`;
    });
    link.addEventListener('pointerleave', () => { link.style.transform = ''; });
  });
}

/* ---------- Intro: plays once per visit, any click or key skips it ---------- */

const introDone = new Promise((resolve) => {
  const intro = document.querySelector('.intro');
  const finish = () => {
    root.classList.remove('intro-on');
    resolve();
  };
  if (!root.classList.contains('intro-on')) {
    root.classList.add('intro-ready');
    resolve();
    return;
  }
  try {
    sessionStorage.setItem('intro', '1');
  } catch {}
  let lifted = false;
  const lift = () => {
    if (lifted) return;
    lifted = true;
    root.classList.add('intro-ready');
    intro.classList.add('leave');
    setTimeout(finish, 760);
  };
  setTimeout(lift, 1700);
  intro.addEventListener('click', lift);
  addEventListener('keydown', lift, { once: true });
});

introDone.then(() => run(ANSWERS[0].ask, { type: true, loopBack: true }));



/* ---------- v2 motion: progress bar, cursor, reveals, decoding titles, tilt ---------- */

const progressBar = document.querySelector('.progress');
addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}, { passive: true });

const cursor = document.querySelector('.cursor');
if (finePointer && !reduced) {
  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add('on');
    cursor.classList.toggle('big', !!e.target.closest('a, button, input, textarea, label, [role="tab"], .tt-stop, .pedal'));
  });
  addEventListener('pointerdown', () => cursor.classList.add('down'));
  addEventListener('pointerup', () => cursor.classList.remove('down'));
  document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
  (function follow() {
    cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(follow);
  })();
}

// Chapter titles decode from random glyphs, then settle
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?';
function decode(el) {
  const final = el.textContent;
  let tick = 0;
  const timer = setInterval(() => {
    tick += 1;
    el.textContent = [...final].map((ch, i) => (ch === ' ' || i < tick / 1.6 ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
    if (tick / 1.6 >= final.length) { clearInterval(timer); el.textContent = final; }
  }, 28);
}

if (!reduced) {
  root.classList.add('reveal-ready');
  const revealer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.matches('.ex')) : [];
      el.style.transitionDelay = `${Math.max(0, siblings.indexOf(el)) * 110}ms`;
      el.classList.add('in');
      setTimeout(() => { el.style.transitionDelay = ''; el.classList.add('settled'); }, 1400);
      if (el.matches('.chapter-head')) decode(el.querySelector('h3'));
      revealer.unobserve(el);
    }
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.ex, .chapter-head, .edu').forEach((el) => revealer.observe(el));
}

// Cards tilt toward the cursor, with a glare that follows it
if (finePointer && !reduced) {
  document.querySelectorAll('.chapter .ex').forEach((card) => {
    if (getComputedStyle(card).backgroundColor === 'rgba(0, 0, 0, 0)') return;
    card.classList.add('tilt');
    card.append(Object.assign(document.createElement('span'), { className: 'tilt-glare' }));
    card.addEventListener('pointermove', (e) => {
      if (e.target.closest('input, textarea, .tt-days, .pedal, .chat, .weights, input[type="range"]')) return;
      const box = card.getBoundingClientRect();
      const px = (e.clientX - box.left) / box.width;
      const py = (e.clientY - box.top) / box.height;
      card.style.transform = `perspective(1100px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 6}deg)`;
      card.style.setProperty('--gx', `${px * 100}%`);
      card.style.setProperty('--gy', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}
