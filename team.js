/* GSST Team Health Check: participant page (team.html) and facilitator live screen (session.html). */
(function () {
  "use strict";

  var ENDPOINT = "https://script.google.com/macros/s/AKfycbw_pX-eAvm-QaGTLADu6RY6bb-65RiuWouXvSr3eJKB6TKcOi8VecgTOIo18xHAQvfL/exec";
  var POLL_MS = 6000;
  var MIN_FOR_TEAM = 3;

  var AREAS = [
    { id: "patterns", name: "Patterns over time" },
    { id: "cause", name: "Cause and effect" },
    { id: "beliefs", name: "Beliefs" },
    { id: "conditions", name: "Changing conditions" }
  ];
  var STATEMENTS = [
    "We look at trends over months or years, not just this month's figures.",
    "When a problem comes back, we check whether it has happened before and when.",
    "We keep records that let us see how things have changed over time.",
    "We review past projects and incidents to see what keeps repeating.",
    "We understand how decisions in one team affect other teams.",
    "Our fixes address the causes of problems, not just the symptoms.",
    "We consider what a decision might lead to later, not only its immediate effect.",
    "Teams work on shared problems together rather than in silos.",
    "We test our assumptions before we act on them.",
    "People can question “the way we have always done it” without being dismissed.",
    "We listen to views from every level, including the most junior.",
    "Our leaders change their minds when the evidence changes.",
    "We spot early warning signs before a problem becomes a crisis.",
    "We consider how changes outside the organisation could affect us, and how we affect them.",
    "We try out new approaches on a small scale before rolling them out.",
    "We regularly ask what could change in the next few years and how we would respond."
  ];
  var ORDER = [];
  for (var k = 0; k < 4; k++) for (var a = 0; a < 4; a++) ORDER.push(a * 4 + k);

  function $(id) { return document.getElementById(id); }
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(n) { return Number(n).toFixed(1); }
  function validCode(c) { return /^[A-Z0-9]{4,8}$/.test(c); }
  function store(key, val) { try { if (val === undefined) return window.localStorage.getItem(key); window.localStorage.setItem(key, val); } catch (e) { return null; } return null; }

  /* ================= participant page ================= */
  function participant() {
    var params = new URLSearchParams(window.location.search);
    var code = (params.get("s") || "").toUpperCase();

    function start(c) {
      code = c;
      $("tm-join").hidden = true;
      $("tm-code-badge").textContent = "Session " + code;
      if (store("gsst-team-done-" + code) === "1") { showThanks(null); return; }
      $("tm-form-wrap").hidden = false;
    }

    $("tm-join-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var c = $("tm-code").value.trim().toUpperCase();
      if (!validCode(c)) { $("tm-join-msg").textContent = "Please check the code on the screen. It has 4 to 8 letters and numbers."; return; }
      start(c);
    });

    var host = $("tm-statements");
    ORDER.forEach(function (i, n) {
      var row = document.createElement("div");
      row.className = "hc-row";
      var qid = "t" + i + "-label";
      var html = "<p class=\"hc-q\" id=\"" + qid + "\"><span class=\"hc-num\">" + (n + 1) + "</span>" + esc(STATEMENTS[i]) + "</p><div class=\"scale\" role=\"radiogroup\" aria-labelledby=\"" + qid + "\">";
      for (var v = 1; v <= 5; v++) {
        html += "<input type=\"radio\" name=\"t" + i + "\" id=\"t" + i + "-" + v + "\" value=\"" + v + "\"><label for=\"t" + i + "-" + v + "\">" + v + "</label>";
      }
      row.innerHTML = html + "</div>";
      host.appendChild(row);
    });

    function val(i) { var c = document.querySelector('input[name="t' + i + '"]:checked'); return c ? Number(c.value) : null; }
    function progress() {
      var done = STATEMENTS.filter(function (_, i) { return val(i) !== null; }).length;
      $("tm-progress").textContent = done + " of 16 answered";
      return done;
    }
    $("tm-form").addEventListener("change", progress);

    $("tm-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      STATEMENTS.forEach(function (_, i) {
        var row = $("t" + i + "-label").parentNode;
        var miss = val(i) === null;
        row.classList.toggle("missing", miss);
        if (miss && !first) first = row;
      });
      if (progress() < 16) {
        $("tm-progress").textContent = "Please answer the highlighted statements.";
        if (first) first.scrollIntoView({ block: "center" });
        return;
      }
      var answers = STATEMENTS.map(function (_, i) { return val(i); });
      var payload = { type: "team", session: code, answers: answers, recurring: $("tm-recurring").value.trim() };
      $("tm-send").disabled = true;
      try {
        fetch(ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
                          body: JSON.stringify(payload), keepalive: true }).catch(function () {});
      } catch (err) { /* nothing more we can do */ }
      store("gsst-team-done-" + code, "1");
      showThanks(answers);
    });

    function showThanks(answers) {
      $("tm-form-wrap").hidden = true;
      $("tm-thanks").hidden = false;
      if (!answers) { $("tm-mine").innerHTML = "<p class=\"muted\">You have already answered for this session.</p>"; return; }
      var html = AREAS.map(function (a, ai) {
        var s = 0; for (var q = 0; q < 4; q++) s += answers[ai * 4 + q];
        var sc = s / 4;
        return "<div class=\"bar-row\"><div class=\"bar-label\"><span>" + esc(a.name) + "</span></div><div class=\"bar-track\"><div class=\"bar-fill\" style=\"width:" + (sc / 5 * 100) + "%\"></div></div><div class=\"bar-value\">" + fmt(sc) + "</div></div>";
      }).join("");
      $("tm-mine").innerHTML = "<h3>Your own view</h3>" + html + "<p class=\"muted small\">Only you can see this. The screen shows the team's combined results.</p>";
    }

    if (validCode(code)) start(code); else $("tm-join").hidden = false;
  }

  /* ================= facilitator live screen ================= */
  function facilitator() {
    var code = null, timer = null, last = null, showing = false;
    var CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    function newCode() {
      var c = "";
      var buf = new Uint32Array(6);
      (window.crypto || window.msCrypto).getRandomValues(buf);
      for (var i = 0; i < 6; i++) c += CHARS[buf[i] % CHARS.length];
      return c;
    }
    function joinUrl(c) {
      var base = window.location.href.split("#")[0].split("?")[0].replace(/[^\/]*$/, "");
      return base + "team.html?s=" + c;
    }

    function open(c) {
      code = c;
      store("gsst-last-session", code);
      $("ss-start").hidden = true;
      $("ss-live").hidden = false;
      $("ss-code").textContent = code;
      $("ss-code-small").textContent = code;
      var url = joinUrl(code);
      $("ss-url").textContent = url.replace(/^https?:\/\//, "");
      $("ss-qr").innerHTML = "";
      try { new window.QRCode($("ss-qr"), { text: url, width: 240, height: 240, correctLevel: window.QRCode.CorrectLevel.M }); }
      catch (e) { $("ss-qr").textContent = "QR code unavailable: use the link below."; }
      showResults(false);
      poll();
      if (timer) clearInterval(timer);
      timer = setInterval(poll, POLL_MS);
    }

    function poll() {
      if (!code) return;
      fetch(ENDPOINT + "?session=" + encodeURIComponent(code), { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          last = d;
          $("ss-count").textContent = d.n;
          $("ss-count-small").textContent = d.n;
          var ready = d.n >= MIN_FOR_TEAM;
          $("ss-show").disabled = !ready;
          $("ss-wait").textContent = ready ? "Ready to show results." :
            "Results appear once at least " + MIN_FOR_TEAM + " people have answered.";
          if (showing && ready) draw(d);
          $("ss-status").textContent = "Updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        })
        .catch(function () { $("ss-status").textContent = "Cannot reach the results right now. Retrying…"; });
    }

    function showResults(on) {
      showing = on;
      $("ss-join-view").hidden = on;
      $("ss-results-view").hidden = !on;
      document.body.classList.toggle("presenting", on);
      if (on && last && last.n >= MIN_FOR_TEAM) draw(last);
    }

    function dist(d) {
      var max = Math.max.apply(null, d.concat([1]));
      return "<div class=\"dist\">" + d.map(function (c, i) {
        return "<div class=\"dcol\"><div class=\"dbar\" style=\"height:" + (c / max * 100) + "%\"></div><span>" + (i + 1) + "</span></div>";
      }).join("") + "</div>";
    }

    function draw(d) {
      var areas = AREAS.map(function (a) { return { name: a.name, v: d.areas[a.id] }; });
      var low = areas.reduce(function (m, x, i) { return x.v < areas[m].v ? i : m; }, 0);
      $("ss-areas").innerHTML = areas.map(function (a, i) {
        return "<div class=\"bar-row\"><div class=\"bar-label\"><span>" + esc(a.name) + "</span>" + (i === low ? "<span class=\"tag tag-low\">Lowest</span>" : "") +
               "</div><div class=\"bar-track\"><div class=\"bar-fill" + (i === low ? " low" : "") + "\" style=\"width:" + (a.v / 5 * 100) + "%\"></div></div><div class=\"bar-value\">" + fmt(a.v) + "</div></div>";
      }).join("") + "<p class=\"muted\">Team average out of 5 &middot; overall " + fmt(d.overall) + "</p>";

      var prof = Object.keys(d.profiles);
      $("ss-profiles").innerHTML = prof.map(function (p) {
        return "<div class=\"bar-row\"><div class=\"bar-label\"><span>" + esc(p) + "</span></div><div class=\"bar-track\"><div class=\"bar-fill\" style=\"width:" + (d.profiles[p] / d.n * 100) + "%\"></div></div><div class=\"bar-value\">" + d.profiles[p] + "</div></div>";
      }).join("");

      var items = d.items.map(function (it, i) { return { i: i, sd: it.sd, mean: it.mean, dist: it.dist }; });
      var bySd = items.slice().sort(function (x, y) { return x.sd - y.sd; });
      function list(arr) {
        return arr.map(function (it) {
          return "<li><p>" + esc(STATEMENTS[it.i]) + "</p><div class=\"item-meta\">" + dist(it.dist) + "<span class=\"muted\">average " + fmt(it.mean) + "</span></div></li>";
        }).join("");
      }
      $("ss-agree").innerHTML = list(bySd.slice(0, 3));
      $("ss-differ").innerHTML = list(bySd.slice(-3).reverse());

      var rec = d.recurring || [];
      $("ss-recurring").innerHTML = rec.length ? rec.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") :
        "<li class=\"muted\">No answers yet.</li>";
    }

    $("ss-new").addEventListener("click", function () { open(newCode()); });
    $("ss-open-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var c = $("ss-existing").value.trim().toUpperCase();
      if (!validCode(c)) { $("ss-open-msg").textContent = "Codes have 4 to 8 letters and numbers."; return; }
      open(c);
    });
    $("ss-show").addEventListener("click", function () { showResults(true); });
    $("ss-hide").addEventListener("click", function () { showResults(false); });
    $("ss-end").addEventListener("click", function () {
      if (timer) clearInterval(timer);
      code = null; showing = false;
      document.body.classList.remove("presenting");
      $("ss-live").hidden = true; $("ss-start").hidden = false;
    });
    var prev = store("gsst-last-session");
    if (prev && validCode(prev)) $("ss-existing").value = prev;
  }

  function init() {
    if ($("tm-form")) participant();
    if ($("ss-start")) facilitator();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
