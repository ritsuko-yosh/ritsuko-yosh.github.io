// Small progressive enhancements. Every page works without this file.
(function () {
  "use strict";

  // A brief greeting; never swap or distort Belle's drawing.
  var motionToggle = document.querySelector(".motion-toggle");
  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var motionPaused = false;
  function updateMotion() {
    var reduced = motionPreference.matches;
    document.documentElement.dataset.motion = reduced || motionPaused ? "paused" : "playing";
    if (motionToggle) {
      motionToggle.hidden = reduced;
      motionToggle.setAttribute("aria-pressed", String(motionPaused));
      motionToggle.textContent = motionPaused ? "Resume motion" : "Pause motion";
    }
  }
  if (motionToggle) {
    motionToggle.addEventListener("click", function () {
      motionPaused = !motionPaused;
      updateMotion();
    });
  }
  motionPreference.addEventListener("change", updateMotion);
  updateMotion();
  var trail = document.querySelector(".belle-trail");
  if (trail && "IntersectionObserver" in window) {
    var trailObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        trail.classList.add("is-visible");
        trailObserver.disconnect();
      }
    }, { threshold: 0.35 });
    trailObserver.observe(trail);
  }

  // Keep every gallery item available when JavaScript is disabled.
  var galleryFilters = document.querySelector(".achievement-filters");
  if (galleryFilters) {
    galleryFilters.hidden = false;
    galleryFilters.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-achievement-filter]");
      if (!button) return;
      var category = button.getAttribute("data-achievement-filter");
      var count = 0;
      document.querySelectorAll(".achievement-item").forEach(function (card) {
        card.hidden = category !== "all" && card.getAttribute("data-achievement-category") !== category;
        if (!card.hidden) count++;
      });
      galleryFilters.querySelectorAll("button").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      document.querySelector(".achievement-status").textContent = count +
        (count === 1 ? " achievement" : " achievements") +
        (category === "all" ? "" : " · " + button.textContent);
    });
  }

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("open");
        toggle.focus();
      }
    });
  }

  // Project filters
  var grid = document.getElementById("project-grid");
  var buttons = document.querySelectorAll(".filter");
  var status = document.querySelector(".filter-status");
  function applyFilter(cat) {
    var shown = 0;
    grid.querySelectorAll(".card").forEach(function (card) {
      var cats = (card.getAttribute("data-categories") || "").split("|");
      var match = cat === "all" || cats.indexOf(cat) !== -1;
      card.hidden = !match;
      if (match) { shown++; card.classList.add("in"); }
    });
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === cat));
    });
    if (status) status.textContent = shown + (shown === 1 ? " project" : " projects") + (cat === "all" ? "" : " in " + cat);
  }
  if (grid && buttons.length) {
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var cat = b.getAttribute("data-filter");
        applyFilter(cat);
        try { history.replaceState(null, "", cat === "all" ? location.pathname : "#" + encodeURIComponent(cat)); } catch (e) {}
      });
    });
    var initial = decodeURIComponent((location.hash || "").slice(1));
    var valid = Array.prototype.some.call(buttons, function (b) { return b.getAttribute("data-filter") === initial; });
    applyFilter(valid ? initial : "all");
  }

  // Subtle reveal on scroll
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Case study table of contents: highlight the current section
  var tocLinks = document.querySelectorAll(".cs-toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove("active"); });
          var a = map[en.target.id];
          if (a) a.classList.add("active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) tio.observe(s);
    });
  }
})();
