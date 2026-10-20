// Small progressive enhancements. Every page works without this file.
(function () {
  "use strict";

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
