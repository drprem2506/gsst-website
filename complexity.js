/* GSST home page: a world in flux. Dots (variables) of three sizes drift and link with dashed lines;
   every few seconds one changes and the change ripples out along its links. Runs only while on screen. */
(function () {
  var cv = document.getElementById("flux");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var COLS = ["#f4b2a1", "#f9d48a", "#9fd8e6", "#c9b6e8", "#a6dcbc"];
  var LINK = "rgba(44,122,85,";
  var RIPPLE = "#c8372d";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, dpr = 1, dots = [], running = false, last = 0, nextPulse = 2.5, t = 0;

  function seed() {
    var n = Math.round(Math.max(18, Math.min(42, (W * H) / 9000)));
    dots = [];
    for (var i = 0; i < n; i++) {
      var k = Math.random();
      var r = k < 0.15 ? 13 : k < 0.5 ? 8 : 4.5;           // big, medium, small variables
      dots.push({
        x: 0, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14,
        r: r, c: COLS[i % COLS.length], glow: 0, wait: -1, hidden: Math.random() < 0.35,
        home: ((i % 3) + 0.15 + Math.random() * 0.7) / 3   // a loose home area, so every area keeps some dots
      });
    }
    dots.forEach(function (d) { d.x = d.home * W; });
  }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    var oW = W, oH = H;
    W = Math.max(1, cv.clientWidth); H = Math.max(1, cv.clientHeight);   // inside the border, so it draws pixel for pixel
    if (dots.length && oW > 1 && (oW !== W || oH !== H)) dots.forEach(function (d) { d.x *= W / oW; d.y *= H / oH; });
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!dots.length && W > 40) seed();
  }
  var SET_SECS = 7;
  var SETS = [["One person", "A family", "A community"], ["A school", "A team", "An organisation"], ["One nation", "Another nation", "A region"]];   // widening, from one person to the wider world
  var REACH = function () { return Math.max(90, Math.min(150, W / 5)); };

  function step(dt) {
    t += dt;
    var reach = REACH();
    for (var i = 0; i < dots.length; i++) {
      var a = dots[i], fx = 0, fy = 0;
      for (var j = 0; j < dots.length; j++) {
        if (i === j) continue;
        var b = dots[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < reach) {                                   // gentle pull: loose clusters emerge
          var pull = (d - reach * 0.55) / reach;
          fx += (dx / d) * pull * 1.4; fy += (dy / d) * pull * 1.4;
        }
        if (d < a.r + b.r + 28) { fx -= (dx / d) * 16; fy -= (dy / d) * 16; }   // keep apart
      }
      fx += (a.home * W - a.x) * 0.012;                    // gentle pull back towards its home area
      // a slowly turning current, so the whole field keeps moving
      fx += Math.cos(t * 0.2 + a.y * 0.012 + a.r) * 6;
      fy += Math.sin(t * 0.17 + a.x * 0.012 + a.r) * 6;
      a.vx = (a.vx + fx * dt) * 0.985; a.vy = (a.vy + fy * dt) * 0.985;
      var sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy), max = 34 / Math.sqrt(a.r / 4.5);
      if (sp > max) { a.vx *= max / sp; a.vy *= max / sp; }
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < a.r) { a.x = a.r; a.vx = Math.abs(a.vx); } if (a.x > W - a.r) { a.x = W - a.r; a.vx = -Math.abs(a.vx); }
      if (a.y < a.r) { a.y = a.r; a.vy = Math.abs(a.vy); } if (a.y > H - a.r) { a.y = H - a.r; a.vy = -Math.abs(a.vy); }
      if (a.glow > 0) a.glow = Math.max(0, a.glow - dt * 0.7);
      if (a.wait >= 0) { a.wait -= dt; if (a.wait < 0) { a.glow = 1; spread(a, a.hops || 0); } }
    }
    nextPulse -= dt;
    if (nextPulse <= 0) {                                  // one small change...
      var s = dots[Math.floor(Math.random() * dots.length)];
      s.glow = 1; spread(s, 2); nextPulse = 6 + Math.random() * 3;
    }
  }
  function spread(src, hops) {                             // ...ripples to its neighbours, then theirs
    if (hops <= 0) return;
    var reach = REACH();
    var near = dots.filter(function (b) {
      if (b === src || b.glow > 0.2 || b.wait >= 0) return false;
      var dx = b.x - src.x, dy = b.y - src.y; return dx * dx + dy * dy < reach * reach;
    }).sort(function (p, q) { return Math.hypot(p.x - src.x, p.y - src.y) - Math.hypot(q.x - src.x, q.y - src.y); }).slice(0, 2);
    near.forEach(function (b) { b.wait = 0.6 + Math.random() * 0.4; b.hops = hops - 1; });   // a path, not a burst
  }

  function boundaries() {                                  // faint lines between teams: each sees only its part
    var n = W < 520 ? 2 : 3;
    ctx.save();
    ctx.strokeStyle = "rgba(86,101,95,.32)"; ctx.lineWidth = 2; ctx.setLineDash([2, 7]);
    for (var i = 1; i < n; i++) { var x = Math.round(W * i / n) + 0.5; ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, H - 10); ctx.stroke(); }
    ctx.restore();
  }
  function labels() {                                      // drawn last, so dots never cover them
    var k = Math.floor(t / SET_SECS) % SETS.length, ph = (t % SET_SECS) / SET_SECS;
    var fadeA = Math.min(1, ph * 8, (1 - ph) * 8);            // fade in and out as the labels change
    if (!SETS[k]) return;
    var zones = SETS[k].slice(0, W < 520 ? 2 : 3), n = zones.length;
    ctx.save(); ctx.globalAlpha = fadeA;
    ctx.font = "600 13px 'Source Sans 3', system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (var j = 0; j < n; j++) {
      var x = W * (j + 0.5) / n, y = H - 16, w = ctx.measureText(zones[j]).width + 16;
      ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 11, w, 22, 11); else ctx.rect(x - w / 2, y - 11, w, 22);
      ctx.fill();
      ctx.fillStyle = "rgba(86,101,95,.9)"; ctx.fillText(zones[j], x, y);
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    boundaries();
    var reach = REACH();
    ctx.setLineDash([5, 6]);
    for (var i = 0; i < dots.length; i++) {
      for (var j = i + 1; j < dots.length; j++) {
        var a = dots[i], b = dots[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 > reach * reach) continue;
        var k = 1 - Math.sqrt(d2) / reach, hot = Math.min(a.glow, b.glow);
        var faint = (a.hidden || b.hidden) ? 0.35 : 1;
        ctx.strokeStyle = hot > 0.05 ? "rgba(200,55,45," + (0.2 + 0.4 * hot) + ")" : LINK + (0.15 + 0.45 * k) * faint + ")";
        ctx.lineWidth = hot > 0.05 ? 1.6 : 1.2;
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
        if (a.glow > 0.05) { ctx.globalAlpha = Math.min(1, a.glow * 0.85); ctx.fillStyle = RIPPLE; ctx.fill(); ctx.globalAlpha = 1; }
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
  function start() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  size();
  if (reduce) { for (var i = 0; i < 240; i++) step(0.05); draw(); }   // a still picture of the same idea
  else draw();
  if ("ResizeObserver" in window) new ResizeObserver(function () { size(); draw(); }).observe(cv);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.1 }).observe(cv);
  } else start();
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
})();
