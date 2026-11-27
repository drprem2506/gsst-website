/* GSST home page: a world in flux, seen whole.
   A 4 x 3 grid: four worlds (personal, learning, work, the wider world), each widening from left to right.
   Dots (things that can change) drift across every boundary, linked by dashed lines. Some are hidden until a change
   reaches them. Every few seconds a change starts in one area and ripples in that area's own direction, so ripples cross.
   Runs only while on screen; a still picture for visitors who prefer reduced motion. */
(function () {
  var cv = document.getElementById("flux");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var HUES = ["#f4b2a1", "#f9d48a", "#9fd8e6", "#c9b6e8", "#a6dcbc"];
  var FLOWS = ["44,122,85", "59,127,168", "184,134,43", "122,95,168"];   // different kinds of flow (unlabelled): green, blue, amber, violet
  var RED = "#c8372d";
  var GRID = [["One person", "A family", "A community"],
              ["A student", "A class", "A school"],
              ["A team", "A department", "An organisation"],
              ["A nation", "A region", "The world"]];
  var NR = GRID.length, NC = 3;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, dpr = 1, dots = [], running = false, last = 0, nextPulse = 1.5, t = 0, pulses = 0;
  var LONG = [], BEAD = null;                            // lasting long-distance links, and a pulse travelling the one-person-to-world line
  // each area has its own direction of influence, slowly turning, so ripples cross and overlap
  var DIR = []; for (var q = 0; q < NR * NC; q++) DIR.push({ a: Math.random() * Math.PI * 2, s: (Math.random() - 0.5) * 0.12 });
  function cellOf(d) { return Math.min(NR - 1, Math.floor(d.y / H * NR)) * NC + Math.min(NC - 1, Math.floor(d.x / W * NC)); }

  function seed() {
    var n = NR * NC * (W > 500 ? 3 : 2);                  // a few dots in every area, so the picture stays readable
    dots = [];
    for (var i = 0; i < n; i++) {
      var k = Math.random();
      var cell = i % (NR * NC), col = cell % NC, row = Math.floor(cell / NC);
      var d = {
        r: k < 0.15 ? 11 : k < 0.5 ? 7 : 4,               // big, medium and small variables
        c: HUES[i % HUES.length], glow: 0, wait: -1, hops: 0,
        hidden: Math.random() < 0.35,
        hx: (col + 0.15 + Math.random() * 0.7) / NC,      // a loose home cell, so every cell keeps some dots
        hy: (row + 0.15 + Math.random() * 0.7) / NR,
        vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14
      };
      d.x = d.hx * W; d.y = d.hy * H; d.cell = cell;
      dots.push(d);
    }
    LONG = [];
    var inCell = function (c) { return dots.filter(function (d) { return d.cell === c && !d.hidden; }); };
    var p = inCell(0)[0] || dots[0], w = inCell(NR * NC - 1)[0] || dots[dots.length - 1];
    p.hidden = false; w.hidden = false; p.r = Math.max(p.r, 7); w.r = 11;
    LONG.push({ a: p, b: w, key: true, f: 0 });           // one person, the world
    var tries = 0;
    while (LONG.length < 9 && tries++ < 200) {            // a few lasting links across columns
      var a = dots[Math.floor(Math.random() * dots.length)], b = dots[Math.floor(Math.random() * dots.length)];
      if (a === b || a.cell % NC === b.cell % NC) continue;
      if (Math.abs(Math.floor(a.cell / NC) - Math.floor(b.cell / NC)) > 1) continue;
      if (LONG.some(function (l) { return (l.a === a && l.b === b) || (l.a === b && l.b === a); })) continue;
      LONG.push({ a: a, b: b, key: false, f: Math.floor(Math.random() * FLOWS.length) });
    }
  }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    var oW = W, oH = H;
    W = Math.max(1, cv.clientWidth); H = Math.max(1, cv.clientHeight);   // inside the border: pixel for pixel
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (dots.length && oW > 1 && (oW !== W || oH !== H)) dots.forEach(function (d) { d.x *= W / oW; d.y *= H / oH; });
    if (!dots.length && W > 40) seed();
  }
  function reach() { return Math.max(80, Math.min(150, Math.min(W / NC, H / NR) * 1.2)); }

  function step(dt) {
    t += dt;
    var R = reach();
    for (var i = 0; i < dots.length; i++) {
      var a = dots[i], fx = 0, fy = 0;
      for (var j = 0; j < dots.length; j++) {
        if (i === j) continue;
        var b = dots[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < R) { var pull = (d - R * 0.55) / R; fx += (dx / d) * pull * 1.2; fy += (dy / d) * pull * 1.2; }
        if (d < a.r + b.r + 22) { fx -= (dx / d) * 16; fy -= (dy / d) * 16; }
      }
      fx += (a.hx * W - a.x) * 0.014; fy += (a.hy * H - a.y) * 0.014;   // drift, but stay roughly in its home cell
      fx += Math.cos(t * 0.2 + a.y * 0.012 + a.r) * 6;                    // a slowly turning current
      fy += Math.sin(t * 0.17 + a.x * 0.012 + a.r) * 6;
      a.vx = (a.vx + fx * dt) * 0.985; a.vy = (a.vy + fy * dt) * 0.985;
      var sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy), max = 30 / Math.sqrt(a.r / 4);
      if (sp > max) { a.vx *= max / sp; a.vy *= max / sp; }
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < a.r) { a.x = a.r; a.vx = Math.abs(a.vx); } if (a.x > W - a.r) { a.x = W - a.r; a.vx = -Math.abs(a.vx); }
      if (a.y < a.r) { a.y = a.r; a.vy = Math.abs(a.vy); } if (a.y > H - a.r) { a.y = H - a.r; a.vy = -Math.abs(a.vy); }
      if (a.glow > 0) a.glow = Math.max(0, a.glow - dt * 0.6);
      if (a.wait >= 0) { a.wait -= dt; if (a.wait < 0) { a.glow = 1; spread(a); } }
    }
    if (BEAD) {                                           // the pulse travelling from one person to the world
      BEAD.p += dt / 1.8;
      if (BEAD.p >= 1) { var w = BEAD.to; w.glow = 1; w.hops = 3; w.fan = 2; var aw = DIR[w.cell].a + DIR[w.cell].s * t; w.dx = Math.cos(aw); w.dy = Math.sin(aw); spread(w); BEAD = null; }
    }
    nextPulse -= dt;
    if (nextPulse <= 0) {
      pulses++;
      var key = LONG[0];
      if (pulses % 3 === 0 && key && !BEAD) {            // every third: one person's action reaches the world
        key.a.glow = 1; BEAD = { from: key.a, to: key.b, p: 0 };
      } else {                                           // otherwise a change starts anywhere, heading its area's way
        var s0 = dots[Math.floor(Math.random() * dots.length)], dir = DIR[cellOf(s0)];
        var ang = dir.a + dir.s * t;
        s0.hops = 5; s0.fan = Math.random() < 0.5 ? 2 : 1; s0.dx = Math.cos(ang); s0.dy = Math.sin(ang);
        s0.glow = 1; spread(s0);
      }
      nextPulse = 3.5 + Math.random() * 2.5;
    }
  }
  function spread(src) {
    if (!src.hops) return;
    var R = reach();
    var near = dots.filter(function (b) {
      if (b === src || b.glow > 0.2 || b.wait >= 0) return false;
      var dx = b.x - src.x, dy = b.y - src.y; return dx * dx + dy * dy < R * R;
    }).map(function (b) {
      var dx = b.x - src.x, dy = b.y - src.y, d = Math.hypot(dx, dy) || 1;
      return { b: b, score: (dx * src.dx + dy * src.dy) / d };   // how well it lies in the ripple's direction
    }).filter(function (o) { return o.score > 0.15; });
    LONG.forEach(function (l) {                           // effects can also jump along a lasting long link
      if (l.key) return;
      var other = l.a === src ? l.b : l.b === src ? l.a : null;
      if (other && other.glow < 0.2 && other.wait < 0 && Math.random() < 0.7) near.push({ b: other, score: 2 });
    });
    near.sort(function (p, q) { return q.score - p.score; });
    near.slice(0, src.fan || 1).forEach(function (o, k) {
      var b = o.b, turn = (k === 0 ? 0 : 0.7) * (Math.random() < 0.5 ? -1 : 1);   // a branch veers off a little
      var c = Math.cos(turn), s = Math.sin(turn);
      b.wait = 0.55 + Math.random() * 0.3; b.hops = src.hops - 1; b.fan = 1;
      b.dx = src.dx * c - src.dy * s; b.dy = src.dx * s + src.dy * c;
    });
  }

  function grid() {
    ctx.save();
    ctx.strokeStyle = "rgba(86,101,95,.30)"; ctx.lineWidth = 1.5; ctx.setLineDash([2, 7]);
    for (var i = 1; i < NC; i++) { var x = Math.round(W * i / NC) + 0.5; ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, H - 6); ctx.stroke(); }
    for (var j = 1; j < NR; j++) { var y = Math.round(H * j / NR) + 0.5; ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(W - 6, y); ctx.stroke(); }
    ctx.restore();
  }
  function labels() {                                      // drawn last, so dots never cover them
    ctx.save();
    var fs = W < 420 ? 11 : 12.5;
    ctx.font = "600 " + fs + "px 'Source Sans 3', system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (var r = 0; r < NR; r++) for (var c = 0; c < NC; c++) {
      var txt = GRID[r][c], x = W * (c + 0.5) / NC, y = H * (r + 1) / NR - 13, w = ctx.measureText(txt).width + 14;
      ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 10, w, 20, 10); else ctx.rect(x - w / 2, y - 10, w, 20);
      ctx.fill();
      ctx.fillStyle = "rgba(86,101,95,.95)"; ctx.fillText(txt, x, y);
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    grid();
    LONG.forEach(function (l) {                           // lasting links, drawn whatever the distance
      var hot = Math.min(l.a.glow, l.b.glow);
      ctx.setLineDash([4, 7]);
      ctx.strokeStyle = hot > 0.05 ? "rgba(200,55,45," + (0.25 + 0.4 * hot) + ")" : "rgba(" + FLOWS[l.f] + ",.32)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y); ctx.lineTo(l.b.x, l.b.y); ctx.stroke();
    });
    ctx.setLineDash([]);
    if (BEAD) {
      var bx = BEAD.from.x + (BEAD.to.x - BEAD.from.x) * BEAD.p, by = BEAD.from.y + (BEAD.to.y - BEAD.from.y) * BEAD.p;
      ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, Math.PI * 2); ctx.fillStyle = "#c8372d"; ctx.fill();   // a single red dot travelling the line
    }
    var R = reach();
    ctx.setLineDash([5, 6]);
    for (var i = 0; i < dots.length; i++) {
      for (var j = i + 1; j < dots.length; j++) {
        var a = dots[i], b = dots[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 > R * R) continue;
        var k = 1 - Math.sqrt(d2) / R, hot = Math.min(a.glow, b.glow), faint = (a.hidden || b.hidden) ? 0.35 : 1;
        ctx.strokeStyle = hot > 0.05 ? "rgba(200,55,45," + (0.2 + 0.4 * hot) + ")" : "rgba(" + FLOWS[(i * 7 + j * 3) % FLOWS.length] + "," + (0.16 + 0.4 * k) * faint + ")";
        ctx.lineWidth = hot > 0.05 ? 1.6 : 1.1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    dots.forEach(function (a) {
      if (a.glow > 0) {
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 3 + 7 * (1 - a.glow), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(200,55,45," + a.glow * 0.4 + ")"; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      if (a.hidden && a.glow < 0.05) {                      // hidden: a faint outline until a ripple reveals it
        ctx.globalAlpha = 0.28; ctx.fillStyle = a.c; ctx.fill(); ctx.globalAlpha = 1;
        ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(29,41,37,.45)"; ctx.stroke(); ctx.setLineDash([]);
      } else {
        ctx.fillStyle = a.c; ctx.fill();
        if (a.glow > 0.05) { ctx.globalAlpha = Math.min(1, a.glow * 0.85); ctx.fillStyle = RED; ctx.fill(); ctx.globalAlpha = 1; }
        ctx.lineWidth = 1; ctx.strokeStyle = "rgba(29,41,37,.25)"; ctx.stroke();
      }
    });
    labels();
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    step(dt); draw();
    requestAnimationFrame(frame);
  }
  var userPaused = false, optIn = false, visible = true;
  var btn = document.getElementById("flux-pause");
  function start() { if (running || userPaused || !visible || (reduce && !optIn)) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }
  function setBtn() { if (!btn) return; var on = running || (!userPaused && !(reduce && !optIn)); btn.textContent = on ? "Pause" : "Play"; btn.setAttribute("aria-pressed", on ? "false" : "true"); }
  if (btn) btn.addEventListener("click", function () {
    if (running) { userPaused = true; stop(); } else { userPaused = false; optIn = true; start(); }
    setBtn();
  });
  function trigger(d) {                                  // a visitor's own change, from the dot they chose
    var dir = DIR[cellOf(d)], ang = dir.a + dir.s * t;
    d.hops = 5; d.fan = 2; d.dx = Math.cos(ang); d.dy = Math.sin(ang); d.glow = 1; d.wait = -1;
    spread(d);
    if (!running) { userPaused = false; optIn = true; start(); setBtn(); }
    if (!running) draw();
  }
  cv.addEventListener("click", function (e) {
    var b = cv.getBoundingClientRect(), x = e.clientX - b.left - cv.clientLeft, y = e.clientY - b.top - cv.clientTop;
    var best = null, bd = 1e9;
    dots.forEach(function (d) { var dd = Math.hypot(d.x - x, d.y - y); if (dd < bd) { bd = dd; best = d; } });
    if (best && bd < 70) trigger(best);
  });
  cv.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(dots[Math.floor(Math.random() * dots.length)]); }
  });

  size();
  if (reduce) { for (var i = 0; i < 240; i++) step(0.05); draw(); }
  else draw();
  if ("ResizeObserver" in window) new ResizeObserver(function () { size(); draw(); }).observe(cv);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.isIntersecting; visible ? start() : stop(); }); }, { threshold: 0.1 }).observe(cv);
  } else start();
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  setBtn();
})();
