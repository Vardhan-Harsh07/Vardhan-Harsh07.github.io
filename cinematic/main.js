(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined";

  /* ---------- Clock (Asia/Kolkata) ---------- */
  var clock = document.getElementById("clock");
  if (clock) {
    var fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
    var tick = function () { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Copy email ---------- */
  var copyBtn = document.querySelector("[data-copy]");
  var status = document.getElementById("copy-status");
  if (copyBtn) {
    var label = copyBtn.querySelector(".copy-label");
    copyBtn.addEventListener("click", function () {
      var text = copyBtn.getAttribute("data-copy");
      var done = function () {
        label.textContent = "Copied";
        copyBtn.classList.add("done");
        if (status) status.textContent = "Email address copied to clipboard";
        setTimeout(function () {
          label.textContent = "Copy email";
          copyBtn.classList.remove("done");
          if (status) status.textContent = "";
        }, 2000);
      };
      var fallback = function () {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", "");
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
  }

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (!reduce && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    if (hasGsap && window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      var target = id === "#top" ? document.body : document.querySelector(id);
      if (!target) return;
      if (lenis) {
        e.preventDefault();
        lenis.scrollTo(id === "#top" ? 0 : target, { offset: 0 });
      }
    });
  });

  /* ---------- Magnetic button ---------- */
  if (finePointer && !reduce && hasGsap) {
    document.querySelectorAll("[data-magnet]").forEach(function (el) {
      var lbl = el.querySelector(".magnet-label");
      var xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      var yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      var lxTo = gsap.quickTo(lbl, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      var lyTo = gsap.quickTo(lbl, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * 0.35); yTo(dy * 0.35);
        lxTo(dx * 0.15); lyTo(dy * 0.15);
      });
      el.addEventListener("mouseleave", function () { xTo(0); yTo(0); lxTo(0); lyTo(0); });
    });
  }

  /* ---------- Floating project preview ---------- */
  var preview = document.querySelector(".preview");
  var rows = document.querySelectorAll(".row");
  if (finePointer && preview && hasGsap && window.innerWidth > 820) {
    var inner = preview.querySelector(".preview-inner");
    var map = {};
    rows.forEach(function (row) {
      var v = row.querySelector(".viz");
      if (!v) return;
      var clone = v.cloneNode(true);
      // keep SVG ids unique
      clone.querySelectorAll("[id]").forEach(function (n) {
        var old = n.id; n.id = old + "-p";
        clone.querySelectorAll("[marker-end]").forEach(function (p) {
          if (p.getAttribute("marker-end") === "url(#" + old + ")") p.setAttribute("marker-end", "url(#" + old + "-p)");
        });
      });
      inner.appendChild(clone);
      map[row.getAttribute("data-project")] = clone;
    });

    gsap.set(preview, { visibility: "visible" });
    var px = gsap.quickTo(preview, "x", { duration: reduce ? 0 : 0.7, ease: "power3" });
    var py = gsap.quickTo(preview, "y", { duration: reduce ? 0 : 0.7, ease: "power3" });
    var lastX = window.innerWidth / 2, lastY = window.innerHeight / 2;
    gsap.set(preview, { x: lastX, y: lastY });

    window.addEventListener("mousemove", function (e) {
      var hh = 160;
      lastX = Math.min(e.clientX, window.innerWidth - 450);
      lastY = Math.min(Math.max(e.clientY, hh), window.innerHeight - hh);
      px(lastX); py(lastY);
    });

    var list = document.querySelector(".rows");
    rows.forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        Object.keys(map).forEach(function (k) { map[k].classList.toggle("on", k === row.getAttribute("data-project")); });
      });
    });
    list.addEventListener("mouseenter", function () {
      gsap.to(inner, { scale: 1, opacity: 1, duration: reduce ? 0 : 0.5, ease: "power3.out", overwrite: true });
    });
    list.addEventListener("mouseleave", function () {
      gsap.to(inner, { scale: 0.6, opacity: 0, duration: reduce ? 0 : 0.35, ease: "power3.in", overwrite: true });
    });
  }

  /* ---------- Scroll reveals, parallax, count-up ---------- */
  var counters = document.querySelectorAll("[data-count]");
  var renderCount = function (el, v) {
    var dec = parseInt(el.getAttribute("data-dec"), 10) || 0;
    el.textContent = v.toFixed(dec);
  };

  if (!hasGsap || !window.ScrollTrigger || reduce) return;
  document.documentElement.classList.add("anim");
  var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(setupMotion);
  function setupMotion() {
  gsap.registerPlugin(ScrollTrigger);

  /* split text into masked lines based on actual wrapping */
  var splitBlocks = document.querySelectorAll('[data-reveal="lines"]');
  var splitLines = function (el) {
    var text = el.getAttribute("data-text");
    if (!text) { text = el.textContent.trim().replace(/\s+/g, " "); el.setAttribute("data-text", text); }
    var words = text.split(" ");
    el.innerHTML = words.map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
    var lines = [], cur = [], top = null;
    el.querySelectorAll(".w").forEach(function (w) {
      var t = w.offsetTop;
      if (top !== null && Math.abs(t - top) > 4) { lines.push(cur); cur = []; }
      top = t; cur.push(w.textContent);
    });
    if (cur.length) lines.push(cur);
    el.innerHTML = lines.map(function (l) {
      return '<span class="ln"><span>' + l.join(" ") + "</span></span>";
    }).join("");
  };
  splitBlocks.forEach(splitLines);
  var lastW = window.innerWidth;
  window.addEventListener("resize", function () {
    if (Math.abs(window.innerWidth - lastW) < 2) return;
    lastW = window.innerWidth;
    clearTimeout(splitLines._t);
    splitLines._t = setTimeout(function () {
      splitBlocks.forEach(function (b) {
        splitLines(b);
        gsap.set(b.querySelectorAll(".ln > span"), { yPercent: 0 });
      });
      ScrollTrigger.refresh();
    }, 200);
  });

  // hero intro (one orchestrated moment)
  var heroLines = document.querySelectorAll(".hero-line .ln > span");
  var intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .from(".marquee", { yPercent: 40, opacity: 0, duration: 1.6 }, 0)
    .from(heroLines, { yPercent: 110, duration: 1.2, stagger: 0.09 }, 0.15)
    .from([".hero-role", ".hero-meta", ".top"], { opacity: 0, y: 14, duration: 1, stagger: 0.08 }, 0.5)
    .from(".magnet", { scale: 0, duration: 1.2, ease: "elastic.out(1, 0.6)" }, 0.6);

  // line mask reveals (except hero, handled above)
  document.querySelectorAll('[data-reveal="lines"]').forEach(function (block) {
    if (block.closest(".hero")) return;
    var spans = block.querySelectorAll(".ln > span");
    gsap.from(spans, {
      yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08,
      scrollTrigger: { trigger: block, start: "top 88%" }
    });
  });

  // rows slide in subtly
  rows.forEach(function (row) {
    gsap.from(row.querySelector(".row-title"), {
      yPercent: 40, opacity: 0, duration: 1.1, ease: "expo.out",
      scrollTrigger: { trigger: row, start: "top 90%" }
    });
  });

  // parallax
  document.querySelectorAll("[data-parallax]").forEach(function (el) {
    var amt = parseFloat(el.getAttribute("data-parallax")) || 0;
    var section = el.closest("section") || el;
    gsap.to(el, {
      yPercent: amt * 100 * (el.classList.contains("marquee") ? 1.6 : 1), ease: "none",
      scrollTrigger: { trigger: section, start: el.closest(".hero") ? "top top" : "top bottom", end: "bottom top", scrub: true }
    });
  });

  // marquee drifts faster with scroll velocity
  var track = document.querySelector(".marquee-track");
  if (track && track.getAnimations) {
    var anim = track.getAnimations()[0];
    if (anim) {
      ScrollTrigger.create({
        onUpdate: function (self) {
          var v = Math.min(Math.abs(self.getVelocity()) / 400, 4);
          anim.playbackRate = 1 + v;
          gsap.delayedCall(0.3, function () { anim.playbackRate = 1; });
        }
      });
    }
  }

  // count-up
  counters.forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var obj = { v: 0 };
    renderCount(el, 0);
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target, duration: 2, ease: "power3.out",
          onUpdate: function () { renderCount(el, obj.v); },
          onComplete: function () { renderCount(el, target); }
        });
      }
    });
  });

  // about panel rises over work
  gsap.from(".about-inner", {
    y: 60, ease: "none",
    scrollTrigger: { trigger: ".about", start: "top bottom", end: "top 30%", scrub: true }
  });
  document.documentElement.classList.add("anim-ready");
  }
})();
