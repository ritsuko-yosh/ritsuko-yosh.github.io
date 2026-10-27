/* Motion system: scroll reveals, header state, reading progress, and small
   Belle moments. Pure enhancement; every page reads fine without it.
   Respects the shared motion state set by main.js (html[data-motion]). */
(function () {
  "use strict";
  var root = document.documentElement;
  function playing() { return root.dataset.motion === "playing"; }
  var hasIO = "IntersectionObserver" in window;

  /* ---------- Header shadow after scrolling ---------- */
  var header = document.querySelector(".site-header");
  var progress = null;
  var isCaseStudy = !!document.querySelector(".cs-layout");
  if (isCaseStudy) {
    progress = document.createElement("div");
    progress.className = "read-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || 0;
      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.setProperty("--progress", max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Hero entrance order (homepage) ---------- */
  var hero = document.querySelector(".hero-kawaii");
  if (hero) {
    hero.querySelectorAll("[data-enter]").forEach(function (el, i) {
      if (!el.style.getPropertyValue("--i")) el.style.setProperty("--i", i);
    });
  }

  /* ---------- Scroll reveals ---------- */
  // Only elements that start below the first screen are hidden, so nothing
  // already visible ever blinks out and back in.
  function belowFold(el) { return el.getBoundingClientRect().top > window.innerHeight * 0.92; }
  var revealTargets = [];
  function mark(el, cls, stagger) {
    if (!el || !belowFold(el)) return;
    el.classList.add(cls);
    if (stagger != null) el.style.setProperty("--stagger", stagger);
    revealTargets.push(el);
  }
  document.querySelectorAll("main .section-head, main .notebook-heading > div:first-child").forEach(function (el) { mark(el, "m-head"); });
  // Staggered groups: index within each parent decides the delay.
  var groups = [
    ".card-grid > .card", ".value-grid > .value", ".xp-list > li", ".steps > .step",
    ".facts > .fact", ".cred-grid > .cred", ".contact-grid > li", ".skills-grid > .skill-group",
    ".achievement-grid > .achievement-item", ".credential-grid > .credential-card", ".entries > .entry"
  ];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      if (el.classList.contains("reveal")) { el.style.setProperty("--stagger", i % 4); return; }
      mark(el, "m-reveal", i % 4);
    });
  });
  document.querySelectorAll("main .cs-sec, main .credential-preview > *, main .contact-band > *, main .pager a, main .personal-milestone, main .case-art").forEach(function (el, i) {
    mark(el, "m-reveal", el.matches(".pager a, .credential-preview > *, .contact-band > *") ? i % 2 : 0);
  });
  var xp = document.querySelector(".xp-list");
  if (xp && belowFold(xp)) { xp.classList.add("m-line"); revealTargets.push(xp); }

  if (hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("m-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("m-in"); });
  }
  // After an element arrives, drop its entrance delay so hover feedback is instant.
  document.addEventListener("transitionend", function (e) {
    if (e.propertyName !== "opacity") return;
    var el = e.target;
    if ((el.classList.contains("m-reveal") && el.classList.contains("m-in")) || (el.classList.contains("reveal") && el.classList.contains("in"))) el.classList.add("m-settled");
  });

  // If a visitor jumps (hash links, find in page) nothing stays hidden for long.
  window.addEventListener("hashchange", function () { revealTargets.forEach(function (el) { el.classList.add("m-in"); }); });
  window.addEventListener("beforeprint", function () { revealTargets.forEach(function (el) { el.classList.add("m-in"); }); document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); }); });

  /* ---------- Notebook: redraw the sketch chart when a tab changes ---------- */
  var notebook = document.querySelector(".analyst-notebook");
  if (notebook) {
    notebook.querySelectorAll(".screen-strategy rect, .screen-insights circle").forEach(function (el, i) { el.style.setProperty("--d", i % 9); });
    function redraw() {
      if (!playing()) return;
      notebook.classList.remove("m-draw");
      void notebook.offsetWidth;
      notebook.classList.add("m-draw");
    }
    var controls = notebook.querySelector(".notebook-controls");
    if (controls) controls.addEventListener("click", function (e) { if (e.target.closest("button")) redraw(); });
    if (hasIO) {
      var nio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { redraw(); nio.disconnect(); } }, { threshold: 0.4 });
      nio.observe(notebook);
    }
  }

  /* ---------- Belle: one friendly hello per visit ---------- */
  var portrait = document.querySelector(".belle-portrait");
  var bubble = document.querySelector(".belle-hello");
  var greeted = false;
  try { greeted = sessionStorage.getItem("ry-belle-hello") === "1"; } catch (e) {}
  function sayHello(text) {
    if (!bubble || !playing()) return;
    if (text) bubble.textContent = text;
    bubble.classList.add("is-on");
    clearTimeout(sayHello.t);
    sayHello.t = setTimeout(function () { bubble.classList.remove("is-on"); }, 2600);
  }
  if (portrait && bubble && !greeted) {
    setTimeout(function () {
      if (!playing() || document.hidden || window.scrollY > window.innerHeight * 0.6) return;
      if (portrait.belle) portrait.belle.play("wave");
      sayHello();
      try { sessionStorage.setItem("ry-belle-hello", "1"); } catch (e) {}
    }, 1600);
  }
  // A small reward for curiosity: on hover-capable devices Belle notices the pointer.
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".belle-svg").forEach(function (svg) {
      var last = 0;
      svg.addEventListener("pointerenter", function () {
        var now = Date.now();
        if (!playing() || !svg.belle || now - last < 4000) return;
        last = now;
        svg.belle.play(svg.classList.contains("belle-working") ? "wiggle" : "wave");
      });
    });
  }
  if (portrait) {
    var notes = ["Hi! I'm Belle.", "The case studies are just below.", "Thanks for stopping by!"];
    var n = 0;
    var say = function () { sayHello(notes[n++ % notes.length]); };
    portrait.addEventListener("click", say);
    portrait.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") say(); });
  }

  /* ---------- Belle walks to the contact band once ---------- */
  var path = document.querySelector(".belle-path");
  if (path && hasIO) {
    var walker = path.querySelector(".belle-walking");
    var pio = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && walker && walker.belle) { walker.belle.start(); pio.disconnect(); }
    }, { threshold: 0.6 });
    pio.observe(path);
  }

  document.addEventListener("motionchange", function (e) {
    if (e.detail.state === "paused" && bubble) bubble.classList.remove("is-on");
  });
})();
