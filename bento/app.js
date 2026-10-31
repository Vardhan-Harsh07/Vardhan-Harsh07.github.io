(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- visibility helper ---------- */
  const onVisible = (el, enter, leave, threshold = 0.35) => {
    if (!("IntersectionObserver" in window)) { enter(); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? enter() : leave && leave()));
    }, { threshold }).observe(el);
  };

  /* ---------- Marquee ---------- */
  $$(".mq-row").forEach((row) => {
    const items = row.dataset.items.split("|");
    for (let k = 0; k < 2; k++) {
      const set = document.createElement("div");
      set.className = "mq-set";
      items.forEach((t) => { const s = document.createElement("span"); s.textContent = t; set.appendChild(s); });
      row.appendChild(set);
    }
  });

  /* ---------- Clock + sky ---------- */
  const tEl = $("#clock-time"), sEl = $("#clock-sec"), subEl = $("#clock-sub"), body = $("#sky-body");
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "long" });
  let lastMode = "";
  const bez = (t) => {
    const x = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 100 + t * t * 190;
    const y = (1 - t) * (1 - t) * 58 + 2 * (1 - t) * t * -18 + t * t * 58;
    return [x, y];
  };
  const tick = () => {
    const now = new Date();
    const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
    const h = +p.hour, m = +p.minute;
    tEl.textContent = `${p.hour}:${p.minute}`;
    tEl.setAttribute("datetime", `${p.hour}:${p.minute}`);
    sEl.textContent = `:${p.second}`;
    const mins = h * 60 + m;
    const isDay = mins >= 360 && mins < 1080; // 6:00 to 18:00
    const t = isDay ? (mins - 360) / 720 : ((mins - 1080 + 1440) % 1440) / 720;
    const [x, y] = bez(Math.min(Math.max(t, 0.02), 0.98));
    body.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    const mode = isDay ? "day" : "night";
    if (mode !== lastMode) {
      $("#stars").innerHTML = isDay ? "" : [[24,14],[52,30],[78,8],[132,20],[160,36],[182,12],[110,40]].map(([a,b]) => `<circle cx="${a}" cy="${b}" r="1.2" class="sky-star"/>`).join("");
      body.innerHTML = isDay
        ? '<circle r="7" class="sky-sun"/>'
        : '<circle r="7" class="sky-moon"/><circle r="6" cx="3.5" cy="-2.5" class="sky-cut"/>';
      lastMode = mode;
    }
    let part = "night";
    if (h >= 5 && h < 12) part = "morning"; else if (h >= 12 && h < 17) part = "afternoon"; else if (h >= 17 && h < 21) part = "evening";
    subEl.textContent = `${dayFmt.format(now)} ${part}, IST`;
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- Krishi count-up ---------- */
  const kr = $(".t-krishi"), count = $("#kr-count");
  let counted = false;
  if (!reduce) count.textContent = "0.00";
  onVisible(kr, () => {
    kr.classList.add("in");
    if (counted) return;
    counted = true;
    if (reduce) { count.textContent = "99.55"; return; }
    const target = 99.55, dur = 1600, start = performance.now();
    const step = (now) => {
      const k = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - k, 4);
      count.textContent = (target * eased).toFixed(2);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, null, 0.4);

  /* ---------- RedditMind feed ---------- */
  const feed = $(".brief-feed");
  const inner = document.createElement("div");
  inner.className = "brief-feed-inner";
  const cards = $$(".bcard", feed);
  cards.forEach((c) => inner.appendChild(c));
  cards.forEach((c) => inner.appendChild(c.cloneNode(true)));
  feed.appendChild(inner);
  if (!reduce) onVisible(feed, () => feed.classList.add("run"), () => feed.classList.remove("run"), 0.1);

  /* ---------- Research pipeline ---------- */
  const steps = $$(".pipe li");
  let si = 0, pipeTimer = null;
  const cap = $("#pipe-cap");
  const CAPS = [
    "<b>Plan.</b> A planning agent breaks the question into parts.",
    "<b>Search.</b> Live web search through Serper.dev pulls in sources.",
    "<b>Read.</b> Retrieval and analysis agents work through what came back.",
    "<b>Reflect.</b> A reflection agent checks the findings before moving on.",
    "<b>Write.</b> A synthesis agent turns the findings into a citation-backed report.",
  ];
  const paint = () => { steps.forEach((li, i) => { li.classList.toggle("on", i === si); li.classList.toggle("done", i < si); }); if (CAPS[si]) cap.innerHTML = CAPS[si]; };
  if (reduce) { si = steps.length - 1; paint(); steps.forEach((li) => li.classList.add("done")); }
  else {
    onVisible($(".t-research"), () => {
      if (pipeTimer) return;
      paint();
      pipeTimer = setInterval(() => { si = (si + 1) % (steps.length + 1); if (si === steps.length) { steps.forEach((li) => { li.classList.remove("on"); li.classList.add("done"); }); return; } paint(); }, 1000);
    }, () => { clearInterval(pipeTimer); pipeTimer = null; }, 0.2);
  }

  /* ---------- Tilt + spotlight ---------- */
  if (finePointer && !reduce) {
    $$(".tile").forEach((tile) => {
      const strength = tile.classList.contains("t-stack") ? 0 : tile.classList.contains("t-id") ? 2 : 3;
      let raf = 0;
      tile.addEventListener("pointermove", (e) => {
        const r = tile.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          tile.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
          tile.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
          if (strength) tile.style.transform = `perspective(1100px) rotateX(${((0.5 - py) * strength).toFixed(2)}deg) rotateY(${((px - 0.5) * strength).toFixed(2)}deg) translateY(-2px)`;
        });
      });
      tile.addEventListener("pointerenter", () => tile.classList.add("is-hot"));
      tile.addEventListener("pointerleave", () => { cancelAnimationFrame(raf); tile.classList.remove("is-hot"); tile.style.transform = ""; });
    });
  }

  /* ---------- Copy email ---------- */
  const copy = $("#copy"), copyStatus = $("#copy-status");
  copy.addEventListener("click", async () => {
    const email = copy.dataset.email;
    let ok = false;
    try { await navigator.clipboard.writeText(email); ok = true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = email; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    copy.textContent = ok ? "Copied" : "Copy failed, select it instead";
    copy.classList.toggle("ok", ok);
    copyStatus.textContent = ok ? "Email copied to clipboard" : "Copy failed";
    setTimeout(() => { copy.textContent = "Copy email"; copy.classList.remove("ok"); }, 2200);
  });

  /* ---------- Ask-me agent ---------- */
  const KB = [
    { k: ["inboxkit", "job", "role", "work", "do", "fde", "forward", "deployed", "current", "day"], a: "Harsh is a Forward Deployed Engineer at InboxKit (remote, Dubai) since April 2026. He's the primary technical contact for enterprise customers: he troubleshoots complex product issues, drives resolution across support, engineering and product, runs and improves onboarding and implementation, and turns customer requirements into fixes, features and technical solutions." },
    { k: ["redditmind", "reddit", "building", "build", "side", "now", "working", "briefing"], a: "Right now he's building RedditMind: an agent that reads your subreddits overnight and writes a personalised morning briefing that gets smarter with use. It runs on Next.js, Trigger.dev, the Claude API and Postgres with pgvector." },
    { k: ["krishi", "crop", "disease", "accuracy", "cnn", "ensemble", "99", "tensorrt", "agriculture", "plant"], a: "Krishi Saahayak detects crop diseases across 38 classes. His custom CNN, built from scratch, reached 91.44%. A majority vote of five models reached 99.55%. It was optimised with NVIDIA TensorRT, served as a real-time Flask API, and became a Springer paper at ICICC-2026." },
    { k: ["research", "assistant", "langgraph", "perplexity", "multi", "agents", "serper", "citation"], a: "The Agentic AI Research Assistant (2025) is a Perplexity-style multi-agent deep research tool: planning, retrieval, analysis, reflection and synthesis agents in LangGraph with deterministic routing, live web search via Serper.dev, and citation-backed reports. Built with Python, LangGraph, the OpenAI API, Serper.dev and Streamlit." },
    { k: ["talentscout", "talent", "screening", "interview", "candidate", "zephyr", "recruit"], a: "TalentScout (2025) is an LLM screening assistant that generates role-specific technical questions from each candidate's declared stack. It uses Python, Zephyr-7B, Hugging Face and Streamlit." },
    { k: ["paper", "papers", "publish", "published", "publication", "springer", "icicc", "author"], a: "Yes, two Springer papers, both co-authored. 'Automated Identification of Crop Diseases Using Deep Learning Frameworks' was accepted at ICICC-2026. 'Leveraging Digital Devices for Behavioral Health Assessment via ML' was published in 2025." },
    { k: ["arcflip", "intern", "internship", "scoring", "matching", "previous", "before"], a: "From December 2025 to February 2026 he was an AI Research & Algorithm Intern at Arcflip, a US startup (remote). He designed and built the core scoring engine for an AI career-matching platform, wrote Python pipelines that enforce data integrity across agentic workflows, and calibrated outputs against reference profiles to reduce scoring drift." },
    { k: ["education", "college", "university", "bennett", "cgpa", "gpa", "degree", "btech", "study", "studied", "graduate"], a: "He did a B.Tech in Computer Science (Data Science) at Bennett University, 2022 to 2026, with a CGPA of 8.95. Focus areas: deep learning, machine learning, information retrieval and AI systems." },
    { k: ["stack", "skills", "skill", "tech", "tools", "languages", "language", "python", "typescript", "framework", "know"], a: "Agents and LLMs: LangGraph, Claude, GPT-4o, Zephyr-7B, Hugging Face Transformers, RAG, prompt engineering. ML: TensorFlow, Keras, scikit-learn, XGBoost, LightGBM, CNNs, LSTMs. Code: Python, TypeScript, SQL, C++, JavaScript. Shipping: Flask, Next.js, REST APIs, TensorRT, Postgres, Git, Streamlit, React." },
    { k: ["where", "based", "live", "location", "city", "india", "kurukshetra", "timezone", "time", "zone"], a: "He's based in Kurukshetra, India, on India Standard Time (Asia/Kolkata). The clock tile on this page shows his local time." },
    { k: ["meta", "ads", "learning", "learn"], a: "Right now he's learning the ins and outs of Meta ads." },
    { k: ["open", "available", "hire", "hiring", "opportunity", "opportunities", "freelance", "conversation", "conversations"], a: "He's open to conversations. The quickest route is email: vardhanharsh806@gmail.com." },
    { k: ["contact", "email", "reach", "mail", "talk", "message"], a: "Email him at vardhanharsh806@gmail.com. There's a copy button in the contact tile." },
    { k: ["resume", "cv", "résumé", "pdf"], a: "You can download his résumé as a PDF from the contact tile or the button at the top of the page." },
    { k: ["github", "code", "repo", "repos", "open source"], a: "His GitHub is github.com/Vardhan-Harsh07. The link is in the contact tile." },
    { k: ["linkedin", "twitter", "x", "social", "socials"], a: "There's no LinkedIn or X link on this page. Email is the way: vardhanharsh806@gmail.com." },
    { k: ["who", "about", "harsh", "yourself", "introduce", "summary"], a: "Harsh Vardhan Chauhan is a Forward Deployed Engineer at InboxKit. In his words: he builds AI agents and gets them working for real customers. He's based in Kurukshetra, India, and is currently building RedditMind." },
    { k: ["hi", "hello", "hey", "yo", "namaste"], a: "Hi. Ask me about Harsh's work at InboxKit, his projects, his papers or his stack." },
  ];
  const FALLBACK = "I only know what's on this page; email Harsh for the rest: vardhanharsh806@gmail.com.";

  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9é+\s-]/g, " ").split(/\s+/).filter(Boolean);
  const answerFor = (q) => {
    const words = norm(q);
    const text = " " + words.join(" ") + " ";
    let best = null, bestScore = 0;
    KB.forEach((entry, idx) => {
      let score = 0;
      entry.k.forEach((key) => {
        if (key.includes(" ")) { if (text.includes(" " + key + " ")) score += 2; }
        else if (words.includes(key)) score += key.length > 3 ? 2 : 1;
        else if (key.length > 4 && words.some((w) => w.startsWith(key))) score += 1;
      });
      // tie-break: earlier = more specific; greetings/who only win when alone
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    return bestScore >= 1 ? best.a : FALLBACK;
  };

  const form = $("#ask-form"), input = $("#ask-input"), answer = $("#answer"), chat = $("#chat");
  let streamTimer = null;
  const ask = (q) => {
    q = q.trim();
    if (!q) { input.focus(); return; }
    clearTimeout(streamTimer);
    $$(".msg.me", chat).forEach((m) => m.remove());
    const me = document.createElement("div");
    me.className = "msg me";
    me.textContent = q;
    chat.insertBefore(me, answer);
    const full = answerFor(q);
    const words = full.split(" ");
    if (reduce) { answer.textContent = full; return; }
    answer.setAttribute("aria-busy", "true");
    answer.textContent = "";
    const out = document.createElement("span");
    const caret = document.createElement("span");
    caret.className = "caret";
    answer.append(out, caret);
    let i = 0;
    const next = () => {
      out.textContent += (i ? " " : "") + words[i];
      i++;
      if (i < words.length) streamTimer = setTimeout(next, 26 + Math.random() * 34);
      else { caret.remove(); answer.setAttribute("aria-busy", "false"); }
    };
    streamTimer = setTimeout(next, 260);
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); input.value = ""; });
  $$(".chip").forEach((c) => c.addEventListener("click", () => ask(c.textContent)));
})();
