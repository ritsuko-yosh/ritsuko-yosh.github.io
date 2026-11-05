/* Pick Belle up and move her. Press and drag: she dangles and swings with the
   motion, then hops when set down and stays there. A plain click still plays
   her heart reaction. Double click sends her home. Pure enhancement. */
(function () {
  "use strict";
  var root = document.documentElement;
  function playing() { return root.dataset.motion === "playing"; }

  function setup(svg) {
    var box = svg.closest("section") || document.body;     // where she can roam
    var pos = { x: 0, y: 0 }, down = null, justDragged = false;
    var swing = 0, swingV = 0, raf = 0, lastX = 0, lastT = 0, vx = 0;
    svg.classList.add("belle-draggable");

    function apply() {
      svg.style.translate = pos.x.toFixed(1) + "px " + pos.y.toFixed(1) + "px";
      svg.style.rotate = swing.toFixed(2) + "deg";
    }
    function settle() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      swing = 0; swingV = 0; vx = 0;
      apply();
    }
    // Spring that settles the swing after she is put down (or while held)
    function tick() {
      raf = 0;
      if (!playing()) { settle(); return; }
      var target = down && down.moved ? Math.max(-22, Math.min(22, -vx * 0.9)) : 0;
      swingV += (target - swing) * 0.12; swingV *= 0.82; swing += swingV;
      vx *= 0.88;
      apply();
      if (Math.abs(swingV) > 0.02 || Math.abs(swing - target) > 0.05 || (down && down.moved)) raf = requestAnimationFrame(tick);
    }
    function kick() { if (playing() && !raf) raf = requestAnimationFrame(tick); }
    new MutationObserver(function () {
      if (!playing()) settle();
    }).observe(root, { attributes: true, attributeFilter: ["data-motion"] });

    function clamp() {
      var b = box.getBoundingClientRect(), r = svg.getBoundingClientRect();
      var pad = 8;
      if (r.left < b.left + pad) pos.x += b.left + pad - r.left;
      if (r.right > b.right - pad) pos.x -= r.right - (b.right - pad);
      if (r.top < b.top + pad) pos.y += b.top + pad - r.top;
      if (r.bottom > b.bottom - pad) pos.y -= r.bottom - (b.bottom - pad);
    }

    svg.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      down = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y, moved: false, id: e.pointerId };
      lastX = e.clientX; lastT = performance.now();
    });
    window.addEventListener("pointermove", function (e) {
      if (!down || e.pointerId !== down.id) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) > 5) {
        down.moved = true;
        try { svg.setPointerCapture(e.pointerId); } catch (err) {}
        svg.classList.add("is-held");
        if (svg.belle && playing()) svg.belle.play("wiggle");
      }
      if (!down.moved) return;
      e.preventDefault();
      var now = performance.now(), dt = Math.max(1, now - lastT);
      vx = vx * 0.6 + ((e.clientX - lastX) / dt * 16) * 0.4;
      lastX = e.clientX; lastT = now;
      pos.x = down.px + dx; pos.y = down.py + dy;
      apply(); clamp(); apply();
      if (playing()) kick();
    });
    function drop(e) {
      if (!down || (e && e.pointerId !== down.id)) return;
      var moved = down.moved; down = null;
      svg.classList.remove("is-held");
      if (!moved) return;
      justDragged = true; setTimeout(function () { justDragged = false; }, 0);
      clamp(); apply();
      if (playing()) { kick(); if (svg.belle) setTimeout(function () { if (playing()) svg.belle.play("hop"); }, 120); }
      else { swing = 0; apply(); }
    }
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", drop);
    // A drag should not also count as a click (which plays the heart)
    svg.addEventListener("click", function (e) { if (justDragged) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    svg.addEventListener("dblclick", function () {
      pos.x = 0; pos.y = 0;
      svg.classList.add("is-homing"); apply();
      setTimeout(function () { svg.classList.remove("is-homing"); }, 650);
    });
  }

  function init() {
    document.querySelectorAll(".belle-portrait, .belle-working").forEach(setup);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
