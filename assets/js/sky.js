/* Night sky section. One 3D scene: background stars and skill constellations
   share the same space, so they shift against each other in depth when the
   camera orbits. Drag to look around; choosing a constellation flies the
   camera to it. Native page scroll, pause aware. Without JS the chips link
   to the Skills page. */
(function () {
  "use strict";
  var sky = document.querySelector(".sky");
  if (!sky) return;
  var root = document.documentElement;
  function playing() { return root.dataset.motion === "playing"; }
  var data = {};
  try { data = JSON.parse(document.getElementById("sky-data").textContent); } catch (e) { return; }
  var map = sky.querySelector(".sky-map");
  var stageEl = sky.querySelector(".sky-stage");
  var panel = document.getElementById("sky-panel");
  var chips = sky.querySelectorAll(".sky-chip");
  var canvas = sky.querySelector(".sky-canvas");
  var ctx = canvas.getContext && canvas.getContext("2d");
  if (!ctx) return;
  var wide = matchMedia("(min-width: 900px)");
  var ids = Object.keys(data);

  /* ---------- World: constellations ---------- */
  // Layout coordinates (960 x 520 design grid) become world units; each star
  // also gets its own depth so the shapes are genuinely three dimensional.
  var seed = 5;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var CONS = ids.map(function (id, ci) {
    var d = data[id];
    var baseZ = 3 + (1 - (d.depth || 0.6)) * 1.3 - 0.4;
    var stars = d.stars.map(function (s, i) {
      return { x: (s[0] - 480) / 480 * 1.6, y: (s[1] - 260) / 480 * 1.6, z: baseZ + (rnd() - 0.5) * 0.7, r: s[2], label: d.labels[i] };
    });
    var c = stars.reduce(function (a, s) { return [a[0] + s.x / stars.length, a[1] + s.y / stars.length, a[2] + s.z / stars.length]; }, [0, 0, 0]);
    var ext = stars.reduce(function (m, s) { return Math.max(m, Math.hypot(s.x - c[0], s.y - c[1])); }, 0);
    return { id: id, i: ci, name: d.name, stars: stars, lines: d.lines, c: c, ext: ext, proj: [], box: null, lit: 0 };
  });

  /* ---------- Camera: orbits a focus point ---------- */
  var HOME = { t: [0, 0, 3], r: 3 };
  var cam = { t: HOME.t.slice(), r: HOME.r, yaw: 0, pitch: 0, offX: 0 };
  var aim = { t: HOME.t.slice(), r: HOME.r, yaw: 0, pitch: 0, offX: 0 };
  var drag = { yaw: 0, pitch: 0 }, hover = { x: 0, y: 0 };
  var zoomed = null, hot = null, flare = -1;

  function basis() {
    var cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    var C = [cam.t[0] + cam.r * sy * cp, cam.t[1] - cam.r * sp, cam.t[2] - cam.r * cy * cp];
    var f = [cam.t[0] - C[0], cam.t[1] - C[1], cam.t[2] - C[2]], fl = Math.hypot(f[0], f[1], f[2]);
    f = [f[0] / fl, f[1] / fl, f[2] / fl];
    var r = [f[2], 0, -f[0]], rl = Math.hypot(r[0], r[2]); r = [r[0] / rl, 0, r[2] / rl];   // cross(up, f)
    var d = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]]; // cross(f, r)
    return { C: C, f: f, r: r, d: d };
  }

  /* ---------- Background stars ---------- */
  var COLORS = ["255,255,255", "255,255,255", "255,255,255", "222,232,255", "205,220,255", "255,240,224", "255,228,200"];
  var BRIGHT = ["255,255,255", "214,226,255", "190,210,255", "255,236,210", "255,214,170", "255,200,150"];
  var bgStars = [], W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  var M = { x: 0, y: 0, w: 0, h: 0 };   // map rectangle inside the section
  var halo = document.createElement("canvas"); halo.width = halo.height = 32;
  (function () {
    var g = halo.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(.22, "rgba(225,232,255,.3)"); gr.addColorStop(1, "rgba(225,232,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  })();
  var neb = document.createElement("canvas"), nctx = neb.getContext("2d");
  function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) / 2; }
  function build() {
    seed = 99;
    var r = sky.getBoundingClientRect(), mr = (stageEl || map).getBoundingClientRect();
    W = r.width; H = r.height;
    M = { x: mr.left - r.left, y: mr.top - r.top, w: mr.width, h: mr.height };
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(4400, Math.max(1600, W * H / 210)));
    bgStars = [];
    // Place stars across the whole section as seen from the home camera
    // (with a margin so turning never shows an edge), then give each a depth.
    var F0 = M.w * 0.94, ox = M.x + M.w / 2, oy = M.y + M.h / 2;
    var bx = Math.cos(-0.5), by = Math.sin(-0.5), diag = Math.hypot(W, H);
    for (var i = 0; i < n; i++) {
      var mag = Math.pow(rnd(), 3.2), band = rnd() < 0.35, sx, sy;
      if (band) {
        var t = (rnd() - 0.5) * diag * 1.2, off = gauss() * diag * 0.07;
        sx = W / 2 + bx * t - by * off; sy = H / 2 + by * t + bx * off;
      } else {
        sx = (rnd() * 1.5 - 0.25) * W; sy = (rnd() * 1.3 - 0.15) * H;
      }
      var front = rnd() < 0.07;
      var z = front ? 0.9 + rnd() * 1.4 : 4 + Math.pow(rnd(), 0.8) * 13;
      bgStars.push({
        x: (sx - ox) / F0 * z, y: (sy - oy) / F0 * z,
        z: z, b: 0.35 + mag * 0.65, c: mag > 0.45 ? BRIGHT[Math.floor(rnd() * BRIGHT.length)] : COLORS[Math.floor(rnd() * COLORS.length)], tw: 0.6 + rnd() * 2.2, ph: rnd() * 6.283
      });
    }
    neb.width = Math.round(W * 1.5); neb.height = Math.round(H * 1.5);
    nctx.clearRect(0, 0, neb.width, neb.height);
    var cx = neb.width / 2, cy = neb.height / 2, ux = Math.cos(-0.5), uy = Math.sin(-0.5), D = Math.hypot(neb.width, neb.height);
    // Soft elongated glow, stretched along the band like a real galaxy arm
    var ang = -0.5;
    function cloud(t, o, rx, ry, rgb, al, op) {
      var x = cx + ux * t - uy * o, y = cy + uy * t + ux * o;
      nctx.save(); nctx.globalCompositeOperation = op || "lighter";
      nctx.translate(x, y); nctx.rotate(ang + (rnd() - 0.5) * 0.25); nctx.scale(1, ry / rx);
      var g = nctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, "rgba(" + rgb + "," + al.toFixed(3) + ")"); g.addColorStop(1, "rgba(" + rgb + ",0)");
      nctx.fillStyle = g; nctx.fillRect(-rx, -rx, rx * 2, rx * 2);
      nctx.restore();
    }
    // 1. Broad diffuse band: warm toward the core, cooler toward the ends
    for (var k = 0; k < 40; k++) {
      var tk = (rnd() - 0.5) * D * 0.95, core = Math.exp(-Math.pow((tk + D * 0.12) / (D * 0.22), 2));
      var rgb = core > 0.45 ? (rnd() < 0.6 ? "236,214,186" : "214,200,190") : (rnd() < 0.5 ? "150,168,212" : "176,184,214");
      cloud(tk, gauss() * D * 0.03, D * (0.08 + rnd() * 0.1), D * (0.025 + rnd() * 0.03), rgb, 0.018 + core * 0.03);
    }
    // 2. Clumpy star clouds inside the band
    for (var k2 = 0; k2 < 110; k2++) {
      var tc = (rnd() - 0.5) * D * 0.9, cc = Math.exp(-Math.pow((tc + D * 0.12) / (D * 0.25), 2));
      cloud(tc, gauss() * D * 0.035, D * (0.01 + rnd() * 0.035), D * (0.006 + rnd() * 0.014), cc > 0.4 ? "245,228,205" : "200,210,240", 0.022 + cc * 0.045);
    }
    // 3. Unresolved stars: fine grain that makes the band look like a photo
    var dust = Math.round(neb.width * neb.height / 90);
    for (var j = 0; j < dust; j++) {
      var inBand = rnd() < 0.82, t3 = (rnd() - 0.5) * D, o3 = inBand ? gauss() * D * 0.045 : (rnd() - 0.5) * D;
      var cw = Math.exp(-Math.pow((t3 + D * 0.12) / (D * 0.25), 2));
      nctx.fillStyle = "rgba(" + (rnd() < 0.45 + cw * 0.3 ? "255,236,214" : "222,230,255") + "," + (inBand ? 0.05 + rnd() * (0.2 + cw * 0.15) : 0.03 + rnd() * 0.09).toFixed(3) + ")";
      var ds = rnd() < 0.93 ? 0.6 : 1.1;
      nctx.fillRect(cx + ux * t3 - uy * o3, cy + uy * t3 + ux * o3, ds, ds);
    }
    // 4. Dark dust rifts: long thin lanes that split the band, like the Great Rift
    for (var q = 0; q < 26; q++) {
      var tq = (rnd() - 0.5) * D * 0.75, oq = D * 0.004 + gauss() * D * 0.01;
      cloud(tq, oq, D * (0.03 + rnd() * 0.06), D * (0.004 + rnd() * 0.008), "0,0,0", 0.45 + rnd() * 0.25, "destination-out");
    }
  }

  /* ---------- Panel and zoom ---------- */
  var current = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function open(id, fromKey) {
    var d = data[id], con = CONS.filter(function (c) { return c.id === id; })[0];
    if (!d || !con) return;
    current = id; zoomed = con;
    chips.forEach(function (c) { c.setAttribute("aria-current", c.dataset.id === id ? "true" : "false"); });
    var total = d.skills.length, shown = d.skills.filter(function (k) { return k.href; }).length;
    var rows = d.skills.map(function (k, i) {
      var where = k.href ? '<a href="' + esc(k.href) + '">' + esc(k.w) + '</a>' : '<span class="sp-muted">' + esc(k.w) + '</span>';
      return '<li data-i="' + i + '"><span class="sp-star" aria-hidden="true"></span><span class="sp-skill">' + esc(k.s) + '</span><span class="sp-where">' + where + '</span></li>';
    }).join("");
    panel.innerHTML =
      '<button class="sp-close" type="button" aria-label="Close and zoom out">×</button>' +
      '<span class="sp-n">' + esc(d.name) + '</span>' +
      '<h3>' + esc(d.group) + '</h3>' +
      '<p class="sp-sub">' + (d.lang ? total + " languages. Brighter star means stronger." : total + " skills · " + shown + " shown in published work") + '</p>' +
      '<ul class="sp-list">' + rows + '</ul>' +
      '<a class="sp-all" href="skills.html">All skills with evidence <span aria-hidden="true">→</span></a>';
    panel.querySelectorAll(".sp-list li").forEach(function (li) {
      var i = +li.dataset.i;
      function on() { flare = i; kick(); } function off() { flare = -1; kick(); }
      li.addEventListener("pointerenter", on); li.addEventListener("pointerleave", off);
      li.addEventListener("focusin", on); li.addEventListener("focusout", off);
    });
    panel.hidden = false;
    panel.classList.remove("is-in"); void panel.offsetWidth; panel.classList.add("is-in");
    panel.querySelector(".sp-close").addEventListener("click", function () { close(true); });
    sky.classList.add("is-zoomed", "has-active");
    // Fly to the constellation, slightly from the side so its depth shows
    aim.t = con.c.slice(); aim.r = Math.max(1.7, con.ext * (wide.matches ? 4.6 : 4.0));
    aim.yaw = (con.c[0] > 0 ? -1 : 1) * 0.32; aim.pitch = -0.1;
    aim.offX = wide.matches ? -0.19 : 0;
    drag.yaw = drag.pitch = 0;
    if (fromKey) { var h = panel.querySelector("h3"); h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    var mr = map.getBoundingClientRect();
    if (mr.top < 70 || mr.top > innerHeight * 0.35) map.scrollIntoView({ block: wide.matches ? "center" : "start", behavior: playing() ? "smooth" : "auto" });
    kick();
  }
  function close(focusChip) {
    var was = current; current = null; zoomed = null; flare = -1;
    panel.hidden = true; panel.innerHTML = "";
    sky.classList.remove("is-zoomed", "has-active");
    chips.forEach(function (c) { c.setAttribute("aria-current", "false"); });
    aim.t = HOME.t.slice(); aim.r = HOME.r; aim.yaw = 0; aim.pitch = 0; aim.offX = 0;
    if (focusChip) { var ch = sky.querySelector('.sky-chip[data-id="' + was + '"]'); if (ch) ch.focus({ preventScroll: true }); }
    kick();
  }
  chips.forEach(function (c) {
    c.setAttribute("role", "button");
    c.addEventListener("click", function (e) { e.preventDefault(); current === c.dataset.id ? close(true) : open(c.dataset.id, true); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && current) close(true); });

  /* ---------- Pointer: drag to orbit, hover, click to pick ---------- */
  var down = null;
  function local(e) { var r = sky.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, r: r }; }
  function pick(p) {
    var best = null, bd = 1e9;
    CONS.forEach(function (c) {
      if (!c.box) return;
      var b = c.box;
      if (p.x > b[0] - 24 && p.x < b[2] + 24 && p.y > b[1] - 24 && p.y < b[3] + 30) {
        var d = Math.hypot(p.x - (b[0] + b[2]) / 2, p.y - (b[1] + b[3]) / 2);
        if (d < bd) { bd = d; best = c; }
      }
    });
    return best;
  }
  map.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".sky-panel")) return;
    down = { x: e.clientX, y: e.clientY, yaw: drag.yaw, pitch: drag.pitch, moved: false, id: e.pointerId };
  });
  window.addEventListener("pointermove", function (e) {
    var p = local(e);
    if (p.y >= 0 && p.y <= p.r.height) {
      hover.x = p.x / p.r.width * 2 - 1; hover.y = p.y / p.r.height * 2 - 1;
      if (!down && !e.target.closest(".sky-panel")) {
        var h = e.target.closest(".sky-map") ? pick(p) : null;
        if (h !== hot) { hot = h; map.style.cursor = hot ? "pointer" : ""; }
      }
      kick();
    }
    if (!down || e.pointerId !== down.id) return;
    var mx = e.clientX - down.x, my = e.clientY - down.y;
    if (!down.moved && Math.hypot(mx, my) > 6) { down.moved = true; sky.classList.add("is-dragging"); }
    if (down.moved) {
      drag.yaw = Math.max(-0.75, Math.min(0.75, down.yaw + mx / 380));
      drag.pitch = Math.max(-0.4, Math.min(0.4, down.pitch + my / 520));
      kick();
    }
  });
  window.addEventListener("pointerup", function (e) {
    if (!down || e.pointerId !== down.id) return;
    var wasDrag = down.moved; down = null; sky.classList.remove("is-dragging");
    if (wasDrag || e.target.closest(".sky-panel")) return;
    var c = pick(local(e));
    if (c) { current === c.id ? close(false) : open(c.id); }
    else if (current) close(false);
  });
  window.addEventListener("pointercancel", function () { down = null; sky.classList.remove("is-dragging"); });
  sky.addEventListener("pointerleave", function () { hover.x = hover.y = 0; hot = null; });

  /* ---------- Draw ---------- */
  var litAt = 0, last = 0;
  function ease(v) { return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }
  function frame(t) {
    var live = playing();
    var dt = last ? Math.min(50, t - last) : 16; last = t;
    // Gentle automatic sway so the depth is always visible
    var sway = live ? Math.sin(t / 5200) * (zoomed ? 0.2 : 0.11) : 0;
    var swayP = live ? Math.sin(t / 7100) * 0.04 : 0;
    var k = live ? 1 - Math.pow(0.004, dt / 1000) : 1;
    var tgYaw = aim.yaw + drag.yaw + sway + (live ? hover.x * 0.26 : 0);
    var tgPitch = aim.pitch + drag.pitch + swayP + (live ? hover.y * 0.12 : 0);
    for (var a = 0; a < 3; a++) cam.t[a] += (aim.t[a] - cam.t[a]) * k;
    cam.r += (aim.r - cam.r) * k; cam.yaw += (tgYaw - cam.yaw) * k; cam.pitch += (tgPitch - cam.pitch) * k; cam.offX += (aim.offX - cam.offX) * k;

    var B = basis();
    var F = M.w * 0.94, cx = M.x + M.w / 2 + cam.offX * M.w, cy = M.y + M.h / 2;
    function proj(x, y, z) {
      var dx = x - B.C[0], dy = y - B.C[1], dz = z - B.C[2];
      var zc = dx * B.f[0] + dy * B.f[1] + dz * B.f[2];
      if (zc < 0.12) return null;
      return [cx + (dx * B.r[0] + dy * B.r[1] + dz * B.r[2]) / zc * F, cy + (dx * B.d[0] + dy * B.d[1] + dz * B.d[2]) / zc * F, zc];
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.drawImage(neb, W / 2 - neb.width / 2 - cam.yaw * W * 0.12, H / 2 - neb.height / 2 + cam.pitch * H * 0.12);

    // Background stars
    for (var i = 0; i < bgStars.length; i++) {
      var s = bgStars[i], p = proj(s.x, s.y, s.z);
      if (!p || p[0] < -8 || p[0] > W + 8 || p[1] < -8 || p[1] > H + 8) continue;
      var near = Math.max(0, Math.min(1, 1.6 / p[2]));
      var tw = live ? 0.86 + 0.14 * Math.sin(t / 1000 * s.tw + s.ph) : 1;
      var al = Math.min(1, s.b * (0.78 + near * 0.5)) * tw * (zoomed ? 0.8 : 1);
      if (p[2] < 0.6) al *= (p[2] - 0.12) / 0.48;
      if (al <= 0.02) continue;
      var size = s.b * (0.85 + near * 1.1);
      ctx.globalAlpha = al; ctx.fillStyle = "rgb(" + s.c + ")";
      if (size < 0.9) ctx.fillRect(p[0], p[1], Math.max(0.6, size), Math.max(0.6, size));
      else {
        // soft halo first (natural point spread), then a crisp core
        var hr = size * (s.b > 0.8 ? 4.2 : 2.4);
        ctx.globalAlpha = al * (s.b > 0.8 ? 0.42 : 0.22); ctx.drawImage(halo, p[0] - hr, p[1] - hr, hr * 2, hr * 2);
        ctx.globalAlpha = al; ctx.beginPath(); ctx.arc(p[0], p[1], size * 0.5, 0, 6.283); ctx.fill();
      }
    }

    // Constellations, kept inside the map area, sorted far to near
    ctx.save(); ctx.beginPath(); ctx.rect(M.x - 140, M.y - 10, M.w + 280, M.h + 40); ctx.clip();
    var order = CONS.slice().sort(function (a, b) {
      var pa = proj(a.c[0], a.c[1], a.c[2]), pb = proj(b.c[0], b.c[1], b.c[2]);
      return (pb ? pb[2] : 0) - (pa ? pa[2] : 0);
    });
    var lit = sky.classList.contains("sky-lit");
    order.forEach(function (c) {
      var P = c.stars.map(function (s) { return proj(s.x, s.y, s.z); });
      c.proj = P;
      var ok = P.filter(Boolean);
      if (!ok.length) { c.box = null; return; }
      c.box = [Math.min.apply(null, ok.map(function (q) { return q[0]; })), Math.min.apply(null, ok.map(function (q) { return q[1]; })),
               Math.max.apply(null, ok.map(function (q) { return q[0]; })), Math.max.apply(null, ok.map(function (q) { return q[1]; }))];
      var isOn = zoomed === c, dim = zoomed && !isOn, isHot = hot === c && !zoomed;
      var base = dim ? 0.13 : 1;
      // draw-in progress
      var prog = !live ? 1 : (lit ? Math.max(0, Math.min(1, (t - litAt - c.i * 320) / 1000)) : 0);
      var pe = ease(prog);
      ctx.lineCap = "round";
      c.lines.forEach(function (ln, li) {
        var A = P[ln[0]], Bp = P[ln[1]];
        if (!A || !Bp) return;
        var lp = Math.max(0, Math.min(1, pe * c.lines.length - li));
        if (lp <= 0) return;
        var zA = Math.max(0.5, A[2]), zB = Math.max(0.5, Bp[2]);
        var gr = ctx.createLinearGradient(A[0], A[1], Bp[0], Bp[1]);
        var la = (isOn ? 0.9 : isHot ? 0.85 : 0.45) * base;
        gr.addColorStop(0, "rgba(214,185,132," + Math.min(1, la * 2.4 / zA).toFixed(3) + ")");
        gr.addColorStop(1, "rgba(214,185,132," + Math.min(1, la * 2.4 / zB).toFixed(3) + ")");
        ctx.globalAlpha = 1; ctx.strokeStyle = gr; ctx.lineWidth = Math.max(0.6, 2.4 / ((zA + zB) / 2));
        ctx.beginPath(); ctx.moveTo(A[0], A[1]);
        ctx.lineTo(A[0] + (Bp[0] - A[0]) * lp, A[1] + (Bp[1] - A[1]) * lp); ctx.stroke();
      });
      P.forEach(function (q, si) {
        if (!q) return;
        var s = c.stars[si];
        var sz = s.r * 2.6 / q[2] * (isOn ? 1.15 : 1);
        var pulse = live && !isOn ? 0.82 + 0.18 * Math.sin(t / 900 + si * 1.7 + c.i) : 1;
        var al = base * pulse;
        var hr = sz * (flare === si && isOn ? 9 : 5.5);
        ctx.globalAlpha = al * (isOn || isHot ? 0.75 : 0.5); ctx.drawImage(halo, q[0] - hr, q[1] - hr, hr * 2, hr * 2);
        ctx.globalAlpha = al; ctx.fillStyle = "#fffaf0";
        ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(1, sz * 0.55), 0, 6.283); ctx.fill();
      });
      // Names and, when zoomed, every skill
      var mx = (c.box[0] + c.box[2]) / 2;
      if (!isOn) {
        ctx.globalAlpha = base * (isHot ? 1 : 0.72);
        ctx.fillStyle = isHot ? "#e9cf9c" : "#9aa5bb";
        ctx.font = "italic 15px 'Source Serif 4', Georgia, serif"; ctx.textAlign = "center";
        ctx.fillText(c.name, mx, c.box[3] + 34);
      } else {
        ctx.font = "500 13px Inter, system-ui, sans-serif";
        P.forEach(function (q, si) {
          if (!q) return;
          var left = q[0] < mx - 4, right = q[0] > mx + 4;
          ctx.textAlign = left ? "right" : right ? "left" : "center";
          var lx = left ? q[0] - 14 : right ? q[0] + 14 : q[0];
          var ly = left || right ? q[1] + 4 : (q[1] < (c.box[1] + c.box[3]) / 2 ? q[1] - 16 : q[1] + 24);
          ctx.globalAlpha = Math.min(1, Math.max(0, 1 - Math.abs(cam.r - aim.r) * 2));
          ctx.fillStyle = flare === si ? "#f3dcae" : "#f1ece2";
          ctx.fillText(c.stars[si].label, lx, ly);
        });
      }
    });
    ctx.restore();
    ctx.globalAlpha = 1;
    var settling = Math.abs(cam.r - aim.r) > 0.002 || Math.abs(cam.yaw - tgYaw) > 0.001 || Math.abs(cam.offX - aim.offX) > 0.001;
    return live || settling || down;
  }

  var visible = false, raf = 0;
  function loop(t) { raf = 0; var more = frame(t); if (visible && more) raf = requestAnimationFrame(loop); }
  function kick() { if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); } }

  if ("IntersectionObserver" in window) {
    var lio = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { sky.classList.add("sky-lit"); litAt = performance.now(); lio.disconnect(); kick(); }
    }, { threshold: 0.3 });
    lio.observe(map);
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; kick(); }).observe(sky);
  } else { sky.classList.add("sky-lit"); visible = true; }

  build(); frame(performance.now()); kick();
  // Rebuild whenever the section changes size (window resize, panel opening on phones)
  var rt = 0, lastSize = "";
  function onSize() {
    var r = sky.getBoundingClientRect(), key = Math.round(r.width) + "x" + Math.round(r.height);
    if (key === lastSize) return; lastSize = key;
    clearTimeout(rt); rt = setTimeout(function () { build(); frame(performance.now()); kick(); }, 60);
  }
  if ("ResizeObserver" in window) new ResizeObserver(onSize).observe(sky);
  window.addEventListener("resize", onSize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { kick(); });
  new MutationObserver(function () { kick(); }).observe(root, { attributes: true, attributeFilter: ["data-motion"] });
})();
