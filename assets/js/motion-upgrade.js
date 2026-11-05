/* Motion upgrade layer. Loaded after motion.css.
   Native scrolling only; every effect reads scroll position and reverses. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("pm");
  function playing() { return root.dataset.motion === "playing"; }
  var hasIO = "IntersectionObserver" in window;

  /* ---------- 1. Hero: split heading words into masks ---------- */
  function splitWords(el, base) {
    if (!el) return 0;
    var count = 0;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parts = node.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var mask = document.createElement("span");
        mask.className = "pm-w";
        var inner = document.createElement("span");
        inner.textContent = part;
        inner.style.setProperty("--w", count++);
        inner.style.setProperty("--pm-base", base + "ms");
        mask.appendChild(inner);
        frag.appendChild(mask);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return count;
  }
  var hero = document.querySelector(".hero-kawaii");
  if (hero) {
    var h1 = hero.querySelector("h1");
    var words = splitWords(h1, 120);
    splitWords(hero.querySelector(".kawaii-tagline"), 120 + words * 60 + 140);
  }

  /* ---------- 2. Scroll-linked values ---------- */
  var visuals = Array.prototype.slice.call(document.querySelectorAll("#featured-work .card-visual"));
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (!playing()) {
      visuals.forEach(function (v) { v.style.setProperty("--pm-p", 1); });
      return;
    }
    root.style.setProperty("--pm-y", Math.min(window.scrollY, vh).toFixed(1));
    visuals.forEach(function (v) {
      var r = v.getBoundingClientRect();
      // 0 when the top edge touches the bottom of the screen, 1 when it reaches 55% up.
      var p = (vh - r.top) / (vh * 0.45);
      v.style.setProperty("--pm-p", Math.max(0, Math.min(1, p)).toFixed(3));
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  /* ---------- 3. Card tilt on fine pointers ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll("#featured-work .card").forEach(function (card) {
      var vis = card.querySelector(".card-visual");
      if (!vis) return;
      card.addEventListener("pointermove", function (e) {
        if (!playing()) return;
        var r = vis.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        x = Math.max(-0.5, Math.min(0.5, x)); y = Math.max(-0.5, Math.min(0.5, y));
        card.classList.add("pm-tilting");
        vis.style.setProperty("--pm-ry", (x * 6).toFixed(2) + "deg");
        vis.style.setProperty("--pm-rx", (-y * 5).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", function () {
        card.classList.remove("pm-tilting");
        vis.style.setProperty("--pm-ry", "0deg");
        vis.style.setProperty("--pm-rx", "0deg");
      });
    });
  }

  /* ---------- 4. Sticky story: the step in the middle of the screen sets the stage ---------- */
  var story = document.querySelector(".pm-story");
  if (story && hasIO) {
    var stage = story.querySelector("[data-stage-target]");
    var steps = story.querySelectorAll(".pm-step");
    function setStage(n) {
      stage.setAttribute("data-stage", n);
      steps.forEach(function (s) { s.classList.toggle("is-active", s.getAttribute("data-step") === String(n)); });
    }
    setStage(1);
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setStage(en.target.getAttribute("data-step")); });
    }, { rootMargin: "-48% 0px -48% 0px", threshold: 0 });
    steps.forEach(function (s) { sio.observe(s); });
  }

  /* ---------- 5. Belle: one farewell near the contact band ---------- */
  var band = document.querySelector(".band-dark");
  var walker = document.querySelector(".belle-walk");
  if (band && walker && hasIO) {
    var bye = document.createElement("span");
    bye.className = "pm-bye"; bye.setAttribute("aria-hidden", "true"); bye.textContent = "See you soon!";
    if (getComputedStyle(walker).position === "static") walker.style.position = "relative";
    walker.appendChild(bye);
    var done = false;
    var bio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting || done || !playing()) return;
      done = true;
      var svg = walker.querySelector(".belle-svg");
      setTimeout(function () {
        if (svg && svg.belle) svg.belle.play("wave");
        bye.classList.add("is-on");
        setTimeout(function () { bye.classList.remove("is-on"); }, 2600);
      }, 350);
      bio.disconnect();
    }, { threshold: 0.6 });
    bio.observe(band);
  }

  /* Pausing motion settles everything immediately. */
  new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ["data-motion"] });
})();

/* ================= Round 2: extra animations ================= */
(function () {
  "use strict";
  var root = document.documentElement;
  function playing() { return root.dataset.motion === "playing"; }
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* A. Heading word masks, triggered on arrival */
  function split(el) {
    var n = 0, nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var m = document.createElement("span"), i = document.createElement("span");
        m.className = "pm-w"; i.textContent = part; i.style.setProperty("--w", n++);
        m.appendChild(i); frag.appendChild(m);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  var heads = document.querySelectorAll("main .section-head h2, main .credential-preview h2, main .contact-band h2, main .notebook-heading h2");
  var eyebrows = document.querySelectorAll("main .section-head .eyebrow");
  if (hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("pm-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    heads.forEach(function (h) {
      if (h.getBoundingClientRect().top < innerHeight * 0.9) return;
      split(h); h.classList.add("pm-split"); io.observe(h);
    });
    eyebrows.forEach(function (e) { e.classList.add("pm-eyebrow-line"); io.observe(e); });
  }

  /* B. Spotlight position */
  if (fine) {
    document.querySelectorAll("#featured-work .card, .kawaii-stats a").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* C. Magnetic buttons */
  if (fine) {
    document.querySelectorAll(".hero-kawaii .cta-row .btn, .contact-band .btn").forEach(function (b) {
      b.classList.add("pm-mag");
      b.addEventListener("pointermove", function (e) {
        if (!playing()) return;
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        b.classList.add("pm-pulling");
        b.style.translate = (dx * 5).toFixed(1) + "px " + (dy * 3).toFixed(1) + "px";
      });
      b.addEventListener("pointerleave", function () { b.classList.remove("pm-pulling"); b.style.translate = ""; });
    });
  }

  /* D. Count up the numeric stats once */
  if (!reduce && playing()) {
    document.querySelectorAll(".kawaii-stats strong").forEach(function (s, k) {
      var m = s.textContent.trim().match(/^(\d+(?:\.\d+)?)(%?)$/);
      if (!m) return;
      var target = parseFloat(m[1]), dec = (m[1].split(".")[1] || "").length, suf = m[2], final = s.textContent;
      s.classList.add("pm-count");
      s.setAttribute("aria-label", final);
      var start = null, dur = 1300, delay = 700 + k * 120;
      s.textContent = (0).toFixed(dec) + suf;
      function tick(t) {
        if (!playing()) { s.textContent = final; return; }
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 4);
        s.textContent = p < 1 ? (target * e).toFixed(dec) + suf : final;
        if (p < 1) requestAnimationFrame(tick);
      }
      setTimeout(function () { requestAnimationFrame(tick); }, delay);
    });
  }
})();
