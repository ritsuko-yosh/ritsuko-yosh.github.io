/* Belle: a hand drawn puppy that walks, hops, sniffs, wiggles, waves and naps.
   Works on any <svg class="belle-svg belle-walking"> or <svg class="belle-svg belle-idle">.
   A walking Belle inside an element with class "belle-walk" also travels along its parent.
   Click or tap her to make her hop. From the console: document.querySelector('.belle-svg').belle.play('hop') */
(function () {
  var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  function motionAllowed() { return !motionPreference.matches && document.documentElement.dataset.motion !== 'paused' && !document.hidden; }
  var svgs = document.querySelectorAll('.belle-svg');
  if (!svgs.length) return;

  var ACTIONS = {
    type: 2.8, hop: 1.0, sniff: 1.8, wiggle: 1.5, wave: 1.7, nap: 5.5, heart: 1.0
  };
  var WALK_STOPS = ['sniff', 'hop', 'wiggle', 'wave'];
  var IDLE_PICKS = ['wave', 'hop', 'wiggle', 'sniff', 'nap', 'look', 'look'];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function bell(p, a, b) { if (p <= a || p >= b) return 0; return Math.sin(Math.PI * (p - a) / (b - a)); }
  function S(x) { return { x: x || 0, v: 0 }; }
  function spring(s, target, k, c, dt) {
    var acc = k * (target - s.x) - c * s.v;
    s.v += acc * dt; s.x += s.v * dt;
    return s.x;
  }
  function about(cx, cy, inner) { return 'translate(' + cx + ' ' + cy + ') ' + inner + ' translate(' + (-cx) + ' ' + (-cy) + ')'; }
  function set(el, v) { if (el) el.setAttribute('transform', v); }
  function f(n) { return n.toFixed(2); }

  function Rig(svg) {
    var q = function (c) { return svg.querySelector(c); };
    this.svg = svg;
    this.walking = svg.classList.contains('belle-walking');
    this.walker = this.walking ? svg.closest('.belle-walk') : null;
    this.el = {
      bob: q('.b-bob'), head: q('.b-head'), face: q('.b-face'), eyes: q('.b-eyes'),
      collar: q('.b-collar'), tag: q('.b-tag'), earL: q('.b-ear-l'), earR: q('.b-ear-r'),
      armL: q('.b-arm-l'), armR: q('.b-arm-r'), legs: q('.b-legs'), legL: q('.b-leg-l'), legR: q('.b-leg-r'),
      tail: q('.b-tail'), shadow: q('.b-shadow'), zzz: q('.b-zzz'), heart: q('.b-heart'),
      z: [q('.b-z1'), q('.b-z2'), q('.b-z3')]
    };
    this.phase = rand(0, 6.28);
    this.speed = 1;
    this.headY = S(); this.headR = S(); this.tilt = S(); this.lean = S(); this.lift = S();
    this.earL = S(); this.earR = S(); this.tail = S(); this.armL = S(); this.armR = S(); this.tagA = S();
    this.look = S(this.walking ? 8 : 0); this.lookY = S(); this.eyeOpen = S(1);
    this.lookTarget = this.walking ? 8 : 0; this.lookYTarget = 0; this.tiltTarget = 0;
    this.nextLook = rand(1.5, 3.5);
    this.nextBlink = rand(1, 4); this.blink = 0;
    this.action = null; this.actionT = 0;
    this.nextAction = svg.classList.contains('belle-working') ? 0.5 : this.walking ? rand(5, 8) : rand(2.5, 4.5);
    this.prevSway = 0; this.earVel = 0;
    this.x = this.walking ? rand(-60, 200) : 0;
    this.cursor = null;
    this.visible = true;
    var self = this;
    svg.removeAttribute('aria-hidden');
    svg.setAttribute('role', 'button');
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('focusable', 'true');
    svg.setAttribute('aria-label', 'Animate the dog illustration');
    function activate() { if (motionAllowed()) self.play('heart'); }
    svg.addEventListener('click', activate);
    svg.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
    });
  }

  Rig.prototype.play = function (name) {
    if (!ACTIONS[name]) return;
    if (this.action && this.action !== 'nap' && this.action !== 'heart' && name !== 'heart') return;
    this.action = name; this.actionT = 0;
  };

  Rig.prototype.update = function (dt, now) {
    var e = this.el, w = this.walking;
    var act = this.action, p = 0;
    if (act) {
      this.actionT += dt; p = this.actionT / ACTIONS[act];
      if (p >= 1) { this.action = act = null; p = 0; this.nextAction = w ? rand(5, 9) : rand(2.5, 5); }
    } else {
      this.nextAction -= dt;
      if (this.nextAction <= 0) {
        var choice = pick(this.svg.classList.contains('belle-working') ? ['type', 'type', 'sniff', 'look'] : w ? WALK_STOPS : IDLE_PICKS);
        if (choice === 'look') { this.lookTarget = pick([-9, 9]); this.tiltTarget = rand(-7, 7); this.nextLook = rand(1.5, 2.5); this.nextAction = rand(2, 4); }
        else this.play(choice);
        act = this.action; p = 0;
      }
    }
    var moving = w && !act;

    // where she looks: cursor first, then her own wandering
    this.nextLook -= dt;
    if (this.nextLook <= 0) {
      if (w) { var r = Math.random(); this.lookTarget = r < 0.25 ? 0 : r < 0.4 ? 4 : 8; this.lookYTarget = rand(-0.5, 1.5); this.tiltTarget = this.lookTarget === 0 ? rand(-5, 5) : rand(-1.5, 2); this.nextLook = rand(2, 5); }
      else { this.lookTarget = pick([-6, -3, 0, 0, 3, 6]); this.lookYTarget = rand(-2, 1.5); this.tiltTarget = rand(-5, 5) * (Math.random() < 0.5 ? 0.3 : 1); this.nextLook = rand(1.2, 3.8); }
    }
    var lookT = this.lookTarget, lookYT = this.lookYTarget, tiltT = this.tiltTarget;
    if (this.cursor && !act) {
      var rc = this.svg.getBoundingClientRect();
      var dx = this.cursor.x - (rc.left + rc.width / 2), dy = this.cursor.y - (rc.top + rc.height * 0.3);
      if (Math.abs(dx) < 420 && Math.abs(dy) < 420) { lookT = clamp(dx / 30, -9, 9); lookYT = clamp(dy / 45, -3, 3); }
    }

    // base rhythm
    var up, sway, sq, lean, stepL = 0, stepR = 0, depthL = 0, depthR = 0, armDrive, armL = 0, armR = 0;
    var bodyY, airY = 0, headDY = 0, headRotX = 0, eyes = 1, wagSpeed = w ? 9 : 5, wagAmp = w ? 12 : 7, squint = false;
    if (moving) {
      this.speed += (rand(0.92, 1.08) - this.speed) * 0.01;
      this.phase += dt * 2 * Math.PI / (1.05 / this.speed);
      var ph = this.phase;
      up = (1 - Math.cos(2 * ph)) / 2; sway = Math.sin(ph) * 2.6; sq = 1 - up; lean = -5;
      stepL = Math.max(0, Math.sin(ph)); stepR = Math.max(0, -Math.sin(ph));
      depthL = Math.cos(ph); depthR = -Math.cos(ph);
      armDrive = Math.sin(ph); armL = -armDrive * 14; armR = armDrive * 14;
    } else {
      this.phase += dt * 2 * Math.PI / 3.4;
      var b = (1 - Math.cos(this.phase)) / 2;
      up = b * 0.45; sway = Math.sin(this.phase * 0.5) * 1.2; sq = 0.25 * (1 - b); lean = 0;
      armDrive = Math.sin(this.phase) * 0.25; armL = armDrive * 4 + 3; armR = -armDrive * 4 - 3;
    }
    bodyY = -up * (moving ? 6 : 3);

    // actions layer on top of the rhythm
    if (act === 'hop' || act === 'heart') {
      var crouch = bell(p, 0, 0.28), land = bell(p, 0.72, 1);
      var air = p > 0.22 && p < 0.78 ? Math.sin(Math.PI * (p - 0.22) / 0.56) : 0;
      sq = Math.max(crouch, land) * 1.2 - air * 0.8; up = air;
      airY = -air * 26; bodyY = (crouch + land) * 3;
      armL = 10 + air * 45; armR = -10 - air * 45; lookT = 0; lookYT = -1.5 * air; tiltT = 0;
      wagSpeed = 14; wagAmp = 16; squint = air > 0.3;
    } else if (act === 'type') {
      var typing = bell(p, 0, 1);
      headDY = 3 * typing; lookT = 3; lookYT = 3; tiltT = -3;
      armL = 12 + Math.sin(p * 55) * 6 * typing;
      armR = -12 - Math.cos(p * 55) * 6 * typing;
      wagAmp = 4; bodyY -= Math.sin(p * 28) * 0.5 * typing;
    } else if (act === 'sniff') {
      var down = ease(bell(p, 0, 1) > 0 ? Math.min(1, Math.min(p, 1 - p) * 5) : 0);
      headDY = 9 * down; headRotX = (w ? 9 : 4) * down; lean = (w ? -12 : -4) * down;
      lookT = (w ? 9 : 2) * down + (1 - down) * lookT; lookYT = 3 * down + Math.sin(p * 46) * 1.1 * down;
      armL = 6 * down; armR = -6 * down; wagAmp = 6;
    } else if (act === 'wiggle') {
      var amt = bell(p, 0, 1);
      sway = Math.sin(p * Math.PI * 9) * 8 * amt; bodyY = -Math.abs(Math.sin(p * Math.PI * 9)) * 4 * amt;
      armL = Math.sin(p * Math.PI * 9) * 22 * amt + 8; armR = Math.sin(p * Math.PI * 9) * 22 * amt - 8;
      lookT = 0; tiltT = Math.sin(p * Math.PI * 4.5) * 6 * amt; squint = amt > 0.2;
      wagSpeed = 18; wagAmp = 22;
    } else if (act === 'wave') {
      lookT = 0; lookYT = -1; tiltT = -5 * bell(p, 0, 1);
      var wv = Math.min(1, p * 5, (1 - p) * 5);
      armR = -wv * (40 + 16 * Math.sin(p * 30)); wagSpeed = 12; wagAmp = 14;
    } else if (act === 'nap') {
      var sleep = Math.min(1, p * 4, (1 - p) * 6);
      eyes = 1 - 0.9 * sleep; tiltT = 9 * sleep; lookT = 0; lookYT = 2 * sleep; headDY = 4 * sleep;
      var br = (1 - Math.cos(p * Math.PI * 2 * 3)) / 2;
      sq = 0.6 * sleep * (1 - br); up = br * 0.8 * sleep; bodyY = 1.5 * sleep - br * 2 * sleep;
      armL = 8 * sleep; armR = -8 * sleep; wagAmp = 7 * (1 - sleep);
    }

    var sx = 1 + 0.045 * sq - 0.02 * up, sy = 1 - 0.045 * sq + 0.03 * up;
    var leanS = spring(this.lean, lean, 40, 10, dt);
    var lift = spring(this.lift, airY, 260, 18, dt);

    set(e.bob, 'translate(0 ' + f(bodyY + lift) + ') ' + about(110, 222, 'rotate(' + f(sway) + ') skewX(' + f(leanS) + ') scale(' + sx.toFixed(4) + ' ' + sy.toFixed(4) + ')'));
    set(e.legs, 'translate(0 ' + f(lift * 0.92) + ')');

    var hy = spring(this.headY, bodyY * 0.35 + headDY, 120, 11, dt);
    var headVel = this.headY.v;
    var tilt = spring(this.tilt, tiltT, 40, 9, dt);
    var hr = spring(this.headR, -sway * 0.5 + tilt + headRotX, 90, 10, dt);
    set(e.head, 'translate(0 ' + f(hy * 0.6 + (headDY ? hy * 0.4 : 0)) + ') ' + about(110, 128, 'rotate(' + f(hr) + ') scale(' + (1 + 0.025 * sq).toFixed(4) + ' ' + (1 - 0.025 * sq).toFixed(4) + ')'));

    var lx = spring(this.look, lookT, 55, 9, dt);
    var ly = spring(this.lookY, lookYT, 55, 9, dt);
    set(e.face, 'translate(' + f(lx) + ' ' + f(ly) + ')');
    set(e.collar, 'translate(' + f(lx * 0.55) + ' ' + f(hy * 0.3) + ')');

    this.nextBlink -= dt;
    if (this.nextBlink <= 0 && this.blink <= 0) { this.blink = 0.16; this.nextBlink = Math.random() < 0.2 ? 0.28 : rand(2.2, 5.5); }
    if (this.blink > 0) this.blink -= dt;
    var blinkY = this.blink > 0 ? 0.12 + 0.88 * Math.abs(this.blink / 0.16 - 0.5) * 2 : 1;
    var open = spring(this.eyeOpen, squint ? 0.35 : eyes, 120, 16, dt);
    set(e.eyes, about(110, 73, 'scale(1 ' + clamp(Math.min(blinkY, open), 0.08, 1).toFixed(3) + ')'));

    this.earVel += (headVel - this.earVel) * Math.min(1, dt * 6);
    var flop = clamp(this.earVel * 0.25 - lift * 0.0, -4, 4) + clamp(-this.lift.v * 0.05, -10, 10);
    var hang = -hr * 0.45;
    set(e.earL, about(80, 42, 'rotate(' + f(spring(this.earL, hang + flop, 28, 6.5, dt)) + ')'));
    set(e.earR, about(140, 42, 'rotate(' + f(spring(this.earR, hang - flop, 28, 6.5, dt)) + ')'));

    set(e.armL, about(80, 148, 'rotate(' + f(spring(this.armL, armL, 110, 9, dt)) + ') scale(' + (1 + (moving ? -armDrive * 0.05 : 0)).toFixed(3) + ')'));
    set(e.armR, about(140, 148, 'rotate(' + f(spring(this.armR, armR, 110, 9, dt)) + ') scale(' + (1 + (moving ? armDrive * 0.05 : 0)).toFixed(3) + ')'));

    set(e.legL, about(94, 220, 'translate(' + f(depthL * 2.5) + ' ' + f(-stepL * 6) + ') scale(' + (1 + depthL * 0.07).toFixed(3) + ')'));
    set(e.legR, about(126, 220, 'translate(' + f(depthR * 2.5) + ' ' + f(-stepR * 6) + ') scale(' + (1 + depthR * 0.07).toFixed(3) + ')'));

    set(e.tail, about(156, 196, 'rotate(' + f(spring(this.tail, Math.sin(now * wagSpeed) * wagAmp, 160, 8, dt)) + ')'));

    var swayVel = (sway - this.prevSway) / Math.max(dt, 0.001); this.prevSway = sway;
    var tg = spring(this.tagA, clamp(-swayVel * 1.2 - sway * 2 - lx * 0.8 + this.lift.v * 0.0, -40, 40), 90, 4, dt);
    set(e.tag, about(110, 139.5, 'rotate(' + f(clamp(tg, -35, 35)) + ')'));

    var h = clamp(-lift / 26, 0, 1);
    set(e.shadow, about(110, 229, 'scale(' + (1 - up * 0.14 * (moving ? 1 : 0.4) - h * 0.35).toFixed(3) + ' ' + (1 - up * 0.2 * (moving ? 1 : 0.4) - h * 0.35).toFixed(3) + ')'));
    if (e.shadow) e.shadow.setAttribute('opacity', (0.45 - h * 0.25).toFixed(2));

    // little z's while napping
    if (e.zzz) {
      var zOn = act === 'nap' ? Math.min(1, p * 4, (1 - p) * 6) : 0;
      e.zzz.setAttribute('opacity', zOn.toFixed(2));
      for (var i = 0; i < 3; i++) if (e.z[i]) {
        var zp = ((now * 0.45) + i / 3) % 1;
        e.z[i].setAttribute('opacity', (Math.sin(Math.PI * zp)).toFixed(2));
        e.z[i].setAttribute('transform', 'translate(' + f(zp * 6) + ' ' + f(-zp * 10) + ')');
      }
    }
    // heart pops up on click
    if (e.heart) {
      var hp = act === 'heart' ? p : 1;
      var ho = act === 'heart' ? Math.min(1, hp * 6, (1 - hp) * 3) : 0;
      e.heart.setAttribute('opacity', ho.toFixed(2));
      e.heart.setAttribute('transform', about(110, 4, 'translate(' + f(Math.sin(hp * 9) * 3) + ' ' + f(-hp * 22) + ') scale(' + (0.5 + 0.5 * Math.min(1, hp * 5)).toFixed(3) + ')'));
    }

    // travel along the strip
    if (this.walker) {
      var W = this.walker.parentElement ? this.walker.parentElement.clientWidth : 800;
      if (moving) this.x += dt * 40 * this.speed;
      if (this.x > W + 20) this.x = -120;
      var depth = Math.sin(Math.PI * clamp((this.x + 120) / (W + 140), 0, 1));
      this.walker.style.transform = 'translate(' + f(this.x) + 'px,' + f(4 - depth * 10) + 'px) scale(' + (0.86 + depth * 0.22).toFixed(3) + ')';
    }
  };

  var rigs = [];
  for (var i = 0; i < svgs.length; i++) {
    var rig = new Rig(svgs[i]);
    svgs[i].belle = rig;
    rigs.push(rig);
    if ('IntersectionObserver' in window) {
      (function (r, node) { new IntersectionObserver(function (en) { r.visible = en[0].isIntersecting; }).observe(node); })(rig, rig.walker && rig.walker.parentElement ? rig.walker.parentElement : svgs[i]);
    }
  }
  var notebook = document.querySelector('.analyst-notebook');
  if (notebook) {
    var controls = notebook.querySelector('.notebook-controls');
    controls.hidden = false;
    function selectProject(button, react) {
      var subject = button.dataset.notebook;
      notebook.dataset.subject = subject;
      controls.querySelectorAll('button').forEach(function (item) {
        item.setAttribute('aria-pressed', String(item === button));
      });
      notebook.querySelectorAll('.notebook-panel').forEach(function (panel) {
        panel.hidden = panel.id !== 'notebook-' + subject;
        panel.classList.remove('notebook-selected');
        if (!panel.hidden && react && motionAllowed()) {
          void panel.offsetWidth;
          panel.classList.add('notebook-selected');
        }
      });
      var dog = notebook.querySelector('.belle-working');
      if (react && motionAllowed() && dog && dog.belle) {
        dog.belle.action = null;
        dog.belle.play(subject === 'forecast' ? 'type' : subject === 'strategy' ? 'wave' : 'sniff');
      }
    }
    controls.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-notebook]');
      if (button) selectProject(button, true);
    });
    selectProject(controls.querySelector('button'), false);
  }
  window.addEventListener('pointermove', function (ev) {
    for (var j = 0; j < rigs.length; j++) rigs[j].cursor = { x: ev.clientX, y: ev.clientY };
  }, { passive: true });
  document.addEventListener('pointerleave', function () { for (var j = 0; j < rigs.length; j++) rigs[j].cursor = null; });

  var last = performance.now();
  var animationTime = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    if (motionAllowed()) {
      animationTime += dt;
      for (var j = 0; j < rigs.length; j++) if (rigs[j].visible) rigs[j].update(dt, animationTime);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
