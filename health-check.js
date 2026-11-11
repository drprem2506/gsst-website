/* GSST Systems Thinking Health Check: everything runs in the visitor's browser. */
(function () {
  "use strict";

  var EMAIL = "globalsystemsthinking@gmail.com";
  var STORE_KEY = "gsst-health-check-last";

  var AREAS = [
    { id: "patterns", name: "Patterns over time" },
    { id: "cause", name: "Cause and effect" },
    { id: "beliefs", name: "Beliefs" },
    { id: "conditions", name: "Changing conditions" }
  ];

  var STATEMENTS = [
    ["patterns", "We look at trends over months or years, not just this month's figures."],
    ["patterns", "When a problem comes back, we check whether it has happened before and when."],
    ["patterns", "We keep records that let us see how things have changed over time."],
    ["patterns", "We review past projects and incidents to see what keeps repeating."],
    ["cause", "We understand how decisions in one team affect other teams."],
    ["cause", "Our fixes address the causes of problems, not just the symptoms."],
    ["cause", "We consider what a decision might lead to later, not only its immediate effect."],
    ["cause", "Teams work on shared problems together rather than in silos."],
    ["beliefs", "We test our assumptions before we act on them."],
    ["beliefs", "People can question “the way we have always done it” without being dismissed."],
    ["beliefs", "We listen to views from every level, including the most junior."],
    ["beliefs", "Our leaders change their minds when the evidence changes."],
    ["conditions", "We spot early warning signs before a problem becomes a crisis."],
    ["conditions", "We consider how changes outside the organisation could affect us, and how we affect them."],
    ["conditions", "We try out new approaches on a small scale before rolling them out."],
    ["conditions", "We regularly ask what could change in the next few years and how we would respond."]
  ];

  var TOOLS = [
    { id: "workshop", name: "Classroom or workshop training", helps: "Building shared skills and language", areas: [],
      tip: "Training sticks best when participants practise on their own organisation's issues." },
    { id: "elearning", name: "E-learning courses", helps: "Individual knowledge at scale", areas: [],
      tip: "E-learning builds knowledge; pairing it with team discussion helps it change practice." },
    { id: "coaching", name: "Coaching or mentoring", helps: "Individual reflection and behaviour change", areas: ["beliefs"],
      tip: "Coaching works best with clear goals and time to reflect between sessions." },
    { id: "reviews", name: "After-action reviews or project debriefs", helps: "Learning from what happened", areas: ["patterns"],
      tip: "Reviews help most when they look for patterns across projects, not just one event." },
    { id: "dashboards", name: "Data dashboards and reports", helps: "Seeing patterns over time", areas: ["patterns"],
      tip: "Dashboards help most when they show trends over time rather than single figures." },
    { id: "mapping", name: "Process or systems mapping", helps: "Seeing cause and effect", areas: ["cause"],
      tip: "Maps help most when the people who do the work draw them together." },
    { id: "scenarios", name: "Scenario planning", helps: "Preparing for changing conditions", areas: ["conditions"],
      tip: "Scenarios help most when they lead to early warning signs that you then watch." },
    { id: "pilots", name: "Pilots and small experiments", helps: "Testing beliefs safely", areas: ["beliefs", "conditions"],
      tip: "Pilots help most when you agree beforehand what result would change your mind." }
  ];

  var PROFILES = [
    { max: 2.5, name: "Firefighting", text: "Your organisation mostly reacts to events as they happen. Problems are handled quickly, but many of them come back." },
    { max: 3.5, name: "Noticing patterns", text: "Your organisation sees some patterns, but they are not yet used to change how decisions are made." },
    { max: 4.3, name: "Connecting the system", text: "Your organisation links patterns to their causes and often acts before problems grow. The next step is making this consistent across teams." },
    { max: 99, name: "Systems-led", text: "Systems thinking is part of how your organisation works. The challenge now is to keep it strong as conditions change." }
  ];

  var ADVICE = {
    patterns: {
      tips: ["Pick one recurring problem and chart how often it has happened over the past year.",
             "Review trends quarterly, not only monthly results.",
             "Ask “when did this happen before?” at the start of problem-solving meetings."],
      service: "Brown Bag Talk", why: "to build awareness of patterns across a team" },
    cause: {
      tips: ["Map how one recent decision affected other teams.",
             "Ask “and then what?” three times before agreeing a fix.",
             "Check whether last year's fixes created new problems elsewhere."],
      service: "Consulting and Facilitation", why: "to map the systems behind a persistent challenge" },
    beliefs: {
      tips: ["List the assumptions behind one current plan and test the weakest.",
             "Invite the most junior person in the room to speak first.",
             "Name one “we have always done it this way” practice and question it."],
      service: "One-to-One Coaching", why: "to work on how leaders frame problems" },
    conditions: {
      tips: ["Agree two or three early warning signs for your biggest risk and watch them.",
             "Run a short “what if conditions change?” session each quarter.",
             "Pilot one change on a small scale before rolling it out."],
      service: "Thinking Smarter Programme", why: "to build capability across the organisation" }
  };

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) { for (var k in attrs) { if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]); } }
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function areaName(id) { for (var i = 0; i < AREAS.length; i++) if (AREAS[i].id === id) return AREAS[i].name; return id; }
  function fmt(n) { return n.toFixed(1); }

  /* ---------- build the form ---------- */
  function scale(name, labelledBy) {
    var g = el("div", { "class": "scale", role: "radiogroup", "aria-labelledby": labelledBy });
    for (var v = 1; v <= 5; v++) {
      var id = name + "-" + v;
      var input = el("input", { type: "radio", name: name, id: id, value: String(v) });
      var lab = el("label", { "for": id }, String(v));
      g.appendChild(input); g.appendChild(lab);
    }
    return g;
  }

  function buildStatements() {
    var host = document.getElementById("hc-statements");
    var n = 0;
    AREAS.forEach(function (area) {
      var group = el("fieldset", { "class": "hc-area" });
      group.appendChild(el("legend", null, esc(area.name)));
      STATEMENTS.forEach(function (st, i) {
        if (st[0] !== area.id) return;
        n++;
        var row = el("div", { "class": "hc-row" });
        var qid = "q" + i + "-label";
        row.appendChild(el("p", { "class": "hc-q", id: qid }, "<span class=\"hc-num\">" + n + "</span>" + esc(st[1])));
        row.appendChild(scale("q" + i, qid));
        group.appendChild(row);
      });
      host.appendChild(group);
    });
    var legend = el("p", { "class": "scale-key" }, "<span>1 = strongly disagree</span><span>5 = strongly agree</span>");
    host.insertBefore(legend, host.firstChild);
  }

  function buildTools() {
    var host = document.getElementById("hc-tools");
    TOOLS.forEach(function (t) {
      var row = el("div", { "class": "hc-tool" });
      var cid = "tool-" + t.id;
      var check = el("div", { "class": "hc-tool-check" });
      check.appendChild(el("input", { type: "checkbox", id: cid, value: t.id }));
      check.appendChild(el("label", { "for": cid }, "<strong>" + esc(t.name) + "</strong><span>" + esc(t.helps) + "</span>"));
      row.appendChild(check);
      var rate = el("div", { "class": "hc-tool-rate", hidden: "" });
      var rl = "rate-" + t.id + "-label";
      rate.appendChild(el("span", { "class": "hc-rate-label", id: rl }, "How effective?"));
      rate.appendChild(scale("rate-" + t.id, rl));
      row.appendChild(rate);
      host.appendChild(row);
      check.querySelector("input").addEventListener("change", function (e) {
        rate.hidden = !e.target.checked;
      });
    });
  }

  function value(name) {
    var c = document.querySelector('input[name="' + name + '"]:checked');
    return c ? Number(c.value) : null;
  }

  function updateProgress() {
    var done = 0;
    STATEMENTS.forEach(function (_, i) { if (value("q" + i) !== null) done++; });
    document.getElementById("hc-progress").textContent = done + " of " + STATEMENTS.length + " statements answered";
    return done;
  }

  /* ---------- scoring ---------- */
  function collect() {
    var answers = STATEMENTS.map(function (_, i) { return value("q" + i); });
    var areas = AREAS.map(function (a) {
      var vals = [];
      STATEMENTS.forEach(function (st, i) { if (st[0] === a.id) vals.push(answers[i]); });
      var sum = vals.reduce(function (s, v) { return s + v; }, 0);
      return { id: a.id, name: a.name, score: sum / vals.length };
    });
    var overall = answers.reduce(function (s, v) { return s + v; }, 0) / answers.length;
    var tools = [];
    TOOLS.forEach(function (t) {
      var box = document.getElementById("tool-" + t.id);
      if (box && box.checked) tools.push({ tool: t, rating: value("rate-" + t.id) });
    });
    return {
      date: new Date().toISOString().slice(0, 10),
      overall: overall,
      areas: areas,
      tools: tools,
      thursday: document.getElementById("hc-thursday").value.trim()
    };
  }

  function profileFor(score) {
    for (var i = 0; i < PROFILES.length; i++) if (score < PROFILES[i].max) return PROFILES[i];
    return PROFILES[PROFILES.length - 1];
  }

  function toolNotes(r, lowestId) {
    var notes = [];
    r.tools.forEach(function (x) {
      if (x.rating !== null && x.rating <= 2) {
        notes.push("You use " + x.tool.name.toLowerCase() + " but rate them as not very effective. " + x.tool.tip);
      }
    });
    var supports = r.tools.some(function (x) { return x.tool.areas.indexOf(lowestId) !== -1; });
    if (!supports) {
      var helpers = TOOLS.filter(function (t) { return t.areas.indexOf(lowestId) !== -1; })
                         .map(function (t) { return t.name.toLowerCase(); });
      if (helpers.length) {
        notes.push("None of the tools you use supports your lowest area, " + areaName(lowestId).toLowerCase() +
                   ". Consider " + helpers.join(" or ") + ".");
      }
    }
    return notes;
  }

  /* ---------- dashboard ---------- */
  function loadLast() {
    try { var raw = window.localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function saveLast(r) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({
        date: r.date, overall: r.overall,
        areas: r.areas.map(function (a) { return { id: a.id, score: a.score }; })
      }));
    } catch (e) { /* storage unavailable: results still show */ }
  }

  function summaryText(r, prof, lowest) {
    var lines = [];
    lines.push("Systems Thinking Health Check results (" + r.date + ")");
    lines.push("");
    lines.push("Profile: " + prof.name + " (overall " + fmt(r.overall) + " out of 5)");
    r.areas.forEach(function (a) { lines.push("- " + a.name + ": " + fmt(a.score)); });
    lines.push("Lowest area: " + lowest.name);
    lines.push("");
    lines.push("Learning tools in use:");
    if (r.tools.length) {
      r.tools.forEach(function (x) {
        lines.push("- " + x.tool.name + (x.rating ? ": rated " + x.rating + " out of 5" : ": not rated"));
      });
    } else { lines.push("- None selected"); }
    if (r.thursday) { lines.push(""); lines.push("The problem that keeps coming back: " + r.thursday); }
    lines.push("");
    lines.push("I would like to discuss what these results mean for our organisation.");
    return lines.join("\n");
  }

  function render(r, last) {
    var prof = profileFor(r.overall);
    var sorted = r.areas.slice().sort(function (a, b) { return a.score - b.score; });
    var lowest = sorted[0], strongest = sorted[sorted.length - 1];
    var adv = ADVICE[lowest.id];
    var notes = toolNotes(r, lowest.id);
    var summary = summaryText(r, prof, lowest);
    var mail = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Systems Thinking Health Check results") +
               "&body=" + encodeURIComponent(summary);

    var bars = r.areas.map(function (a) {
      var tag = a.id === lowest.id ? "<span class=\"tag tag-low\">Lowest</span>" :
                a.id === strongest.id ? "<span class=\"tag tag-high\">Strongest</span>" : "";
      var prev = "";
      if (last && last.areas) {
        var p = last.areas.filter(function (x) { return x.id === a.id; })[0];
        if (p) {
          var d = a.score - p.score;
          prev = "<span class=\"delta\">" + (d > 0.05 ? "+" + fmt(d) : d < -0.05 ? fmt(d) : "no change") + " since " + esc(last.date) + "</span>";
        }
      }
      return "<div class=\"bar-row\"><div class=\"bar-label\"><span>" + esc(a.name) + "</span>" + tag + "</div>" +
             "<div class=\"bar-track\" role=\"img\" aria-label=\"" + esc(a.name) + " " + fmt(a.score) + " out of 5\">" +
             "<div class=\"bar-fill" + (a.id === lowest.id ? " low" : "") + "\" style=\"width:" + (a.score / 5 * 100) + "%\"></div></div>" +
             "<div class=\"bar-value\">" + fmt(a.score) + "</div>" + (prev ? "<div class=\"bar-prev\">" + prev + "</div>" : "") + "</div>";
    }).join("");

    var toolsHtml = r.tools.length ? "<ul class=\"tool-list\">" + r.tools.map(function (x) {
      var dots = "";
      for (var i = 1; i <= 5; i++) dots += "<span class=\"dot" + (x.rating && i <= x.rating ? " on" : "") + "\"></span>";
      return "<li><span>" + esc(x.tool.name) + "</span><span class=\"dots\" aria-label=\"" +
             (x.rating ? "rated " + x.rating + " out of 5" : "not rated") + "\">" + dots + "</span></li>";
    }).join("") + "</ul>" : "<p class=\"muted\">No learning tools selected.</p>";

    var notesHtml = notes.length ? "<ul class=\"notes\">" + notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" : "";

    var prevOverall = last ? "<p class=\"muted\">Last time (" + esc(last.date) + "): " + fmt(last.overall) + " out of 5, " + esc(profileFor(last.overall).name) + ".</p>" : "";

    var html =
      "<div class=\"dash-head\">" +
        "<span class=\"eyebrow\">Your results &middot; " + esc(r.date) + "</span>" +
        "<h2>" + esc(prof.name) + "</h2>" +
        "<p class=\"lead\">" + esc(prof.text) + "</p>" +
        "<p class=\"overall\"><strong>" + fmt(r.overall) + "</strong> out of 5 overall</p>" + prevOverall +
      "</div>" +
      "<div class=\"dash-grid\">" +
        "<div class=\"card\"><h3>Your four areas</h3>" + bars + "</div>" +
        "<div class=\"card\"><h3>Your learning tools</h3>" + toolsHtml + notesHtml + "</div>" +
      "</div>" +
      (r.thursday ? "<div class=\"card thursday\"><h3>Your Thursday</h3><p class=\"quote\">“" + esc(r.thursday) +
        "”</p><p class=\"muted\">Which of the four areas does this problem sit in? Your lowest area, " +
        esc(lowest.name.toLowerCase()) + ", is a good place to start.</p></div>" : "") +
      "<div class=\"dash-grid\">" +
        "<div class=\"card\"><h3>Try this month: " + esc(lowest.name.toLowerCase()) + "</h3><ol class=\"tips\">" +
          adv.tips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol></div>" +
        "<div class=\"card next\"><h3>Suggested next step</h3><p><strong>" + esc(adv.service) + "</strong>, " + esc(adv.why) + ".</p>" +
          "<p class=\"muted\">Send us your results and we will suggest how to take this further.</p>" +
          "<div class=\"actions no-print\">" +
            "<a class=\"btn btn-primary\" href=\"" + mail + "\">Email my results to GSST</a>" +
            "<button type=\"button\" class=\"btn btn-ghost\" id=\"hc-copy\">Copy summary</button>" +
          "</div>" +
          "<p class=\"muted small no-print\" id=\"hc-copy-status\" aria-live=\"polite\">Or email " + EMAIL + " with your summary.</p>" +
        "</div>" +
      "</div>" +
      "<div class=\"actions dash-foot no-print\">" +
        "<button type=\"button\" class=\"btn btn-ghost\" id=\"hc-print\">Print or save as PDF</button>" +
        "<button type=\"button\" class=\"btn btn-ghost\" id=\"hc-retake\">Retake the Health Check</button>" +
        "<a class=\"btn btn-ghost\" href=\"index.html#services\">See our services</a>" +
      "</div>" +
      "<p class=\"muted small\">Your answers stay on your device. Nothing is sent to GSST unless you email your results.</p>";

    var dash = document.getElementById("hc-dash");
    dash.innerHTML = html;

    document.getElementById("hc-copy").addEventListener("click", function () {
      var status = document.getElementById("hc-copy-status");
      try {
        navigator.clipboard.writeText(summary).then(function () {
          status.textContent = "Summary copied. Paste it into an email to " + EMAIL + ".";
        }, function () { status.textContent = "Copying is not available here. Please email " + EMAIL + "."; });
      } catch (e) { status.textContent = "Copying is not available here. Please email " + EMAIL + "."; }
    });
    document.getElementById("hc-print").addEventListener("click", function () {
      try { window.print(); } catch (e) { /* printing unavailable */ }
    });
    document.getElementById("hc-retake").addEventListener("click", function () {
      document.getElementById("hc-results").hidden = true;
      document.getElementById("hc-form-section").hidden = false;
      document.querySelector(".page-intro").hidden = false;
      window.scrollTo(0, 0);
    });
  }

  /* ---------- wire up ---------- */
  function init() {
    if (!document.getElementById("hc-form")) return;
    buildStatements();
    buildTools();
    var form = document.getElementById("hc-form");
    form.addEventListener("change", updateProgress);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var done = updateProgress();
      var firstMissing = null;
      STATEMENTS.forEach(function (_, i) {
        var answered = value("q" + i) !== null;
        var row = document.getElementById("q" + i + "-label").parentNode;
        row.classList.toggle("missing", !answered);
        if (!answered && !firstMissing) firstMissing = row;
      });
      if (done < STATEMENTS.length) {
        document.getElementById("hc-progress").textContent =
          (STATEMENTS.length - done) + " statement" + (STATEMENTS.length - done === 1 ? "" : "s") + " still to answer. They are highlighted above.";
        if (firstMissing) firstMissing.scrollIntoView({ block: "center" });
        return;
      }
      var r = collect();
      var last = loadLast();
      render(r, last);
      saveLast(r);
      document.getElementById("hc-form-section").hidden = true;
      document.querySelector(".page-intro").hidden = true;
      document.getElementById("hc-results").hidden = false;
      window.scrollTo(0, 0);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
