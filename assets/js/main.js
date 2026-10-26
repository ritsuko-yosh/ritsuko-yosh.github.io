// Small progressive enhancements. Every page works without this file.
(function () {
  "use strict";

  // Motion state: one source of truth for every page.
  // The visitor's choice persists across pages (localStorage, when available);
  // the operating system's reduced-motion setting always wins.
  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var STORE_KEY = "ry-motion";
  var motionPaused = false;
  try { motionPaused = localStorage.getItem(STORE_KEY) === "paused"; } catch (e) {}

  // A compact control in the header, so motion can be paused from the first screen of any page.
  var headerInner = document.querySelector(".header-inner");
  var navToggle = document.querySelector(".nav-toggle");
  if (headerInner && !document.querySelector(".motion-switch")) {
    var tools = document.createElement("div");
    tools.className = "header-tools";
    var sw = document.createElement("button");
    sw.type = "button";
    sw.className = "motion-switch";
    sw.innerHTML = '<span class="motion-switch-icon" aria-hidden="true"></span><span class="motion-switch-label">Pause motion</span>';
    tools.appendChild(sw);
    var navEl = document.getElementById("site-nav");
    // Keep DOM order brand, nav, tools so keyboard order matches the visual order.
    if (navEl && navEl.parentNode === headerInner) headerInner.insertBefore(tools, navEl.nextSibling);
    else headerInner.appendChild(tools);
    if (navToggle) tools.appendChild(navToggle);
  }
  var motionToggles = document.querySelectorAll(".motion-toggle, .motion-switch");

  function updateMotion() {
    var reduced = motionPreference.matches;
    var state = reduced || motionPaused ? "paused" : "playing";
    document.documentElement.dataset.motion = state;
    motionToggles.forEach(function (button) {
      button.hidden = reduced;
      button.setAttribute("aria-pressed", String(motionPaused));
      var label = motionPaused ? "Resume motion" : "Pause motion";
      var text = button.querySelector(".motion-switch-label");
      if (text) text.textContent = label;
      else button.textContent = label;
    });
    document.dispatchEvent(new CustomEvent("motionchange", { detail: { state: state } }));
  }
  motionToggles.forEach(function (button) {
    button.addEventListener("click", function () {
      motionPaused = !motionPaused;
      try { localStorage.setItem(STORE_KEY, motionPaused ? "paused" : "playing"); } catch (e) {}
      updateMotion();
    });
  });
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
      try { history.replaceState(null, "", location.pathname + location.search + (category === "all" ? "" : "#" + category)); } catch (e) {}
    });
    function openGalleryCategory() {
      var category = location.hash.slice(1);
      var button = Array.prototype.find.call(galleryFilters.querySelectorAll("button"), function (item) {
        return item.getAttribute("data-achievement-filter") === category;
      });
      if (button) {
        button.click();
        galleryFilters.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }
    openGalleryCategory();
    window.addEventListener("hashchange", openGalleryCategory);
  }

  // Short page changes; leave modified clicks, downloads, and external links native.
  var pageNavigationPending = false;
  function pageMotionEnabled() {
    return !motionPreference.matches && document.documentElement.dataset.motion !== "paused";
  }
  window.addEventListener("pageshow", function () {
    pageNavigationPending = false;
    document.body.classList.remove("page-leaving");
    if (pageMotionEnabled()) document.body.classList.add("page-arriving");
  });
  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !pageMotionEnabled()) return;
    var link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    var destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || !/\.html$|\/$/.test(destination.pathname)) return;
    if (destination.pathname === location.pathname && destination.search === location.search) return;
    if (pageNavigationPending) { event.preventDefault(); return; }
    pageNavigationPending = true;
    event.preventDefault();
    document.body.classList.remove("page-arriving");
    document.body.classList.add("page-leaving");
    window.setTimeout(function () { location.assign(destination.href); }, 130);
  });

  var printResume = document.getElementById("print-resume");
  if (printResume) {
    printResume.hidden = false;
    printResume.style.font = "inherit";
    printResume.addEventListener("click", function () { window.print(); });
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
