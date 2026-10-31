(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");

  /* Cursor spotlight */
  var spot = document.querySelector(".spotlight");
  var raf = 0, px = 0, py = 0;
  function paint() {
    raf = 0;
    spot.style.setProperty("--x", px + "px");
    spot.style.setProperty("--y", py + "px");
  }
  function onMove(e) {
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  }
  function syncSpotlight() {
    var on = finePointer.matches && !reduceMotion.matches;
    doc.classList.toggle("has-spotlight", on);
    window.removeEventListener("pointermove", onMove);
    if (on) window.addEventListener("pointermove", onMove, { passive: true });
  }
  if (spot) {
    syncSpotlight();
    [finePointer, reduceMotion].forEach(function (mq) {
      if (mq.addEventListener) mq.addEventListener("change", syncSpotlight);
    });
  }

  /* Active section in the nav */
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = links.map(function (a) { return document.getElementById(a.dataset.nav); });
  function setActive(id) {
    links.forEach(function (a) {
      var on = a.dataset.nav === id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  function updateActive() {
    var probe = window.innerHeight * 0.35;
    var current = sections[0] && sections[0].id;
    sections.forEach(function (s) {
      if (s && s.getBoundingClientRect().top <= probe) current = s.id;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].id;
    }
    setActive(current);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; updateActive(); });
  }, { passive: true });
  window.addEventListener("resize", updateActive);
  updateActive();

  /* Copy email */
  var btn = document.querySelector(".copy");
  var status = document.querySelector(".copy-status");
  var resetTimer;
  function done(ok) {
    var label = btn.querySelector(".copy-label");
    label.textContent = ok ? "Copied" : "Copy email";
    btn.classList.toggle("is-done", ok);
    status.textContent = ok ? "Email copied to clipboard." : "Couldn't copy. Select the address and copy it manually.";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      label.textContent = "Copy email";
      btn.classList.remove("is-done");
      status.textContent = "";
    }, 2200);
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  if (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  }

  /* Local time in Kurukshetra */
  var clock = document.getElementById("clock");
  if (clock) {
    var fmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });
    var iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    var tick = function () {
      var now = new Date();
      clock.textContent = fmt.format(now).replace(/\s?(am|pm)$/i, function (m) { return " " + m.trim().toUpperCase(); }) + " IST";
      var p = {};
      iso.formatToParts(now).forEach(function (part) { p[part.type] = part.value; });
      clock.setAttribute("datetime", p.year + "-" + p.month + "-" + p.day + "T" + (p.hour === "24" ? "00" : p.hour) + ":" + p.minute + "+05:30");
    };
    tick();
    setInterval(tick, 15000);
  }
})();
